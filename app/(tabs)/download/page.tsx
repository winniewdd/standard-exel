import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function DownloadPage() {
  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Download
      </Typography>
      <Typography color="text.secondary">
        No files available for download.
      </Typography>
    </Box>
  );
}
