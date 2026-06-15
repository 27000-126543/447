import { Router, type Request, type Response } from 'express';
import type { User } from '../../shared/types.js';
import { ROLE_PERMISSIONS, ROLE_DATA_SCOPES } from '../../shared/types.js';
import { success, error, generateToken, removeToken, parseAuthToken } from '../utils.js';
import { users } from '../data/mockData.js';

const router = Router();

interface LoginPayload {
  username: string;
  password: string;
}

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as LoginPayload;

    if (!username || !password) {
      res.status(400).json(error('用户名和密码不能为空', 400));
      return;
    }

    const userRecord = users[username];
    if (!userRecord || userRecord.password !== password) {
      res.status(401).json(error('用户名或密码错误', 401));
      return;
    }

    const userData = { ...userRecord };
    delete (userData as { password?: string }).password;

    const user: User = {
      ...userData,
      permissions: ROLE_PERMISSIONS[userData.role],
      dataScope: ROLE_DATA_SCOPES[userData.role],
    } as User;

    const token = generateToken(user);

    res.json(
      success(
        {
          token,
          user,
        },
        '登录成功',
      ),
    );
  } catch (e) {
    const err = e as Error;
    res.status(500).json(error(err.message || '登录失败', 500));
  }
});

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = parseAuthToken(req);
    if (token) {
      removeToken(token);
    }
    res.json(success(null, '登出成功'));
  } catch (e) {
    const err = e as Error;
    res.status(500).json(error(err.message || '登出失败', 500));
  }
});

export default router;
