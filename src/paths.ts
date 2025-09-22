export const paths = {
  home: '/',
  auth: { signIn: '/auth/sign-in', signUp: '/auth/sign-up', resetPassword: '/auth/reset-password' },
  dashboard: {
    overview: '/dashboard',
    account: '/dashboard/account',
    drivers: '/dashboard/drivers',
    products: '/dashboard/products',
    additionalExpenses: '/dashboard/additional-expenses',
    dailyTrip: '/dashboard/daily-trip',
    settings: '/dashboard/settings',
  },
  errors: { notFound: '/errors/not-found' },
} as const;
