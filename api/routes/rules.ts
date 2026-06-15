import { Router, type Request, type Response } from 'express';
import type { RuleConfig, AlertItem, InboxMessage } from '../../shared/types.js';
import { PERMISSIONS } from '../../shared/types.js';
import { success, error, requireAuth, requirePermissions, type AuthRequest } from '../utils.js';
import { rules as mockRules, mockAlerts, inboxMessages } from '../data/mockData.js';

const router = Router();

function randomId(prefix = ''): string {
  return prefix + Math.random().toString(36).substring(2, 10) + Date.now().toString(36).slice(-4);
}

function checkAndTriggerRule(rule: RuleConfig, user: { id: string; name: string }): {
  alert: AlertItem | null;
  message: InboxMessage | null;
} {
  const triggered: { alert: AlertItem | null; message: InboxMessage | null } = { alert: null, message: null };

  if (!rule.enabled) return triggered;

  const shouldTrigger = Math.random() > 0.5;
  if (!shouldTrigger) return triggered;

  if (rule.category === 'alert') {
    const alertTypes: Array<'critical' | 'warning' | 'info'> = ['critical', 'warning', 'info'];
    const type = rule.trigger.type === 'threshold' ? 'warning' : rule.trigger.type === 'event' ? 'info' : 'warning';

    const alert: AlertItem = {
      id: randomId('ALT'),
      type,
      title: `规则触发：${rule.name}`,
      description: rule.description,
      channel: 'system',
      createdAt: new Date().toISOString(),
      status: 'pending',
      assignee: user.name,
      ruleId: rule.id,
    };

    const message: InboxMessage = {
      id: randomId('MSG'),
      type: 'alert',
      title: `规则告警：${rule.name}`,
      content: rule.description,
      read: false,
      userId: user.id,
      relatedId: rule.id,
      relatedType: 'rule',
      createdAt: new Date().toISOString(),
    };

    triggered.alert = alert;
    triggered.message = message;
  }

  return triggered;
}

router.get(
  '/',
  requireAuth,
  requirePermissions([PERMISSIONS.RULES_VIEW]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 10;
      const category = req.query.category as string | undefined;
      const enabled = req.query.enabled as string | undefined;

      let filtered = [...mockRules];
      if (category) {
        filtered = filtered.filter((r) => r.category === category);
      }
      if (enabled !== undefined) {
        filtered = filtered.filter((r) => r.enabled === (enabled === 'true'));
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
  '/',
  requireAuth,
  requirePermissions([PERMISSIONS.RULES_CREATE]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;
      const body = req.body as Partial<RuleConfig>;
      const now = new Date().toISOString();

      const validCategories = ['pricing', 'replenish', 'reconcile', 'alert', 'other'];
      const category = validCategories.includes(body.category as string) ? body.category : 'other';

      const newRule: RuleConfig = {
        id: `RULE${String(mockRules.length + 1).padStart(3, '0')}`,
        name: body.name || '新规则',
        description: body.description || '',
        category: category as RuleConfig['category'],
        enabled: body.enabled !== undefined ? body.enabled : true,
        trigger: body.trigger || { type: 'event', config: {} },
        conditions: body.conditions || [],
        actions: body.actions || [],
        createdBy: user.name,
        createdById: user.id,
        createdAt: now,
        updatedAt: now,
      };

      mockRules.unshift(newRule);

      const result = checkAndTriggerRule(newRule, user);
      if (result.alert) {
        mockAlerts.unshift(result.alert);
      }
      if (result.message) {
        inboxMessages.unshift(result.message);
      }

      res.json(
        success(
          {
            rule: newRule,
            triggered: result.alert ? true : false,
          },
          '创建成功',
        ),
      );
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '创建失败', 500));
    }
  },
);

router.put(
  '/:id',
  requireAuth,
  requirePermissions([PERMISSIONS.RULES_EDIT]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;
      const { id } = req.params;
      const body = req.body as Partial<RuleConfig>;

      const idx = mockRules.findIndex((r) => r.id === id);
      if (idx === -1) {
        res.status(404).json(error('规则不存在', 404));
        return;
      }

      const validCategories = ['pricing', 'replenish', 'reconcile', 'alert', 'other'];
      const category = body.category && validCategories.includes(body.category) ? body.category : mockRules[idx].category;

      mockRules[idx] = {
        ...mockRules[idx],
        ...body,
        id: mockRules[idx].id,
        category: category as RuleConfig['category'],
        createdAt: mockRules[idx].createdAt,
        createdBy: mockRules[idx].createdBy,
        createdById: mockRules[idx].createdById,
        updatedAt: new Date().toISOString(),
      };

      const result = checkAndTriggerRule(mockRules[idx], user);
      if (result.alert) {
        mockAlerts.unshift(result.alert);
      }
      if (result.message) {
        inboxMessages.unshift(result.message);
      }

      res.json(
        success(
          {
            rule: mockRules[idx],
            triggered: result.alert ? true : false,
          },
          '更新成功',
        ),
      );
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '更新失败', 500));
    }
  },
);

router.delete(
  '/:id',
  requireAuth,
  requirePermissions([PERMISSIONS.RULES_DELETE]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const idx = mockRules.findIndex((r) => r.id === id);
      if (idx === -1) {
        res.status(404).json(error('规则不存在', 404));
        return;
      }

      mockRules.splice(idx, 1);
      res.json(success(null, '删除成功'));
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '删除失败', 500));
    }
  },
);

export default router;
