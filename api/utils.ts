import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse, User, UserRole } from '../shared/types.js';
import { users } from './data/mockData.js';

export function success<T>(data: T, message = 'success'): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
    timestamp: Date.now(),
  };
}

export function error(message: string, code = -1, data: unknown = null): ApiResponse<unknown> {
  return {
    code,
    message,
    data,
    timestamp: Date.now(),
  };
}

const tokenToUser: Record<string, User> = {};

export function generateToken(user: User): string {
  const token = `token_${user.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  tokenToUser[token] = user;
  return token;
}

export function removeToken(token: string): void {
  delete tokenToUser[token];
}

export function getUserFromToken(token: string): User | null {
  if (tokenToUser[token]) return tokenToUser[token];
  for (const key of Object.keys(users)) {
    const userRecord = users[key];
    if (token.includes(`_${userRecord.id}_`)) {
      const userData = { ...userRecord };
      delete (userData as { password?: string }).password;
      tokenToUser[token] = userData as User;
      return userData as User;
    }
  }
  return null;
}

export function parseAuthToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return authHeader;
}

export interface AuthRequest extends Request {
  currentUser?: User | null;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = parseAuthToken(req);
  const r = req as AuthRequest;
  if (token) {
    r.currentUser = getUserFromToken(token);
  } else {
    r.currentUser = null;
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const r = req as AuthRequest;
  if (!r.currentUser) {
    res.status(401).json(error('未授权，请先登录', 401));
    return;
  }
  next();
}

export function requireRoles(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const r = req as AuthRequest;
    if (!r.currentUser) {
      res.status(401).json(error('未授权，请先登录', 401));
      return;
    }
    if (!roles.includes(r.currentUser.role) && r.currentUser.role !== 'super_admin') {
      res.status(403).json(error('无权限访问', 403));
      return;
    }
    next();
  };
}
