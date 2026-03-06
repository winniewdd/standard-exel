'use client';

import { usePathname } from 'next/navigation';
import Avatar from '@mui/material/Avatar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Link from 'next/link';

const tabs = [
  { label: 'Upload', href: '/upload' },
  { label: 'Download', href: '/download' },
];

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentTab = tabs.findIndex((tab) => pathname.startsWith(tab.href));

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 3,
          py: 1,
          bgcolor: 'white',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Avatar sx={{ bgcolor: '#1976d2' }}>U</Avatar>
        <Tabs value={currentTab === -1 ? 0 : currentTab}>
          {tabs.map((tab) => (
            <Tab
              key={tab.href}
              label={tab.label}
              component={Link}
              href={tab.href}
            />
          ))}
        </Tabs>
      </Box>
      <Box sx={{ p: 3 }}>{children}</Box>
    </Box>
  );
}
