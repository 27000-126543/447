import { Router, type Request, type Response } from 'express';
import type { InventoryForecast, PurchaseOrder } from '../../shared/types.js';
import { success, error, requireAuth, requireRoles, type AuthRequest } from '../utils.js';
import { inventoryForecasts, purchaseOrders as mockPurchaseOrders } from '../data/mockData.js';

const router = Router();

router.get('/forecast', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const data: InventoryForecast[] = inventoryForecasts;
    res.json(success(data, '获取成功'));
  } catch (e) {
    const err = e as Error;
    res.status(500).json(error(err.message || '获取失败', 500));
  }
});

router.get('/purchase', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const status = req.query.status as string | undefined;

    let filtered = [...mockPurchaseOrders];
    if (status) {
      filtered = filtered.filter((p) => p.status === status);
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

router.post(
  '/purchase/:id/approve',
  requireAuth,
  requireRoles(['finance', 'warehouse', 'super_admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;
      const { id } = req.params;
      const { comment } = req.body as { comment?: string };

      const idx = mockPurchaseOrders.findIndex((p) => p.id === id);
      if (idx === -1) {
        res.status(404).json(error('采购单不存在', 404));
        return;
      }

      const po = { ...mockPurchaseOrders[idx] };

      if (user.role === 'finance') {
        if (po.status !== 'finance_pending') {
          res.status(400).json(error('当前状态不允许财务审批', 400));
          return;
        }
        po.status = 'warehouse_pending';
        po.statusName = '待仓储审批';
        po.currentApprover = '仓储';
      } else if (user.role === 'warehouse') {
        if (po.status !== 'warehouse_pending') {
          res.status(400).json(error('当前状态不允许仓储审批', 400));
          return;
        }
        po.status = 'approved';
        po.statusName = '审批通过';
        po.currentApprover = '-';
      } else if (user.role === 'super_admin') {
        po.status = 'approved';
        po.statusName = '审批通过';
        po.currentApprover = '-';
      }

      po.approvalHistory = [
        ...po.approvalHistory,
        {
          step: po.approvalHistory.length + 1,
          role: user.roleName,
          user: user.name,
          action: 'approve',
          comment: comment || '审批通过',
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          version: 1,
        },
      ];

      mockPurchaseOrders[idx] = po;

      const data: PurchaseOrder = po;
      res.json(success(data, '审批成功'));
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '审批失败', 500));
    }
  },
);

router.post(
  '/purchase/:id/reject',
  requireAuth,
  requireRoles(['finance', 'warehouse', 'super_admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;
      const { id } = req.params;
      const { comment } = req.body as { comment?: string };

      const idx = mockPurchaseOrders.findIndex((p) => p.id === id);
      if (idx === -1) {
        res.status(404).json(error('采购单不存在', 404));
        return;
      }

      const po = { ...mockPurchaseOrders[idx] };

      if (user.role === 'finance' && po.status !== 'finance_pending') {
        res.status(400).json(error('当前状态不允许财务驳回', 400));
        return;
      }
      if (user.role === 'warehouse' && po.status !== 'warehouse_pending') {
        res.status(400).json(error('当前状态不允许仓储驳回', 400));
        return;
      }

      po.status = 'rejected';
      po.statusName = '审批驳回';
      po.currentApprover = '-';
      po.approvalHistory = [
        ...po.approvalHistory,
        {
          step: po.approvalHistory.length + 1,
          role: user.roleName,
          user: user.name,
          action: 'reject',
          comment: comment || '审批驳回',
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          version: 1,
        },
      ];

      mockPurchaseOrders[idx] = po;

      const data: PurchaseOrder = po;
      res.json(success(data, '驳回成功'));
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '驳回失败', 500));
    }
  },
);

export default router;
