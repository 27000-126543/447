import { Router, type Request, type Response } from 'express';
import type { LifecycleDistribution, MarketingCampaign } from '../../shared/types.js';
import { PERMISSIONS } from '../../shared/types.js';
import { success, error, requireAuth, requirePermissions, type AuthRequest, applyDataScope } from '../utils.js';
import { lifecycleData, marketingCampaigns } from '../data/mockData.js';

const router = Router();

router.get(
  '/lifecycle',
  requireAuth,
  requirePermissions([PERMISSIONS.MARKETING_VIEW]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;

      let data: LifecycleDistribution = lifecycleData;

      if (user.role === 'region_manager' && user.region) {
        const byRegion = [
          {
            region: user.region,
            new: Math.floor(lifecycleData.newCustomers * (0.2 + Math.random() * 0.1)),
            active: Math.floor(lifecycleData.activeCustomers * (0.2 + Math.random() * 0.1)),
            dormant: Math.floor(lifecycleData.dormantCustomers * (0.2 + Math.random() * 0.1)),
            churned: Math.floor(lifecycleData.churnedCustomers * (0.2 + Math.random() * 0.1)),
          },
        ];

        data = {
          ...lifecycleData,
          byRegion,
        };
      }

      res.json(success(data, '获取成功'));
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '获取失败', 500));
    }
  },
);

router.get(
  '/campaigns',
  requireAuth,
  requirePermissions([PERMISSIONS.MARKETING_VIEW]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 10;
      const status = req.query.status as string | undefined;

      let filtered = applyDataScope(marketingCampaigns, user);

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
  },
);

export default router;
