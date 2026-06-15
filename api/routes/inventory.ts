import { Router, type Request, type Response } from 'express';
import type {
  InventoryForecast,
  PurchaseOrder,
  POStatus,
  ApprovalHistory,
  POVersionDiff,
  POItemDiff,
} from '../../shared/types.js';
import { PERMISSIONS } from '../../shared/types.js';
import {
  success,
  error,
  requireAuth,
  requirePermissions,
  type AuthRequest,
  applyDataScope,
  getPOStatusName,
  getNextPOStatus,
  getRejectPOStatus,
  getCurrentStep,
  getApproverRole,
  getStepName,
  canSubmitPO,
  canApprovePO,
  canRejectPO,
  canResubmitPO,
  canCompletePO,
} from '../utils.js';
import { inventoryForecasts, purchaseOrders as mockPurchaseOrders } from '../data/mockData.js';
import { inboxMessages } from '../data/mockData.js';

const router = Router();

router.get(
  '/forecast',
  requireAuth,
  requirePermissions([PERMISSIONS.INVENTORY_VIEW]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data: InventoryForecast[] = inventoryForecasts;
      res.json(success(data, '获取成功'));
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '获取失败', 500));
    }
  },
);

router.get(
  '/purchase',
  requireAuth,
  requirePermissions([PERMISSIONS.PURCHASE_VIEW]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 10;
      const status = req.query.status as POStatus | undefined;
      const keyword = req.query.keyword as string | undefined;

      let filtered = applyDataScope(mockPurchaseOrders, user);

      if (status) {
        filtered = filtered.filter((p) => p.status === status);
      }

      if (keyword) {
        const kw = keyword.toLowerCase();
        filtered = filtered.filter((p) => p.poNo.toLowerCase().includes(kw));
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

router.post(
  '/purchase',
  requireAuth,
  requirePermissions([PERMISSIONS.PURCHASE_CREATE]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;
      const { items, expectedDate } = req.body as {
        items: { skuId: string; skuName: string; quantity: number; unitPrice: number }[];
        expectedDate?: string;
      };

      if (!items || items.length === 0) {
        res.status(400).json(error('采购商品不能为空', 400));
        return;
      }

      const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const now = new Date().toISOString();

      const newPO: PurchaseOrder = {
        id: `PO${Date.now().toString().slice(-4)}${Math.random().toString(36).slice(2, 6)}`,
        poNo: `PO${Date.now().toString().slice(-6)}${String(mockPurchaseOrders.length + 1).padStart(4, '0')}`,
        items,
        totalAmount: Number(totalAmount.toFixed(2)),
        status: 'draft',
        statusName: getPOStatusName('draft'),
        currentStep: getCurrentStep('draft'),
        currentApproverRole: getApproverRole('draft'),
        currentApprover: '-',
        version: 1,
        rejectionCount: 0,
        approvalHistory: [
          {
            step: 1,
            stepName: getStepName(1),
            role: user.roleName,
            user: user.name,
            userId: user.id,
            action: 'submit',
            comment: '创建采购单',
            createdAt: now,
            version: 1,
          },
        ],
        createdAt: now,
        createdBy: user.name,
        createdById: user.id,
        creatorRegion: user.region,
        expectedDate: expectedDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      mockPurchaseOrders.unshift(newPO);

      const data: PurchaseOrder = newPO;
      res.json(success(data, '创建成功'));
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '创建失败', 500));
    }
  },
);

router.post(
  '/purchase/:id/submit',
  requireAuth,
  requirePermissions([PERMISSIONS.PURCHASE_SUBMIT]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;
      const { id } = req.params;

      const idx = mockPurchaseOrders.findIndex((p) => p.id === id);
      if (idx === -1) {
        res.status(404).json(error('采购单不存在', 404));
        return;
      }

      const po = { ...mockPurchaseOrders[idx] };

      if (!canSubmitPO(po, user)) {
        res.status(400).json(error('当前状态不允许提交', 400));
        return;
      }

      const nextStatus = getNextPOStatus(po.status);
      po.status = nextStatus;
      po.statusName = getPOStatusName(nextStatus);
      po.currentStep = getCurrentStep(nextStatus);
      po.currentApproverRole = getApproverRole(nextStatus);
      po.currentApprover = nextStatus === 'finance_pending' ? '赵雅琴' : '-';

      const newHistory: ApprovalHistory = {
        step: po.currentStep,
        stepName: getStepName(po.currentStep),
        role: user.roleName,
        user: user.name,
        userId: user.id,
        action: 'submit',
        comment: '提交审批',
        createdAt: new Date().toISOString(),
        version: po.version,
      };

      po.approvalHistory = [...po.approvalHistory, newHistory];

      mockPurchaseOrders[idx] = po;

      const data: PurchaseOrder = po;
      res.json(success(data, '提交成功'));
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '提交失败', 500));
    }
  },
);

