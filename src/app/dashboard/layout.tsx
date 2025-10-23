'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import GlobalStyles from '@mui/material/GlobalStyles';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Backdrop from '@mui/material/Backdrop';
import { ListIcon } from '@phosphor-icons/react/dist/ssr/List';

import { AuthGuard } from '@/components/auth/auth-guard';
// import { MainNav } from '@/components/dashboard/layout/main-nav';
import { SideNav } from '@/components/dashboard/layout/side-nav';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  const [open, setOpen] = React.useState(true);

  // Auto-minimize menu on mobile screens
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200) {
        setOpen(false);
      } else {
        setOpen(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

        {/* Mobile Backdrop */}
        <Backdrop
          open={open}
          onClick={() => setOpen(false)}
          sx={{ 
            display: { xs: 'block', lg: 'none' },
            zIndex: 'calc(var(--SideNav-zIndex) - 1)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)',
          }}
        />

        {/* Mobile Header */}
        <AppBar 
          position="fixed" 
          sx={{ 
            display: { xs: 'block', lg: 'none' },
            zIndex: 'var(--MainNav-zIndex)',
            bgcolor: 'var(--mui-palette-background-paper)',
            color: 'var(--mui-palette-text-primary)',
            boxShadow: 1,
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setOpen(true)}
              sx={{ mr: 2 }}
            >
              <ListIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Quality Food Stuffs
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Main content */}
        <Box
          sx={{
            display: 'flex',
            flex: '1 1 auto',
            flexDirection: 'column',
            transition: 'margin-left 0.3s ease',
            ml: { 
              xs: 0, // No margin on mobile
              lg: open ? 'var(--SideNav-width)' : 'var(--SideNav-collapsed-width)' 
            },
            pt: { xs: '56px', lg: 0 }, // Add top padding for mobile header
          }}
        >
          {/* Page Content */}
          <main>
            <Container 
              maxWidth={false} 
              disableGutters 
              sx={{ 
                py: '24px',
                px: { xs: 2, sm: 3, md: 4 }, // Add horizontal padding for mobile
                maxWidth: '100%',
                overflow: 'hidden', // Prevent horizontal overflow
              }}
            >
              {children}
            </Container>
          </main>
        </Box>
      </Box>
    </AuthGuard>
  );
}
