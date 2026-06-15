import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse, User, UserRole, PermissionKey, PurchaseOrder, POStatus, ApprovalHistory } from '../shared/types.js';
import { PERMISSIONS, ROLE_DATA_SCOPES } from '../shared/types.js';

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

export async function getUserFromToken(token: string): Promise<User | null> {
  if (tokenToUser[token]) return tokenToUser[token];
  const { users } = await import('./data/mockData.js');
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
  if (!token) {
    r.currentUser = null;
    next();
    return;
  }
  getUserFromToken(token)
    .then((user) => {
      r.currentUser = user;
      next();
    })
    .catch(() => {
      r.currentUser = null;
      next();
    });
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

export function requirePermissions(perms: PermissionKey[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const r = req as AuthRequest;
    if (!r.currentUser) {
      res.status(401).json(error('未授权，请先登录', 401));
      return;
    }
    if (r.currentUser.role === 'super_admin') {
      next();
      return;
    }
    const hasAllPermissions = perms.every((perm) => r.currentUser!.permissions.includes(perm));
    if (!hasAllPermissions) {
      res.status(403).json(error('无权限访问', 403));
      return;
    }
    next();
  };
}

export function applyDataScope<T extends { region?: string; userId?: string; createdById?: string }>(
  data: T[],
  user: User,
): T[] {
  const scope = user.dataScope || ROLE_DATA_SCOPES[user.role];
  if (scope === 'all') {
    return data;
  }
  if (scope === 'region' && user.region) {
    return data.filter((item) => item.region === user.region);
  }
  if (scope === 'self') {
    return data.filter((item) => item.createdById === user.id || item.userId === user.id);
  }
  return data;
}

const PO_STATUS_FLOW: Record<POStatus, { next: POStatus; reject: POStatus; step: number; role: string }> = {
  draft: { next: 'finance_pending', reject: 'draft', step: 1, role: '运营专员' },
  finance_pending: { next: 'warehouse_pending', reject: 'finance_rejected', step: 2, role: '财务' },
  finance_rejected: { next: 'finance_pending', reject: 'finance_rejected', step: 2, role: '财务' },
  warehouse_pending: { next: 'approved', reject: 'warehouse_rejected', step: 3, role: '仓储管理员' },
  warehouse_rejected: { next: 'warehouse_pending', reject: 'warehouse_rejected', step: 3, role: '仓储管理员' },
  rejected: { next: 'finance_pending', reject: 'rejected', step: 1, role: '运营专员' },
  approved: { next: 'completed', reject: 'approved', step: 4, role: '仓储管理员' },
  completed: { next: 'completed', reject: 'completed', step: 5, role: '系统' },
};

const PO_STATUS_NAMES: Record<POStatus, string> = {
  draft: '草稿',
  finance_pending: '财务待审批',
  finance_rejected: '财务已驳回',
  warehouse_pending: '仓储待确认',
  warehouse_rejected: '仓储已驳回',
  rejected: '已驳回',
  approved: '审批通过',
  completed: '已完成',
};

const STEP_NAMES: Record<number, string> = {
  1: '创建采购单',
  2: '财务审批',
  3: '仓储确认',
  4: '审批通过',
  5: '完成入库',
};

export function getPOStatusName(status: POStatus): string {
  return PO_STATUS_NAMES[status] || status;
}

export function getStepName(step: number): string {
  return STEP_NAMES[step] || `步骤${step}`;
}

export function getNextPOStatus(current: POStatus): POStatus {
  return PO_STATUS_FLOW[current]?.next || current;
}

export function getRejectPOStatus(current: POStatus): POStatus {
  return PO_STATUS_FLOW[current]?.reject || current;
}

export function getCurrentStep(status: POStatus): number {
  return PO_STATUS_FLOW[status]?.step || 1;
}

export function getApproverRole(status: POStatus): string {
  return PO_STATUS_FLOW[status]?.role || '-';
}

export function generateApprovalHistory(
  status: POStatus,
  createdBy: string,
  createdById: string,
  rejectionCount: number = 0,
): ApprovalHistory[] {
  const history: ApprovalHistory[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - Math.floor(Math.random() * 15) - 1);
  let version = 1;
  let currentStep = 1;

  history.push({
    step: currentStep,
    stepName: getStepName(currentStep),
    role: '运营专员',
    user: createdBy,
    userId: createdById,
    action: 'submit',
    comment: '提交采购申请',
    createdAt: baseDate.toISOString(),
    version,
  });

  if (status === 'draft') {
    return history;
  }

  const steps: Array<{ status: POStatus; role: string; user: string; userId: string }> = [
    { status: 'finance_pending', role: '财务', user: '赵雅琴', userId: 'U004' },
    { status: 'warehouse_pending', role: '仓储管理员', user: '刘国强', userId: 'U005' },
  ];

  let rejected = false;
  let rejectedFrom = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    currentStep = i + 2;
    baseDate.setHours(baseDate.getHours() + Math.floor(Math.random() * 6) + 2);

    if (!rejected && (status === 'finance_rejected' || status === 'warehouse_rejected' || status === 'rejected')) {
      const rejectAtStep = status === 'finance_rejected' ? 2 : status === 'warehouse_rejected' ? 3 : Math.random() > 0.5 ? 2 : 3;
      if (currentStep === rejectAtStep) {
        rejected = true;
        rejectedFrom = currentStep;
        history.push({
          step: currentStep,
          stepName: getStepName(currentStep),
          role: step.role,
          user: step.user,
          userId: step.userId,
          action: 'reject',
          comment: getRandomRejectComment(),
          rejectedFrom,
          createdAt: baseDate.toISOString(),
          version,
        });
        break;
      }
    }

    if (status === step.status || status === 'approved' || status === 'completed') {
      history.push({
        step: currentStep,
        stepName: getStepName(currentStep),
        role: step.role,
        user: step.user,
        userId: step.userId,
        action: 'approve',
        comment: `${step.role}审核通过`,
        createdAt: baseDate.toISOString(),
        version,
      });
    }
  }

  if (status === 'approved') {
    currentStep = 4;
    baseDate.setHours(baseDate.getHours() + 1);
    history.push({
      step: currentStep,
      stepName: getStepName(currentStep),
      role: '系统',
      user: '系统',
      userId: 'SYSTEM',
      action: 'approve',
      comment: '审批通过，等待入库',
      createdAt: baseDate.toISOString(),
      version,
    });
  }

  if (status === 'completed') {
    currentStep = 4;
    baseDate.setHours(baseDate.getHours() + 1);
    history.push({
      step: currentStep,
      stepName: getStepName(currentStep),
      role: '系统',
      user: '系统',
      userId: 'SYSTEM',
      action: 'approve',
      comment: '审批通过，等待入库',
      createdAt: baseDate.toISOString(),
      version,
    });

    currentStep = 5;
    baseDate.setDate(baseDate.getDate() + Math.floor(Math.random() * 3) + 1);
    history.push({
      step: currentStep,
      stepName: getStepName(currentStep),
      role: '仓储管理员',
      user: '刘国强',
      userId: 'U005',
      action: 'approve',
      comment: '已完成入库',
      createdAt: baseDate.toISOString(),
      version,
    });
  }

  if (rejectionCount > 0 && rejected) {
    for (let r = 1; r < rejectionCount + 1; r++) {
      version++;
      baseDate.setHours(baseDate.getHours() + Math.floor(Math.random() * 24) + 4);
      history.push({
        step: 1,
        stepName: getStepName(1),
        role: '运营专员',
        user: createdBy,
        userId: createdById,
        action: 'resubmit',
        comment: `第${r + 1}次重新提交，已修改问题`,
        createdAt: baseDate.toISOString(),
        version,
      });

      const reSteps: Array<{ role: string; user: string; userId: string }> = [
        { role: '财务', user: '赵雅琴', userId: 'U004' },
        { role: '仓储管理员', user: '刘国强', userId: 'U005' },
      ];

      let finalApproved = r === rejectionCount;
      for (let i = 0; i < reSteps.length; i++) {
        const step = reSteps[i];
        const stepNum = i + 2;
        baseDate.setHours(baseDate.getHours() + Math.floor(Math.random() * 6) + 2);

        if (!finalApproved && i === reSteps.length - 1) {
          history.push({
            step: stepNum,
            stepName: getStepName(stepNum),
            role: step.role,
            user: step.user,
            userId: step.userId,
            action: 'reject',
            comment: getRandomRejectComment(),
            rejectedFrom: rejectedFrom,
            createdAt: baseDate.toISOString(),
            version,
          });
          break;
        }

        history.push({
          step: stepNum,
          stepName: getStepName(stepNum),
          role: step.role,
          user: step.user,
          userId: step.userId,
          action: 'approve',
          comment: `${step.role}审核通过`,
          createdAt: baseDate.toISOString(),
          version,
        });
      }

      if (finalApproved) {
        baseDate.setHours(baseDate.getHours() + 1);
        history.push({
          step: 4,
          stepName: getStepName(4),
          role: '系统',
          user: '系统',
          userId: 'SYSTEM',
          action: 'approve',
          comment: '审批通过，等待入库',
          createdAt: baseDate.toISOString(),
          version,
        });
      }
    }
  }

  return history;
}

