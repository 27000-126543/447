import { Router, type Request, type Response } from 'express';
import type { LifecycleDistribution } from '../../shared/types.js';
import { success, error, requireAuth } from '../utils.js';
import { lifecycleData, marketingCampaigns } from '../data/mockData.js';

const router = Router();

router.get('/lifecycle', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const data: LifecycleDistribution = lifecycleData;
    res.json(success(data, '获取成功'));
  } catch (e) {
    const err = e as Error;
    res.status(500).json(error(err.message || '获取失败', 500));
  }
});

router.get('/campaigns', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const status = req.query.status as string | undefined;

    let filtered = [...marketingCampaigns];
    if (status) {
      filtered = filtered.filter((c) => c.status === status);
    }

    const total = filtered.length;
    const list = filtered.slice((page - 1) * pageSize, page * pageSize);

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
