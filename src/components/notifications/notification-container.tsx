'use client';

import * as React from 'react';
import { Alert, AlertTitle, Box, IconButton, Slide } from '@mui/material';
import { CheckCircleIcon, XCircleIcon, InfoIcon, WarningIcon, XIcon } from '@phosphor-icons/react/dist/ssr';
import { useNotifications } from '@/contexts/notification-context';

const getIcon = (type: string) => {
  switch (type) {
    case 'success': {
      return <CheckCircleIcon size={20} />;
    }
    case 'error': {
      return <XCircleIcon size={20} />;
    }
    case 'warning': {
      return <WarningIcon size={20} />;
    }
    default: {
      return <InfoIcon size={20} />;
    }
  }
};

const getSeverity = (type: string): 'success' | 'error' | 'warning' | 'info' => {
  switch (type) {
    case 'success': {
      return 'success';
    }
    case 'error': {
      return 'error';
    }
    case 'warning': {
      return 'warning';
    }
    default: {
      return 'info';
    }
  }
};

export function NotificationContainer(): React.JSX.Element {
  const { notifications, hideNotification } = useNotifications();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        maxWidth: 400,
      }}
    >
      {notifications.map((notification) => (
        <Slide
          key={notification.id}
          direction="left"
          in={true}
          mountOnEnter
          unmountOnExit
        >
          <Alert
            severity={getSeverity(notification.type)}
            icon={getIcon(notification.type)}
            action={
              <IconButton
                size="small"
                color="inherit"
                onClick={() => hideNotification(notification.id)}
              >
                <XIcon size={16} />
              </IconButton>
            }
            sx={{
              boxShadow: 3,
              borderRadius: 2,
              animation: 'slideInRight 0.3s ease-out',
              '@keyframes slideInRight': {
                '0%': {
                  transform: 'translateX(100%)',
                  opacity: 0,
                },
                '100%': {
                  transform: 'translateX(0)',
                  opacity: 1,
                },
              },
            }}
          >
            <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>
              {notification.type === 'success' && 'Success!'}
              {notification.type === 'error' && 'Error!'}
              {notification.type === 'warning' && 'Warning!'}
              {notification.type === 'info' && 'Info'}
            </AlertTitle>
            {notification.message}
          </Alert>
        </Slide>
      ))}
    </Box>
  );
}
