import { Request } from 'express';

export type AuthenticatedUser = {
  sub: string;
  email: string;
  roles: string[];
};

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
