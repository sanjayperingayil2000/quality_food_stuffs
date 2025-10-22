'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { List as ListIcon, X as XIcon } from '@phosphor-icons/react';

import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';
import { isNavItemActive } from '@/lib/is-nav-item-active';
import { useUser } from '@/hooks/use-user';

import { navItems } from './config';
import { navIcons } from './nav-icons';

interface SideNavProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function SideNav({ open, setOpen }: SideNavProps): React.JSX.Element {
  const pathname = usePathname();
  const { user } = useUser();

  const toggleSidebar = () => setOpen((prev) => !prev);

  // Filter nav items based on user roles
  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (!user?.roles) return false;
    return item.roles.some((role) => user.roles?.includes(role));
  });

  return (
    <Box
      sx={{
        '--SideNav-background': 'var(--mui-palette-neutral-950)',
        '--SideNav-color': 'var(--mui-palette-common-white)',
        '--NavItem-color': 'var(--mui-palette-neutral-300)',
        '--NavItem-hover-background': 'rgba(255, 255, 255, 0.04)',
        '--NavItem-active-background': 'var(--mui-palette-primary-main)',
        '--NavItem-active-color': 'var(--mui-palette-primary-contrastText)',
        '--NavItem-disabled-color': 'var(--mui-palette-neutral-500)',
        '--NavItem-icon-color': 'var(--mui-palette-neutral-400)',
        '--NavItem-icon-active-color': 'var(--mui-palette-primary-contrastText)',
        '--NavItem-icon-disabled-color': 'var(--mui-palette-neutral-600)',
        bgcolor: 'var(--SideNav-background)',
        color: 'var(--SideNav-color)',
        display: { xs: 'flex', lg: 'flex' },
        flexDirection: 'column',
        height: '100vh',
        left: 0,
        position: 'fixed',
        top: 0,
        transition: 'width 0.3s ease',
        width: open ? 240 : 72,
        '@media (max-width: 1023px)': {
          width: open ? 280 : 0,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease, width 0.3s ease',
          backgroundColor: 'var(--SideNav-background)',
          boxShadow: open ? '2px 0 8px rgba(0,0,0,0.3)' : 'none',
        },
        zIndex: 1200,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Stack
        spacing={2}
        sx={{
          p: 2,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          minHeight: 56,
        }}
      >
        <Box
          component={RouterLink}
          href={paths.home}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'inherit',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {/* Logo / Square */}
          {/* <Box
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              borderRadius: 1,
              mr: open ? 1 : 0,
              transition: 'margin 0.3s ease',
            }}
          /> */}
          {open && (
            <Typography
              variant="h6"
              noWrap
              sx={{ fontWeight: 'bold', color: 'white', transition: 'opacity 0.3s ease' }}
            >
              Quality Food Stuffs
            </Typography>
          )}
        </Box>

        <IconButton onClick={toggleSidebar} sx={{ color: 'white', p: 0.5 }}>
          {open ? <XIcon size={20} /> : <ListIcon size={20} />}
        </IconButton>
      </Stack>

      <Divider sx={{ borderColor: 'var(--mui-palette-neutral-700)' }} />

      {/* Nav Items */}
      <Box
        component="nav"
        sx={{
          flex: '1 1 auto',
          overflowY: 'auto',
          p: 1,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 4,
          },
        }}
      >
        {renderNavItems({ pathname: pathname ?? '', items: filteredNavItems, open })}
      </Box>

      <Divider sx={{ borderColor: 'var(--mui-palette-neutral-700)' }} />
    </Box>
  );
}

function renderNavItems({
  items = [],
  pathname,
  open,
}: {
  items?: NavItemConfig[];
  pathname: string;
  open: boolean;
}): React.JSX.Element {
  return (
    <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {items.map(({ key, ...rest }) => (
        <NavItem key={key} pathname={pathname} open={open} {...rest} />
      ))}
    </Stack>
  );
}

interface NavItemProps extends Omit<NavItemConfig, 'items'> {
  pathname: string;
  open: boolean;
}

function NavItem({ disabled, external, href, icon, matcher, pathname, title, open }: NavItemProps): React.JSX.Element {
  const active = isNavItemActive({ disabled, external, href, matcher, pathname });
  const Icon = icon ? navIcons[icon] : null;

  return (
    <li>
      <Box
        {...(href
          ? {
            component: external ? 'a' : RouterLink,
            href,
            target: external ? '_blank' : undefined,
            rel: external ? 'noreferrer' : undefined,
          }
          : { role: 'button' })}
        sx={{
          alignItems: 'center',
          borderRadius: 1,
          color: 'var(--NavItem-color)',
          cursor: 'pointer',
          display: 'flex',
          flex: '0 0 auto',
          gap: 1,
          p: '6px 12px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          ...(disabled && {
            bgcolor: 'var(--NavItem-disabled-background)',
            color: 'var(--NavItem-disabled-color)',
            cursor: 'not-allowed',
          }),
          ...(active && { bgcolor: 'var(--NavItem-active-background)', color: 'var(--NavItem-active-color)' }),
        }}
      >
        {Icon && (
          <Box sx={{ display: 'flex', justifyContent: 'center', flex: '0 0 auto' }}>
            <Icon
              fill={active ? 'var(--NavItem-icon-active-color)' : 'var(--NavItem-icon-color)'}
              fontSize="var(--icon-fontSize-md)"
              weight={active ? 'fill' : undefined}
            />
          </Box>
        )}
        {open && (
          <Typography
            component="span"
            sx={{ color: 'inherit', fontSize: '0.875rem', fontWeight: 500, lineHeight: '28px' }}
          >
            {title}
          </Typography>
        )}
      </Box>
    </li>
  );
}