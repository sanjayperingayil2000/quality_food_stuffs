export interface User {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  email?: string;
  roles?: string[];
  phone?: string;
  state?: string;
  city?: string;
  profilePhoto?: string;

  [key: string]: unknown;
}
