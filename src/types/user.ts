export interface User {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  email?: string;
  roles?: string[];

  [key: string]: unknown;
}
