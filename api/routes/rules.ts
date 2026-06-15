import { Router, type Request, type Response } from 'express';
import type { RuleConfig } from '../../shared/types.js';
import { success, error, requireAuth } from '../utils.js';
import { rules as mockRules } from '../data/mockData.js';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
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
});

router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as Partial<RuleConfig>;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newRule: RuleConfig = {
      id: `rule-${mockRules.length + 1}`,
      name: body.name || '新规则',
      description: body.description || '',
      category: body.category || 'other',
      enabled: body.enabled !== undefined ? body.enabled : true,
      trigger: body.trigger || { type: 'event', config: {} },
      conditions: body.conditions || [],
      actions: body.actions || [],
      createdAt: now,
      updatedAt: now,
    };

    mockRules.unshift(newRule);
    res.json(success(newRule, '创建成功'));
  } catch (e) {
    const err = e as Error;
    res.status(500).json(error(err.message || '创建失败', 500));
  }
});

router.put('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body as Partial<RuleConfig>;

    const idx = mockRules.findIndex((r) => r.id === id);
    if (idx === -1) {
      res.status(404).json(error('规则不存在', 404));
      return;
    }

    mockRules[idx] = {
      ...mockRules[idx],
      ...body,
      id: mockRules[idx].id,
      createdAt: mockRules[idx].createdAt,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    res.json(success(mockRules[idx], '更新成功'));
  } catch (e) {
    const err = e as Error;
    res.status(500).json(error(err.message || '更新失败', 500));
  }
});

router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
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
});

export default router;