router.post(
  '/purchase/:id/approve',
  requireAuth,
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

      if (!canApprovePO(po, user)) {
        res.status(403).json(error('无权限审批此采购单', 403));
        return;
      }

      const approvingStep = po.currentStep;
      const approvingStepName = getStepName(approvingStep);
      const nextStatus = getNextPOStatus(po.status);

      const approveHistory: ApprovalHistory = {
        step: approvingStep,
        stepName: approvingStepName,
        role: user.roleName,
        user: user.name,
        userId: user.id,
        action: 'approve',
        comment: comment || `${approvingStepName}通过`,
        createdAt: new Date().toISOString(),
        version: po.version,
      };

      po.status = nextStatus;
      po.statusName = getPOStatusName(nextStatus);
      po.currentStep = getCurrentStep(nextStatus);
      po.currentApproverRole = getApproverRole(nextStatus);
      po.currentApprover = nextStatus === 'warehouse_pending' ? '刘国强' : '-';

      po.approvalHistory = [...po.approvalHistory, approveHistory];

      if (nextStatus === 'approved') {
        const approvedStep = 4;
        po.currentStep = approvedStep;
        po.currentApproverRole = '仓储管理员';
        po.approvalHistory.push({
          step: approvedStep,
          stepName: getStepName(approvedStep),
          role: '系统',
          user: '系统',
          userId: 'SYSTEM',
          action: 'approve',
          comment: '所有节点审批通过，等待入库',
          createdAt: new Date().toISOString(),
          version: po.version,
        });
      }

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
  requirePermissions([PERMISSIONS.PURCHASE_REJECT]),
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

      if (!canRejectPO(po, user)) {
        res.status(403).json(error('无权限驳回此采购单', 403));
        return;
      }

      const rejectingStep = po.currentStep;
      const rejectingStepName = getStepName(rejectingStep);
      const rejectStatus = getRejectPOStatus(po.status);
      const rejectComment = comment || '审批驳回';

      const rejectHistory: ApprovalHistory = {
        step: rejectingStep,
        stepName: rejectingStepName,
        role: user.roleName,
        user: user.name,
        userId: user.id,
        action: 'reject',
        comment: rejectComment,
        rejectedFrom: rejectingStep,
        createdAt: new Date().toISOString(),
        version: po.version,
      };

      po.status = rejectStatus;
      po.statusName = getPOStatusName(rejectStatus);
      po.lastRejectedFrom = rejectingStep;
      po.lastRejectionComment = rejectComment;
      po.rejectionCount = (po.rejectionCount || 0) + 1;
      po.currentApprover = '-';

      po.approvalHistory = [...po.approvalHistory, rejectHistory];

      mockPurchaseOrders[idx] = po;

      const data: PurchaseOrder = po;
      res.json(success(data, '驳回成功'));
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '驳回失败', 500));
    }
  },
);