function getRandomRejectComment(): string {
  const comments = [
    '预算不足，请调整采购数量',
    '该商品不在采购目录内，请确认',
    '供应商资质待审核，请补充材料',
    '价格偏高，请重新议价',
    '采购数量过大，请说明理由',
    '请补充采购用途说明',
    '规格参数不明确，请完善',
  ];
  return comments[Math.floor(Math.random() * comments.length)];
}

export function canSubmitPO(po: PurchaseOrder, user: User): boolean {
  return po.status === 'draft' && user.permissions.includes(PERMISSIONS.PURCHASE_SUBMIT);
}

export function canApprovePO(po: PurchaseOrder, user: User): boolean {
  if (po.status === 'finance_pending' && user.permissions.includes(PERMISSIONS.PURCHASE_APPROVE_FINANCE)) {
    return true;
  }
  if (po.status === 'warehouse_pending' && user.permissions.includes(PERMISSIONS.PURCHASE_APPROVE_WAREHOUSE)) {
    return true;
  }
  return false;
}

export function canRejectPO(po: PurchaseOrder, user: User): boolean {
  if ((po.status === 'finance_pending' || po.status === 'warehouse_pending') &&
      user.permissions.includes(PERMISSIONS.PURCHASE_REJECT)) {
    return true;
  }
  return false;
}

export function canResubmitPO(po: PurchaseOrder, user: User): boolean {
  return (po.status === 'finance_rejected' || po.status === 'warehouse_rejected' || po.status === 'rejected') &&
         user.permissions.includes(PERMISSIONS.PURCHASE_RESUBMIT);
}

export function canCompletePO(po: PurchaseOrder, user: User): boolean {
  return po.status === 'approved' && user.permissions.includes(PERMISSIONS.INVENTORY_EDIT);
}
