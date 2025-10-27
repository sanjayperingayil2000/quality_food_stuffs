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
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import { authClient } from '@/lib/auth/client';
import { OtpVerificationForm } from './otp-verification-form';
import { NewPasswordForm } from './new-password-form';
import Link from '@mui/material/Link';
import { paths } from '@/paths';

const schema = zod.object({ email: zod.string().min(1, { message: 'Email is required' }).email() });

type Values = zod.infer<typeof schema>;

const defaultValues = { email: '' } satisfies Values;

type Step = 'email' | 'otp' | 'password' | 'success';

export function ResetPasswordForm(): React.JSX.Element {
  const [isPending, setIsPending] = React.useState<boolean>(false);
  const [step, setStep] = React.useState<Step>('email');
  const [email, setEmail] = React.useState<string>('');

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);

      const { error } = await authClient.resetPassword(values);

      if (error) {
        setError('root', { type: 'server', message: error });
        setIsPending(false);
        return;
      }

      setEmail(values.email);
      setStep('otp');
      setIsPending(false);
    },
    [setError]
  );

  const handleOtpSuccess = React.useCallback(() => {
    setStep('password');
  }, []);

  const handlePasswordSuccess = React.useCallback(() => {
    setStep('success');
  }, []);

  const handleBack = React.useCallback(() => {
    if (step === 'otp') {
      setStep('email');
    } else if (step === 'password') {
      setStep('otp');
    }
  }, [step]);

  if (step === 'otp') {
    return <OtpVerificationForm email={email} onSuccess={handleOtpSuccess} onBack={handleBack} />;
  }

  if (step === 'password') {
    return <NewPasswordForm email={email} onSuccess={handlePasswordSuccess} onBack={handleBack} />;
  }

  if (step === 'success') {
    return (
      <Stack spacing={4}>
        <Typography variant="h5">Password Reset Successful</Typography>
        <Alert color="success">
          Your password has been successfully reset. You can now sign in with your new password.
        </Alert>
        <Button href="/auth/sign-in" variant="contained" fullWidth>
          Sign In
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={4} sx={{ maxWidth: 400, mx: 'auto', mt: 6 }}>
      <Typography variant="h5" textAlign="center">
        Reset Password
      </Typography>

      <Typography variant="body2" textAlign="center" color="text.secondary">
        Enter your registered email address and we’ll send you an OTP to reset your password.
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <FormControl error={Boolean(errors.email)} fullWidth>
                <InputLabel>Email address</InputLabel>
                <OutlinedInput {...field} label="Email address" type="email" />
                {errors.email && (
                  <FormHelperText>{errors.email.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />

          {errors.root && <Alert color="error">{errors.root.message}</Alert>}

          <Button disabled={isPending} type="submit" variant="contained" fullWidth>
            {isPending ? 'Sending...' : 'Send OTP'}
          </Button>
        </Stack>
      </form>

      <Stack direction="row" justifyContent="center" spacing={1}>
        <Typography variant="body2" color="text.secondary">
          Remember your password?
        </Typography>
        <Link
          href={paths.auth.signIn}
          style={{
            textDecoration: 'none',
            color: '#1976d2',
            fontWeight: 500,
          }}
        >
          Sign In
        </Link>
      </Stack>
    </Stack>
  );
}