function computePOVersionDiff(
  fromVersion: number,
  toVersion: number,
  oldPO: { items: PurchaseOrder['items']; totalAmount: number; description?: string },
  newPO: { items: PurchaseOrder['items']; totalAmount: number; description?: string },
): POVersionDiff {
  const fieldNameMap: Record<string, string> = {
    quantity: '采购数量',
    unitPrice: '单价',
    totalAmount: '总金额',
    description: '采购说明',
  };

  const itemDiffs: POItemDiff[] = [];
  const oldItemMap = new Map(oldPO.items.map((it) => [it.skuId, it]));
  const newItemMap = new Map(newPO.items.map((it) => [it.skuId, it]));

  oldPO.items.forEach((oldIt) => {
    const newIt = newItemMap.get(oldIt.skuId);
    if (!newIt) {
      itemDiffs.push({
        skuId: oldIt.skuId,
        skuName: oldIt.skuName,
        field: 'item',
        fieldName: '商品行',
        oldValue: oldIt,
        newValue: null,
        changeType: 'removed',
      });
    } else {
      (['quantity', 'unitPrice'] as const).forEach((f) => {
        if (oldIt[f] !== newIt[f]) {
          itemDiffs.push({
            skuId: oldIt.skuId,
            skuName: oldIt.skuName,
            field: f,
            fieldName: fieldNameMap[f] || f,
            oldValue: oldIt[f],
            newValue: newIt[f],
            changeType: 'modified',
          });
        }
      });
    }
  });

  newPO.items.forEach((newIt) => {
    if (!oldItemMap.has(newIt.skuId)) {
      itemDiffs.push({
        skuId: newIt.skuId,
        skuName: newIt.skuName,
        field: 'item',
        fieldName: '商品行',
        oldValue: null,
        newValue: newIt,
        changeType: 'added',
      });
    }
  });

  const summaryDiffs: POVersionDiff['summaryDiffs'] = [];
  (['totalAmount', 'description'] as const).forEach((f) => {
    const ov = oldPO[f];
    const nv = newPO[f];
    summaryDiffs.push({
      field: f,
      fieldName: fieldNameMap[f] || f,
      oldValue: ov ?? null,
      newValue: nv ?? null,
      changed: JSON.stringify(ov ?? null) !== JSON.stringify(nv ?? null),
    });
  });

  return { fromVersion, toVersion, itemDiffs, summaryDiffs };
}

router.post(
  '/purchase/:id/resubmit',
  requireAuth,
  requirePermissions([PERMISSIONS.PURCHASE_RESUBMIT]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;
      const { id } = req.params;
      const {
        comment,
        items,
        description,
      } = req.body as {
        comment?: string;
        items?: PurchaseOrder['items'];
        description?: string;
      };

      const idx = mockPurchaseOrders.findIndex((p) => p.id === id);
      if (idx === -1) {
        res.status(404).json(error('采购单不存在', 404));
        return;
      }

      const po = { ...mockPurchaseOrders[idx] };

      if (!canResubmitPO(po, user)) {
        res.status(403).json(error('无权限重新提交此采购单', 403));
        return;
      }

      const prevVersion = po.version;
      const newVersion = (po.version || 1) + 1;
      const lastRejection = po.approvalHistory
        .filter((h) => h.action === 'reject' && h.version === prevVersion)
        .pop();
      const rejectedFrom = lastRejection?.rejectedFrom || po.lastRejectedFrom || 1;

      const oldSnapshot = {
        items: [...po.items],
        totalAmount: po.totalAmount,
        description: po.description,
      };

      if (items && Array.isArray(items)) {
        po.items = items;
        po.totalAmount = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
      }
      if (description !== undefined) {
        po.description = description;
      }

      po.versionSnapshots = {
        ...(po.versionSnapshots || {}),
        [prevVersion]: oldSnapshot,
        [newVersion]: {
          items: [...po.items],
          totalAmount: po.totalAmount,
          description: po.description,
        },
      };

      const versionDiff = computePOVersionDiff(prevVersion, newVersion, oldSnapshot, {
        items: po.items,
        totalAmount: po.totalAmount,
        description: po.description,
      });

      po.version = newVersion;
      po.status = 'finance_pending';
      po.statusName = getPOStatusName('finance_pending');
      po.currentStep = getCurrentStep('finance_pending');
      po.currentApproverRole = getApproverRole('finance_pending');
      po.currentApprover = '赵雅琴';
      po.currentApproverId = 'U004';
      po.lastRejectedFrom = undefined;
      po.lastRejectionComment = undefined;

      const resubmitHistory: ApprovalHistory = {
        step: 1,
        stepName: getStepName(1),
        role: user.roleName,
        user: user.name,
        userId: user.id,
        action: 'resubmit',
        comment: comment || `第${newVersion}版重新提交，已修改问题`,
        rejectedFrom: rejectedFrom,
        versionDiff,
        createdAt: new Date().toISOString(),
        version: newVersion,
      };

      po.approvalHistory = [...po.approvalHistory, resubmitHistory];

      mockPurchaseOrders[idx] = po;

      const data: PurchaseOrder = po;
      res.json(success(data, '重新提交成功'));
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '重新提交失败', 500));
    }
  },
);

