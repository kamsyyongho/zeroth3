import { Role } from './users.types';
export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
  roles: Role[];
  voiceMaskingRequired: boolean;
}
