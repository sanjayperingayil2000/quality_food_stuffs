import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'overview', title: 'Overview', href: paths.dashboard.overview, icon: 'chart-pie' },
  { key: 'employees', title: 'Employees', href: paths.dashboard.employees, icon: 'users' },
  { key: 'products', title: 'Products', href: paths.dashboard.products, icon: 'plugs-connected' },
  { key: 'additionalExpenses', title: 'Additional Expenses', href: paths.dashboard.additionalExpenses, icon: 'receipt' },
  { key: 'dailyTrip', title: 'Daily Trip', href: paths.dashboard.dailyTrip, icon: 'calendar' },
  { key: 'settings', title: 'Settings', href: paths.dashboard.settings, icon: 'gear-six' },
  { key: 'account', title: 'Account', href: paths.dashboard.account, icon: 'user' },
  // { key: 'error', title: 'Error', href: paths.errors.notFound, icon: 'x-square' },
] satisfies NavItemConfig[];