router.post(
  '/purchase/:id/complete',
  requireAuth,
  requirePermissions([PERMISSIONS.INVENTORY_EDIT]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;
      const { id } = req.params;

      const idx = mockPurchaseOrders.findIndex((p) => p.id === id);
      if (idx === -1) {
        res.status(404).json(error('采购单不存在', 404));
        return;
      }

      const po = { ...mockPurchaseOrders[idx] };

      if (!canCompletePO(po, user)) {
        res.status(403).json(error('无权限完成此采购单', 403));
        return;
      }

      po.status = 'completed';
      po.statusName = getPOStatusName('completed');
      po.currentStep = 5;
      po.currentApproverRole = getApproverRole('completed');
      po.currentApprover = '-';

      const newHistory: ApprovalHistory = {
        step: 5,
        stepName: getStepName(5),
        role: user.roleName,
        user: user.name,
        userId: user.id,
        action: 'approve',
        comment: '已完成入库',
        createdAt: new Date().toISOString(),
        version: po.version,
      };

      po.approvalHistory = [...po.approvalHistory, newHistory];

      mockPurchaseOrders[idx] = po;

      const data: PurchaseOrder = po;
      res.json(success(data, '完成成功'));
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '完成失败', 500));
    }
  },
);

router.get(
  '/purchase/:id/version-diff',
  requireAuth,
  requirePermissions([PERMISSIONS.PURCHASE_VIEW]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;
      const { id } = req.params;
      const from = Number(req.query.from) || 1;
      const to = Number(req.query.to) || 2;

      const idx = mockPurchaseOrders.findIndex((p) => p.id === id);
      if (idx === -1) {
        res.status(404).json(error('采购单不存在', 404));
        return;
      }

      const po = mockPurchaseOrders[idx];

      const filteredPOs = applyDataScope([po], user);
      if (filteredPOs.length === 0) {
        res.status(403).json(error('无权限查看此采购单', 403));
        return;
      }

      const findVersionSnapshot = (ver: number) => {
        if (po.versionSnapshots && po.versionSnapshots[ver]) {
          return po.versionSnapshots[ver];
        }
        const historyAtVersion = po.approvalHistory.find((h) => h.version === ver && h.versionDiff);
        if (historyAtVersion?.versionDiff && ver === historyAtVersion.versionDiff.toVersion) {
          return null;
        }
        return null;
      };

      let fromSnapshot = findVersionSnapshot(from);
      let toSnapshot = findVersionSnapshot(to);

      if (!fromSnapshot || !toSnapshot) {
        const resubmitHistory = po.approvalHistory
          .filter((h) => h.action === 'resubmit' && h.versionDiff)
          .find((h) => h.versionDiff!.fromVersion === from && h.versionDiff!.toVersion === to);
        if (resubmitHistory?.versionDiff) {
          res.json(
            success(
              {
                poId: po.id,
                poNo: po.poNo,
                diff: resubmitHistory.versionDiff,
              },
              '获取成功',
            ),
          );
          return;
        }
        fromSnapshot = fromSnapshot || {
          items: po.items,
          totalAmount: po.totalAmount,
          description: po.description,
        };
        toSnapshot = toSnapshot || {
          items: po.items,
          totalAmount: po.totalAmount,
          description: po.description,
        };
      }

      const diff = computePOVersionDiff(from, to, fromSnapshot, toSnapshot);

      res.json(
        success(
          {
            poId: po.id,
            poNo: po.poNo,
            diff,
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

router.post(
  '/purchase/:id/transfer',
  requireAuth,
  requirePermissions([PERMISSIONS.INVENTORY_EDIT]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;
      const { id } = req.params;
      const {
        toUserId,
        toUserName,
        comment,
      } = req.body as { toUserId: string; toUserName: string; comment?: string };

      const idx = mockPurchaseOrders.findIndex((p) => p.id === id);
      if (idx === -1) {
        res.status(404).json(error('采购单不存在', 404));
        return;
      }

      const po = { ...mockPurchaseOrders[idx] };

      if (!['finance_pending', 'warehouse_pending'].includes(po.status)) {
        res.status(400).json(error('仅待审批状态的采购单可转交', 400));
        return;
      }

      const transferStep = po.currentStep;
      const fromUserName = po.currentApprover || user.name;
      const fromUserId = po.currentApproverId || user.id;

      po.currentApprover = toUserName;
      po.currentApproverId = toUserId;

      const transferHistory: ApprovalHistory = {
        step: transferStep,
        stepName: getStepName(transferStep),
        role: user.roleName,
        user: user.name,
        userId: user.id,
        action: 'transfer',
        comment: comment || `转交审批：${fromUserName} → ${toUserName}`,
        transferredFrom: fromUserName,
        transferredTo: toUserName,
        createdAt: new Date().toISOString(),
        version: po.version,
      };

      po.approvalHistory = [...po.approvalHistory, transferHistory];

      mockPurchaseOrders[idx] = po;

      res.json(success(po, `已转交给 ${toUserName}`));
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '转交失败', 500));
    }
  },
);

router.post(
  '/purchase/:id/timeout-remind',
  requireAuth,
  requirePermissions([PERMISSIONS.PURCHASE_VIEW]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;
      const { id } = req.params;
      const { timeoutHours = 24 } = req.body as { timeoutHours?: number };

      const idx = mockPurchaseOrders.findIndex((p) => p.id === id);
      if (idx === -1) {
        res.status(404).json(error('采购单不存在', 404));
        return;
      }

      const po = { ...mockPurchaseOrders[idx] };

      if (!['finance_pending', 'warehouse_pending'].includes(po.status)) {
        res.status(400).json(error('仅待审批状态的采购单可触发超时提醒', 400));
        return;
      }

      const timeoutStep = po.currentStep;
      const timeoutStepName = getStepName(timeoutStep);

      const remindHistory: ApprovalHistory = {
        step: timeoutStep,
        stepName: timeoutStepName,
        role: user.roleName,
        user: user.name,
        userId: user.id,
        action: 'timeout_remind',
        comment: `${timeoutStepName}已超过${timeoutHours}小时未处理，请尽快审批`,
        createdAt: new Date().toISOString(),
        version: po.version,
      };

      po.approvalHistory = [...po.approvalHistory, remindHistory];

      inboxMessages.unshift({
        id: `NOTIF_${Date.now()}`,
        type: 'alert',
        title: `采购单超时提醒 - ${po.poNo}`,
        content: `采购单【${po.poNo}】在${timeoutStepName}节点已超时${timeoutHours}小时，请及时处理`,
        read: false,
        userId: po.currentApproverId || '',
        relatedId: po.id,
        relatedType: 'purchase_order',
        createdAt: new Date().toISOString(),
      });

      mockPurchaseOrders[idx] = po;

      res.json(success(po, '超时提醒已发送'));
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '提醒失败', 500));
    }
  },
);

export default router;
