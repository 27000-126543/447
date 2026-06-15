import { Router, type Request, type Response } from 'express';
import type { DashboardOverview } from '../../shared/types.js';
import { success, error, requireAuth } from '../utils.js';
import { dashboardData } from '../data/mockData.js';

const router = Router();

router.get('/overview', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const data: DashboardOverview = dashboardData;
    res.json(success(data, '获取成功'));
  } catch (e) {
    const err = e as Error;
    res.status(500).json(error(err.message || '获取失败', 500));
  }
});

export default router;
