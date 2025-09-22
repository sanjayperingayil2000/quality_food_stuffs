'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import GlobalStyles from '@mui/material/GlobalStyles';

import { AuthGuard } from '@/components/auth/auth-guard';
// import { MainNav } from '@/components/dashboard/layout/main-nav';
import { SideNav } from '@/components/dashboard/layout/side-nav';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  const [open, setOpen] = React.useState(true);

  return (
    <AuthGuard>
      <GlobalStyles
        styles={{
          body: {
            '--MainNav-height': '56px',
            '--MainNav-zIndex': 1000,
            '--SideNav-width': '240px',
            '--SideNav-collapsed-width': '72px',
            '--SideNav-zIndex': 1500,
            '--MobileNav-width': '320px',
            '--MobileNav-zIndex': 1100,
          },
        }}
      />

      <Box
        sx={{
          bgcolor: 'var(--mui-palette-background-default)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          minHeight: '100%',
        }}
      >
        {/* Fixed Sidebar */}
        <SideNav open={open} setOpen={setOpen} />

        {/* Main content */}
        <Box
          sx={{
            display: 'flex',
            flex: '1 1 auto',
            flexDirection: 'column',
            transition: 'margin-left 0.3s ease',
            ml: { lg: open ? 'var(--SideNav-width)' : 'var(--SideNav-collapsed-width)' },
          }}
        >
          {/* Top Navbar */}
          {/* <MainNav
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: (theme) => theme.zIndex.appBar,
              bgcolor: 'background.paper',
              }}
          /> */}

          {/* Page Content */}
          <main>
            <Container maxWidth={false} disableGutters sx={{ py: '24px' }}>
              {children}
            </Container>
          </main>
        </Box>
      </Box>
    </AuthGuard>
  );
}
