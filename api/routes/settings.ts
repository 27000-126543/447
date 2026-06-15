import { Router, type Request, type Response } from 'express';
import type { PermissionRole, OperationLog } from '../../shared/types.js';
import { success, error, requireAuth } from '../utils.js';
import { permissionRoles, operationLogs } from '../data/mockData.js';

const router = Router();

router.get('/permissions', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const data: PermissionRole[] = permissionRoles;
    res.json(success(data, '获取成功'));
  } catch (e) {
    const err = e as Error;
    res.status(500).json(error(err.message || '获取失败', 500));
  }
});

router.get('/logs', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const userId = req.query.userId as string | undefined;
    const target = req.query.target as string | undefined;
    const keyword = req.query.keyword as string | undefined;
    const startTime = req.query.startTime as string | undefined;
    const endTime = req.query.endTime as string | undefined;

    let filtered = [...operationLogs];

    if (userId) {
      filtered = filtered.filter((l) => l.userId === userId);
    }
    if (target) {
      filtered = filtered.filter((l) => l.target === target);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.action.toLowerCase().includes(kw) ||
          l.detail.toLowerCase().includes(kw) ||
          l.userName.toLowerCase().includes(kw),
      );
    }
    if (startTime) {
      filtered = filtered.filter((l) => l.createdAt >= startTime);
    }
    if (endTime) {
      filtered = filtered.filter((l) => l.createdAt <= endTime);
    }

    const total = filtered.length;
    const list: OperationLog[] = filtered.slice((page - 1) * pageSize, page * pageSize);

    res.json(
      success(
        {
          list,
          total,
          page,
          pageSize,
        },
        '获取成功',
      ),
    );
  } catch (e) {
    const err = e as Error;
    res.status(500).json(error(err.message || '获取失败', 500));
  }
});

export default router;
