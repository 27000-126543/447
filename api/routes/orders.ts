import { Router, type Request, type Response } from 'express';
import type { Order, OrderListResponse, OrderChannel, OrderStatus } from '../../shared/types.js';
import { success, error, requireAuth, type AuthRequest } from '../utils.js';
import { orders as mockOrders } from '../data/mockData.js';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthRequest).currentUser!;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const channel = req.query.channel as OrderChannel | undefined;
    const status = req.query.status as OrderStatus | undefined;
    const region = req.query.region as string | undefined;
    const keyword = req.query.keyword as string | undefined;
    const startTime = req.query.startTime as string | undefined;
    const endTime = req.query.endTime as string | undefined;

    let filtered = [...mockOrders];

    if (user.role === 'region_manager' || user.role === 'operator') {
      if (user.region) {
        filtered = filtered.filter((o) => o.region === user.region);
      }
    }

    if (channel) {
      filtered = filtered.filter((o) => o.channel === channel);
    }

    if (status) {
      filtered = filtered.filter((o) => o.status === status);
    }

    if (region) {
      filtered = filtered.filter((o) => o.region === region);
    }

    if (keyword) {
      const kw = keyword.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(kw) ||
          o.userName.toLowerCase().includes(kw) ||
          o.userPhone.includes(kw),
      );
    }

    if (startTime) {
      filtered = filtered.filter((o) => o.createdAt >= startTime);
    }

    if (endTime) {
      filtered = filtered.filter((o) => o.createdAt <= endTime);
    }

    const total = filtered.length;
    const list = filtered.slice((page - 1) * pageSize, page * pageSize);

    const data: OrderListResponse = {
      list,
      total,
      page,
      pageSize,
    };

    res.json(success(data, '获取成功'));
  } catch (e) {
    const err = e as Error;
    res.status(500).json(error(err.message || '获取失败', 500));
  }
});

router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthRequest).currentUser!;
    const { id } = req.params;
    const order = mockOrders.find((o) => o.id === id);

    if (!order) {
      res.status(404).json(error('订单不存在', 404));
      return;
    }

    if (
      (user.role === 'region_manager' || user.role === 'operator') &&
      user.region &&
      order.region !== user.region
    ) {
      res.status(403).json(error('无权限查看该订单', 403));
      return;
    }

    const data: Order = order;
    res.json(success(data, '获取成功'));
  } catch (e) {
    const err = e as Error;
    res.status(500).json(error(err.message || '获取失败', 500));
  }
});

export default router;
