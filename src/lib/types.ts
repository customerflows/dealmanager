export type Role = 'user' | 'admin';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: Role;
}
