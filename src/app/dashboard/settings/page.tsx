import * as React from 'react';
import type { Metadata } from 'next';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { config } from '@/config';
// import { Notifications } from '@/components/dashboard/settings/notifications';
import { UpdatePasswordForm } from '@/components/dashboard/settings/update-password-form';
import { UserManagement } from '@/components/dashboard/settings/user-management';

export const metadata = { title: `Settings | Dashboard | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <Stack spacing={3} sx={{ pl: 2 }}>
      <div>
        <Typography variant="h4" sx={{ pl: 2 }}>Settings</Typography>
      </div>
      <UserManagement />
      {/* <Notifications /> */}
      <UpdatePasswordForm />
    </Stack>
  );
}
