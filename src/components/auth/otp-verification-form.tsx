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
import { apiClient } from '@/lib/api-client';

const schema = zod.object({ 
  otp: zod.string().min(6, { message: 'OTP must be 6 digits' }).max(6, { message: 'OTP must be 6 digits' })
});

type Values = zod.infer<typeof schema>;

const defaultValues = { otp: '' } satisfies Values;

interface OtpVerificationFormProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function OtpVerificationForm({ email, onSuccess, onBack }: OtpVerificationFormProps): React.JSX.Element {
  const [isPending, setIsPending] = React.useState<boolean>(false);
  const [timeLeft, setTimeLeft] = React.useState<number>(300); // 5 minutes

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

  // Countdown timer
  React.useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);

      try {
        const result = await apiClient.request('/auth?action=verify-otp', {
          method: 'POST',
          body: JSON.stringify({ email, otp: values.otp }),
        });

        if (result.error) {
          setError('root', { type: 'server', message: result.error });
          setIsPending(false);
          return;
        }

        onSuccess();
      } catch (error) {
        setError('root', { type: 'server', message: 'Failed to verify OTP' });
        setIsPending(false);
      }
    },
    [email, onSuccess, setError]
  );

  const resendOtp = React.useCallback(async () => {
    try {
      const result = await apiClient.request('/auth?action=forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (result.error) {
        setError('root', { type: 'server', message: result.error });
        return;
      }

      setTimeLeft(300); // Reset timer
    } catch (error) {
      setError('root', { type: 'server', message: 'Failed to resend OTP' });
    }
  }, [email, setError]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Stack spacing={4}>
      <Typography variant="h5">Verify OTP</Typography>
      <Typography color="text.secondary" variant="body2">
        We've sent a 6-digit OTP to {email}
      </Typography>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Controller
            control={control}
            name="otp"
            render={({ field }) => (
              <FormControl error={Boolean(errors.otp)}>
                <InputLabel>Enter OTP</InputLabel>
                <OutlinedInput 
                  {...field} 
                  label="Enter OTP" 
                  type="text"
                  inputProps={{ maxLength: 6 }}
                  placeholder="123456"
                />
                {errors.otp ? <FormHelperText>{errors.otp.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          
          {timeLeft > 0 && (
            <Typography color="text.secondary" variant="body2">
              OTP expires in {formatTime(timeLeft)}
            </Typography>
          )}
          
          {timeLeft === 0 && (
            <Button onClick={resendOtp} variant="outlined" fullWidth>
              Resend OTP
            </Button>
          )}
          
          {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}
          
          <Button disabled={isPending} type="submit" variant="contained">
            Verify OTP
          </Button>
          
          <Button onClick={onBack} variant="text">
            Back to email
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}

