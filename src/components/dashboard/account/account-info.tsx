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
import { useNotifications } from '@/contexts/notification-context';
import { apiClient } from '@/lib/api-client';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';

export function AccountInfo(): React.JSX.Element {
  const { user, checkSession } = useUser();
  const { showSuccess, showError } = useNotifications();
  const [uploading, setUploading] = React.useState(false);
  const router = useRouter();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profilePhoto', file);

      // Convert to base64 for now (in production, you'd upload to a file service)
      const reader = new FileReader();
      reader.addEventListener('load', async (e) => {
        try {
          const base64String = e.target?.result as string;
          
          // Update user profile with new photo
          await apiClient.updateUser(user?.id || '', {
            profilePhoto: base64String
          });

          // Refresh user data
          await checkSession?.();
          showSuccess('Profile photo updated successfully!');
        } catch (error) {
          console.error('Error updating profile photo:', error);
          showError('Failed to update profile photo');
        } finally {
          setUploading(false);
        }
      });
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      showError('Failed to upload profile photo');
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await authClient.signOut();
      if (error) {
        showError('Failed to sign out');
        return;
      }
      await checkSession?.();
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      showError('Failed to sign out');
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
            <Typography variant="h5">{user?.name || 'Loading...'}</Typography>
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
        <Stack spacing={1} sx={{ width: '100%' }}>
          <Button 
            fullWidth 
            variant="text"
            component="label"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload picture'}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </Button>
          <Button 
            fullWidth 
            variant="outlined"
            color="error"
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );
}
