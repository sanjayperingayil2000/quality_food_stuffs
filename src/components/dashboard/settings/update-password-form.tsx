'use client';

import * as React from 'react';
import { z as zod } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { EyeSlashIcon } from '@phosphor-icons/react/dist/ssr/EyeSlash';
import { useRouter } from 'next/navigation';

import { apiClient } from '@/lib/api-client';
import { useUser } from '@/hooks/use-user';
import { useNotifications } from '@/contexts/notification-context';
import { paths } from '@/paths';

const schema = zod.object({
  newPassword: zod.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: zod.string().min(1, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ['confirmPassword'],
  message: "Passwords don't match",
});

type FormValues = zod.infer<typeof schema>;

const defaultValues: FormValues = {
  newPassword: '',
  confirmPassword: '',
};

interface UpdatePasswordFormProps {
  redirectToDashboardOnSuccess?: boolean;
  onSuccess?: () => void;
}

export function UpdatePasswordForm({
  redirectToDashboardOnSuccess = false,
  onSuccess,
}: UpdatePasswordFormProps = {}): React.JSX.Element {
  const { checkSession } = useUser();
  const { showSuccess, showError } = useNotifications();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues,
    resolver: zodResolver(schema),
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = React.useState<string | null>(null);

  const onSubmit = React.useCallback(
    async (values: FormValues) => {
      setIsSubmitting(true);
      setServerError(null);
      setServerSuccess(null);

      try {
        const result = await apiClient.updateMyPassword(values.newPassword);
        if (result.error) {
          setServerError(result.error);
          showError?.(result.error);
          setIsSubmitting(false);
          return;
        }

        setServerSuccess('Password updated successfully.');
        showSuccess?.('Password updated successfully.');
        reset(defaultValues);
        await checkSession?.();

        if (redirectToDashboardOnSuccess) {
          router.replace(paths.dashboard.overview);
        }

        onSuccess?.();
      } catch (error) {
        console.error('Failed to update password:', error);
        setServerError('Failed to update password. Please try again.');
        showError?.('Failed to update password. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [checkSession, redirectToDashboardOnSuccess, reset, router, showError, showSuccess, onSuccess]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader subheader="Update password" title="Password" />
        <Divider />
        <CardContent>
          <Stack spacing={3} sx={{ maxWidth: 'sm' }}>
            <Typography variant="body2" color="text.secondary">
              Use a strong password that you haven’t used elsewhere. Updating your password will sign you out on other devices.
            </Typography>
            {serverError && <Alert color="error">{serverError}</Alert>}
            {serverSuccess && <Alert color="success">{serverSuccess}</Alert>}
            <Controller
              control={control}
              name="newPassword"
              render={({ field }) => (
                <FormControl fullWidth error={Boolean(errors.newPassword)}>
                  <InputLabel>New password</InputLabel>
                  <OutlinedInput
                    {...field}
                    label="New password"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          size="small"
                          aria-label="toggle new password visibility"
                        >
                          {showNewPassword ? <EyeSlashIcon /> : <EyeIcon />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                  {errors.newPassword && (
                    <FormHelperText>{errors.newPassword.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <FormControl fullWidth error={Boolean(errors.confirmPassword)}>
                  <InputLabel>Confirm password</InputLabel>
                  <OutlinedInput
                    {...field}
                    label="Confirm password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          size="small"
                          aria-label="toggle confirm password visibility"
                        >
                          {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                  {errors.confirmPassword && (
                    <FormHelperText>{errors.confirmPassword.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Stack>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            type="submit"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isSubmitting ? 'Updating...' : 'Update'}
          </Button>
        </CardActions>
      </Card>
    </form>
  );
}
