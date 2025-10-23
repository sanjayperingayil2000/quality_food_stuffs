'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useUser } from '@/hooks/use-user';

export function AccountInfo(): React.JSX.Element {
  const { user } = useUser();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Implement file upload logic
      console.log('File selected:', file);
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <div>
            <Avatar 
              src={user?.profilePhoto || user?.avatar || '/assets/avatar.png'} 
              sx={{ height: '80px', width: '80px' }} 
            />
          </div>
          <Stack spacing={1} sx={{ textAlign: 'center' }}>
            <Typography variant="h5">{user?.name || 'User'}</Typography>
            <Typography color="text.secondary" variant="body2">
              {user?.city || 'N/A'} {user?.state || 'N/A'}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {user?.email || 'N/A'}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {user?.phone || 'N/A'}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
      <Divider />
      <CardActions>
        <Button 
          fullWidth 
          variant="text"
          component="label"
        >
          Upload picture
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleFileUpload}
          />
        </Button>
      </CardActions>
    </Card>
  );
}
