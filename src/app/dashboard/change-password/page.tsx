import * as React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { UpdatePasswordForm } from '@/components/dashboard/settings/update-password-form';

export default function Page(): React.JSX.Element {
  return (
    <Stack spacing={3} sx={{ pl: 2 }}>
      <div>
        <Typography variant="h4" sx={{ pl: 2 }}>Change Password</Typography>
      </div>
      <UpdatePasswordForm redirectToDashboardOnSuccess />
    </Stack>
  );
}
