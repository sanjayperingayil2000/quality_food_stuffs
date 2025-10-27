export const paths = {
  home: '/',
  auth: { signIn: '/auth/sign-in', resetPassword: '/auth/reset-password' },
  dashboard: {
    overview: '/dashboard',
    account: '/dashboard/account',
    employees: '/dashboard/employees',
    products: '/dashboard/products',
    additionalExpenses: '/dashboard/additional-expenses',
    dailyTrip: '/dashboard/daily-trip',
    activity: '/dashboard/activity',
    settings: '/dashboard/settings',
  },
  errors: { notFound: '/errors/not-found' },
} as const;
