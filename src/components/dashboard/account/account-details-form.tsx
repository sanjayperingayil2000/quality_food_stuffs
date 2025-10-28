'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import { useUser } from '@/hooks/use-user';
import { useNotifications } from '@/contexts/notification-context';
import { apiClient } from '@/lib/api-client';

const states = [
  { value: 'dubai', label: 'Dubai' },
  { value: 'abu-dhabi', label: 'Abu Dhabi' },
  { value: 'sharjah', label: 'Sharjah' },
  { value: 'ajman', label: 'Ajman' },
  { value: 'ras-al-khaimah', label: 'Ras Al Khaimah' },
  { value: 'fujairah', label: 'Fujairah' },
  { value: 'umm-al-quwain', label: 'Umm Al Quwain' },
] as const;

export function AccountDetailsForm(): React.JSX.Element {
  const { user, checkSession } = useUser();
  const { showSuccess, showError } = useNotifications();
  
  const [formData, setFormData] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    state: user?.state || '',
    city: user?.city || '',
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        state: user.state || '',
        city: user.city || '',
      });
    }
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await apiClient.updateProfile({
        phone: formData.phone,
        state: formData.state,
        city: formData.city,
      });
      
      // Refresh user data after update
      await checkSession?.();
      
      showSuccess('Profile updated successfully!');
    } catch {
      showError('Failed to update profile. Please try again.');
    }
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleSelectChange = (field: string) => (event: { target: { value: string } }) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <CardHeader subheader="The information can be edited" title="Profile" />
        <Divider />
        <CardContent sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
          <Grid container spacing={3} sx={{ width: '100%', maxWidth: '100%' }}>
            <Grid
              size={{
                xs: 12,
              }}
            >
              <FormControl fullWidth required>
                <InputLabel>Full name</InputLabel>
                <OutlinedInput 
                  value={user?.name || formData.name}
                  label="Full name" 
                  name="name"
                  disabled={true}
                />
              </FormControl>
            </Grid>
            <Grid
              size={{
                xs: 12,
              }}
            >
              <FormControl fullWidth required>
                <InputLabel>Email address</InputLabel>
                <OutlinedInput 
                  value={formData.email}
                  label="Email address" 
                  name="email"
                  disabled={true}
                />
              </FormControl>
            </Grid>
            <Grid
              size={{
                xs: 12,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>Phone number</InputLabel>
                <OutlinedInput 
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  label="Phone number" 
                  name="phone" 
                  type="tel" 
                />
              </FormControl>
            </Grid>
            <Grid
              size={{
                md: 6,
                xs: 12,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>State</InputLabel>
                <Select
                  value={formData.state}
                  onChange={handleSelectChange('state')}
                  label="State"
                  name="state"
                  variant="outlined"
                >
                  {states.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid
              size={{
                md: 6,
                xs: 12,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>City</InputLabel>
                <OutlinedInput 
                  value={formData.city}
                  onChange={handleChange('city')}
                  label="City" 
                  name="city"
                />
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button variant="contained" type="submit">Save details</Button>
        </CardActions>
      </Card>
    </form>
  );
}
