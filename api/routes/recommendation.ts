import { Router, type Request, type Response } from 'express';
import type { RecommendationStrategy, RecommendationMetrics } from '../../shared/types.js';
import { success, error, requireAuth } from '../utils.js';
import { recommendationStrategies, recommendationMetrics } from '../data/mockData.js';

const router = Router();

router.get('/strategies', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const data: RecommendationStrategy[] = recommendationStrategies;
    res.json(success(data, '获取成功'));
  } catch (e) {
    const err = e as Error;
    res.status(500).json(error(err.message || '获取失败', 500));
  }
});

router.get('/metrics', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const data: RecommendationMetrics = recommendationMetrics;
    res.json(success(data, '获取成功'));
  } catch (e) {
    const err = e as Error;
    res.status(500).json(error(err.message || '获取失败', 500));
  }
});

router.put('/strategies/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body as Partial<RecommendationStrategy>;

    const idx = recommendationStrategies.findIndex((s) => s.id === id);
    if (idx === -1) {
      res.status(404).json(error('策略不存在', 404));
      return;
    }

    recommendationStrategies[idx] = {
      ...recommendationStrategies[idx],
      ...body,
      id: recommendationStrategies[idx].id,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    const data: RecommendationStrategy = recommendationStrategies[idx];
    res.json(success(data, '更新成功'));
  } catch (e) {
    const err = e as Error;
    res.status(500).json(error(err.message || '更新失败', 500));
  }
});

export default router;
