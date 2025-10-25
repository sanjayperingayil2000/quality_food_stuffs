import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { ClipboardTextIcon } from '@phosphor-icons/react/dist/ssr';
import { CalendarIcon } from '@phosphor-icons/react/dist/ssr/Calendar';
import { ChartPieIcon } from '@phosphor-icons/react/dist/ssr/ChartPie';
import { GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { PlugsConnectedIcon } from '@phosphor-icons/react/dist/ssr/PlugsConnected';
import { ReceiptIcon } from '@phosphor-icons/react/dist/ssr/Receipt';
import { SignOutIcon } from '@phosphor-icons/react/dist/ssr/SignOut';
import { UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
import { XSquare } from '@phosphor-icons/react/dist/ssr/XSquare';

export const navIcons = {
  'calendar': CalendarIcon,
  'chart-pie': ChartPieIcon,
  'gear-six': GearSixIcon,
  'plugs-connected': PlugsConnectedIcon,
  'receipt': ReceiptIcon,
  'sign-out': SignOutIcon,
  'x-square': XSquare,
  'clipboardIcon':ClipboardTextIcon,
  user: UserIcon,
  users: UsersIcon,
} as Record<string, Icon>;
