import { Router, type Request, type Response } from 'express';
import type { DashboardOverview, GMVTrendPoint, ChannelStat } from '../../shared/types.js';
import { PERMISSIONS } from '../../shared/types.js';
import { success, error, requireAuth, requirePermissions, type AuthRequest, applyDataScope } from '../utils.js';
import { dashboardData, orders, mockAlerts } from '../data/mockData.js';

const router = Router();

router.get(
  '/overview',
  requireAuth,
  requirePermissions([PERMISSIONS.DASHBOARD_VIEW]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;

      let filteredOrders = applyDataScope(orders, user);

      const regionFilter = user.role === 'region_manager' && user.region;

      let trend: GMVTrendPoint[];
      let channels: ChannelStat[];

      if (regionFilter) {
        const regionOrders = filteredOrders.filter((o) => o.region === user.region);

        const trendMap = new Map<string, number>();
        regionOrders.forEach((order) => {
          const date = order.createdAt.slice(0, 10);
          trendMap.set(date, (trendMap.get(date) || 0) + order.amount);
        });

        const sortedDates = Array.from(trendMap.keys()).sort();
        trend = sortedDates.slice(-30).map((date) => ({
          date,
          value: Math.round(trendMap.get(date) || 0),
        }));

        const channelMap = new Map<string, number>();
        regionOrders.forEach((order) => {
          channelMap.set(order.channelName, (channelMap.get(order.channelName) || 0) + order.amount);
        });

        const colors = ['#3B82F6', '#10B981', '#F59E0B'];
        channels = Array.from(channelMap.entries()).map(([name, value], idx) => ({
          name,
          value: Math.round(value),
          color: colors[idx % colors.length],
        }));
      } else {
        trend = dashboardData.gmv.trend;
        channels = dashboardData.channels;
      }

      const todayAmount = trend.length > 0 ? trend[trend.length - 1].value : 0;
      const weekAmount = trend.slice(-7).reduce((sum, t) => sum + t.value, 0);
      const monthAmount = trend.reduce((sum, t) => sum + t.value, 0);

      const data: DashboardOverview = {
        ...dashboardData,
        gmv: {
          today: todayAmount,
          week: weekAmount,
          month: monthAmount,
          yoy: dashboardData.gmv.yoy,
          mom: dashboardData.gmv.mom,
          trend,
        },
        channels,
        alerts: mockAlerts.slice(0, 5),
      };

      res.json(success(data, '获取成功'));
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '获取失败', 500));
    }
  },
);

export default router;
