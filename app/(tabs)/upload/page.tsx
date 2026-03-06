'use client';

import { useState, useRef } from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import * as XLSX from 'xlsx';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

// 物流公司名称 -> 物流编码 映射
const LOGISTICS_CODE_MAP: Record<string, string> = {
  '邮政小包': 'youzhengguonei',
  '申通': 'shentong',
  '中通': 'zhongtong',
  '圆通': 'yuantong',
  '韵达': 'yunda',
  '极兔': 'jtexpress',
  '顺丰': 'shunfeng',
  '百世': 'baishi',
  'EMS': 'ems',
  '京东': 'jingdong',
  '德邦': 'debang',
};

type Row = (string | number)[];

function getLogisticsCode(companyStr: string): string {
  for (const [name, code] of Object.entries(LOGISTICS_CODE_MAP)) {
    if (companyStr.includes(name)) return code;
  }
  return '';
}

function normalizeExcelData(rawData: Row[]): Row[] {
  if (rawData.length < 4) return rawData;

  // Keep header rows (0-2) as-is
  const result: Row[] = rawData.slice(0, 3);
  const seen = new Set<string>();

  for (let i = 3; i < rawData.length; i++) {
    const row = [...rawData[i]];
    if (!row[1]) continue; // skip empty rows

    // 物流公司 (col 2): 保留原文不做删减
    const companyRaw = String(row[2] || '');
    const companies = companyRaw.split(/\s+/).filter(Boolean);

    // 物流编码 (col 3): 根据公司名映射编码
    // 物流单号 (col 4): 多单号拆分为多行
    const trackingRaw = String(row[4] || '');
    const trackingNumbers = trackingRaw.split(/[\r\n]+/).filter(Boolean);

    if (trackingNumbers.length <= 1) {
      // 单个单号，直接填充编码
      row[3] = getLogisticsCode(companyRaw);
      row[4] = trackingNumbers[0] || '';
      const key = row.map(c => String(c)).join('|');
      if (!seen.has(key)) {
        seen.add(key);
        result.push(row);
      }
    } else {
      // 多个单号，拆分为多行，每行一个单号
      for (let t = 0; t < trackingNumbers.length; t++) {
        const newRow = [...row];
        // 如果有多个物流公司，尝试对应；否则用最后一个
        const company = companies.length > 1 && t < companies.length
          ? companies[t]
          : companies[companies.length - 1] || companyRaw;
        newRow[2] = company;
        newRow[3] = getLogisticsCode(company);
        newRow[4] = trackingNumbers[t];
        const key = newRow.map(c => String(c)).join('|');
        if (!seen.has(key)) {
          seen.add(key);
          result.push(newRow);
        }
      }
    }
  }

  // 重新编号序号 (col 0)
  for (let i = 3; i < result.length; i++) {
    result[i][0] = i - 2;
  }

  return result;
}

export default function UploadPage() {
  const [fileName, setFileName] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [previewData, setPreviewData] = useState<Row[]>([]);
  const [fullData, setFullData] = useState<Row[]>([]);
  const [merges, setMerges] = useState<XLSX.Range[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setProcessing(true);
    setError('');
    setPreviewData([]);
    setFullData([]);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawData: Row[] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      // 保存原始表头的合并单元格信息
      const originalMerges = (ws['!merges'] || []) as XLSX.Range[];
      setMerges(originalMerges);

      const normalized = normalizeExcelData(rawData);
      setFullData(normalized);
      // Preview first 20 data rows + 3 header rows
      setPreviewData(normalized.slice(0, 23));
    } catch {
      setError('文件解析失败，请确认上传的是有效的 Excel 文件');
    } finally {
      setProcessing(false);
    }

    event.target.value = '';
  };

  const handleDownload = () => {
    if (fullData.length === 0) return;

    const ws = XLSX.utils.aoa_to_sheet(fullData);
    if (merges.length > 0) {
      ws['!merges'] = merges;
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'sheet1');

    const outputName = fileName.replace(/\.xlsx?$/i, '') + '_格式化.xlsx';
    XLSX.writeFile(wb, outputName);
  };

  const headers = previewData[2] as string[] | undefined;

  return (
    <Box sx={{ maxWidth: 1200 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        上传发货单
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        上传批量发货单 Excel 文件，自动格式化物流公司、物流编码和物流单号
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          component="label"
          variant="contained"
          startIcon={<CloudUploadIcon />}
        >
          选择文件
          <VisuallyHiddenInput
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
        </Button>

        {fullData.length > 0 && (
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
          >
            下载格式化文件
          </Button>
        )}
      </Box>

      {fileName && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          已选择: {fileName}
        </Typography>
      )}

      {processing && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">处理中...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      )}

      {fullData.length > 3 && (
        <Alert severity="success" sx={{ my: 2 }}>
          格式化完成！共 {fullData.length - 3} 条数据
        </Alert>
      )}

      {previewData.length > 3 && headers && (
        <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {headers.map((h, i) => (
                  <TableCell key={i} sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    {String(h)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {previewData.slice(3).map((row, ri) => (
                <TableRow key={ri}>
                  {headers.map((_, ci) => (
                    <TableCell key={ci} sx={{ whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {String(row[ci] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
