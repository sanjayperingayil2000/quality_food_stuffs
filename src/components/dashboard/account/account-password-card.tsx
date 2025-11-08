'use client';

import * as React from 'react';

import { useUser } from '@/hooks/use-user';
import { UpdatePasswordForm } from '@/components/dashboard/settings/update-password-form';

export function AccountPasswordCard(): React.JSX.Element | null {
  const { user } = useUser();

  if (!user || user.roles?.includes('super_admin')) {
    return null;
  }

  return <UpdatePasswordForm />;
}
