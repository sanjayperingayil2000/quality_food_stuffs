'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
import { EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { EyeSlashIcon } from '@phosphor-icons/react/dist/ssr/EyeSlash';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { useUser } from '@/hooks/use-user';

const schema = zod.object({
  email: zod.string().min(1, { message: 'Email is required' }).email(),
  password: zod.string().min(1, { message: 'Password is required' }),
});

type Values = zod.infer<typeof schema>;

const defaultValues = { email: '', password: '' } satisfies Values;

export function SignInForm(): React.JSX.Element {
  const router = useRouter();

  const { checkSession } = useUser();

  const [showPassword, setShowPassword] = React.useState<boolean>();

  const [isPending, setIsPending] = React.useState<boolean>(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);

      const { error } = await authClient.signInWithPassword(values);

      if (error) {
        setError('root', { type: 'server', message: error });
        setIsPending(false);
        return;
      }

      // Refresh the auth state
      await checkSession?.();

      // Navigate to dashboard after successful login
      router.push('/dashboard');
    },
    [checkSession, router, setError]
  );

  return (
    <>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1 }}
        open={isPending}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Stack spacing={4} sx={{ maxWidth: 400, mx: 'auto', mt: 6 }}>
        {/* Header */}
        <Stack spacing={1}>
          <Typography variant="h4" textAlign="center">
            Sign In
          </Typography>
          <Typography color="text.secondary" variant="body2" textAlign="center">
            Contact your administrator for account access.
          </Typography>
        </Stack>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          {/* Email */}
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

          {/* Password */}
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <FormControl error={Boolean(errors.password)} fullWidth>
                <InputLabel>Password</InputLabel>
                <OutlinedInput
                  {...field}
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                        aria-label="toggle password visibility"
                      >
                        {showPassword ? (
                          <EyeSlashIcon width={20} height={20} />
                        ) : (
                          <EyeIcon width={20} height={20} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  }
                />
                {errors.password && (
                  <FormHelperText>{errors.password.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />

          {/* Forgot password link */}
          <Stack direction="row" justifyContent="flex-end">
            <Link
              href={paths.auth.resetPassword}
              style={{
                textDecoration: 'none',
                fontWeight: 500,
                color: '#1976d2',
                fontSize: '0.875rem',
              }}
            >
              Forgot password?
            </Link>
          </Stack>

          {/* Error */}
          {errors.root && <Alert color="error">{errors.root.message}</Alert>}

          {/* Submit button */}
          <Button disabled={isPending} type="submit" variant="contained" fullWidth startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : null}>
            {isPending ? 'Signing in...' : 'Sign In'}
          </Button>
        </Stack>
      </form>
      </Stack>
    </>
  );
}
