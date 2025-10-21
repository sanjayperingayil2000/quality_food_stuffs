'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { EyeSlashIcon } from '@phosphor-icons/react/dist/ssr/EyeSlash';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';
import { apiClient } from '@/lib/api-client';

const schema = zod.object({ 
  password: zod.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: zod.string().min(6, { message: 'Password must be at least 6 characters' })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type Values = zod.infer<typeof schema>;

const defaultValues = { password: '', confirmPassword: '' } satisfies Values;

interface NewPasswordFormProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function NewPasswordForm({ email, onSuccess, onBack }: NewPasswordFormProps): React.JSX.Element {
  const [isPending, setIsPending] = React.useState<boolean>(false);
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState<boolean>(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);

      try {
        const result = await apiClient.request('/auth?action=reset-password', {
          method: 'POST',
          body: JSON.stringify({ email, password: values.password }),
        });

        if (result.error) {
          setError('root', { type: 'server', message: result.error });
          setIsPending(false);
          return;
        }

        onSuccess();
      } catch {
        setError('root', { type: 'server', message: 'Failed to reset password' });
        setIsPending(false);
      }
    },
    [email, onSuccess, setError]
  );

  return (
    <Stack spacing={4}>
      <Typography variant="h5">Set New Password</Typography>
      <Typography color="text.secondary" variant="body2">
        Enter your new password for {email}
      </Typography>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <FormControl error={Boolean(errors.password)}>
                <InputLabel>New Password</InputLabel>
                <OutlinedInput
                  {...field}
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  endAdornment={
                    showPassword ? (
                      <EyeIcon
                        cursor="pointer"
                        fontSize="var(--icon-fontSize-md)"
                        onClick={() => setShowPassword(false)}
                      />
                    ) : (
                      <EyeSlashIcon
                        cursor="pointer"
                        fontSize="var(--icon-fontSize-md)"
                        onClick={() => setShowPassword(true)}
                      />
                    )
                  }
                />
                {errors.password ? <FormHelperText>{errors.password.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <FormControl error={Boolean(errors.confirmPassword)}>
                <InputLabel>Confirm New Password</InputLabel>
                <OutlinedInput
                  {...field}
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  endAdornment={
                    showConfirmPassword ? (
                      <EyeIcon
                        cursor="pointer"
                        fontSize="var(--icon-fontSize-md)"
                        onClick={() => setShowConfirmPassword(false)}
                      />
                    ) : (
                      <EyeSlashIcon
                        cursor="pointer"
                        fontSize="var(--icon-fontSize-md)"
                        onClick={() => setShowConfirmPassword(true)}
                      />
                    )
                  }
                />
                {errors.confirmPassword ? <FormHelperText>{errors.confirmPassword.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          
          {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}
          
          <Button disabled={isPending} type="submit" variant="contained">
            Reset Password
          </Button>
          
          <Button onClick={onBack} variant="text">
            Back to OTP verification
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}

