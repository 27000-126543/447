import { Router, type Request, type Response } from 'express';
import type { DataCollectionTask, CleanRecord } from '../../shared/types.js';
import { PERMISSIONS } from '../../shared/types.js';
import { success, error, requireAuth, requirePermissions, type AuthRequest } from '../utils.js';
import { collectionTasks as mockCollectionTasks, cleanRecords as mockCleanRecords } from '../data/mockData.js';

const router = Router();

router.get(
  '/tasks',
  requireAuth,
  requirePermissions([PERMISSIONS.COLLECTION_VIEW]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const channel = req.query.channel as string | undefined;
      const type = req.query.type as string | undefined;
      const status = req.query.status as string | undefined;

      let filtered = [...mockCollectionTasks];

      if (channel) {
        filtered = filtered.filter((t) => t.channel === channel);
      }

      if (type) {
        filtered = filtered.filter((t) => t.type === type);
      }

      if (status) {
        filtered = filtered.filter((t) => t.status === status);
      }

      const list: DataCollectionTask[] = filtered;
      res.json(success(list, '获取成功'));
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '获取失败', 500));
    }
  },
);

router.post(
  '/tasks/:id/trigger',
  requireAuth,
  requirePermissions([PERMISSIONS.COLLECTION_TRIGGER]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const idx = mockCollectionTasks.findIndex((t) => t.id === id);
      if (idx === -1) {
        res.status(404).json(error('任务不存在', 404));
        return;
      }

      if (mockCollectionTasks[idx].status === 'running') {
        res.status(400).json(error('任务正在运行中，请等待完成', 400));
        return;
      }

      mockCollectionTasks[idx] = {
        ...mockCollectionTasks[idx],
        status: 'running',
        progress: 0,
        startedAt: new Date().toISOString(),
        completedAt: undefined,
        errorMessage: undefined,
        collected: 0,
        cleaned: 0,
        discarded: 0,
      };

      res.json(success(mockCollectionTasks[idx], '任务已触发'));

      const progressSteps = [25, 50, 75, 100];
      let stepIdx = 0;

      const updateProgress = () => {
        if (stepIdx >= progressSteps.length) {
          const currentIdx = mockCollectionTasks.findIndex((t) => t.id === id);
          if (currentIdx !== -1) {
            mockCollectionTasks[currentIdx] = {
              ...mockCollectionTasks[currentIdx],
              status: 'completed',
              progress: 100,
              collected: mockCollectionTasks[currentIdx].totalRecords,
              cleaned: Math.floor(mockCollectionTasks[currentIdx].totalRecords * 0.92),
              discarded: Math.floor(mockCollectionTasks[currentIdx].totalRecords * 0.08),
              completedAt: new Date().toISOString(),
            };
          }
          return;
        }

        const progress = progressSteps[stepIdx];
        const currentIdx = mockCollectionTasks.findIndex((t) => t.id === id);
        if (currentIdx !== -1 && mockCollectionTasks[currentIdx].status === 'running') {
          const collected = Math.floor(mockCollectionTasks[currentIdx].totalRecords * (progress / 100));
          mockCollectionTasks[currentIdx] = {
            ...mockCollectionTasks[currentIdx],
            progress,
            collected,
            cleaned: Math.floor(collected * 0.92),
            discarded: Math.floor(collected * 0.08),
          };
        }

        stepIdx++;
        setTimeout(updateProgress, 1000);
      };

      setTimeout(updateProgress, 1000);
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '触发失败', 500));
    }
  },
);

router.get(
  '/tasks/:id/clean-records',
  requireAuth,
  requirePermissions([PERMISSIONS.COLLECTION_VIEW]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 10;
      const issueType = req.query.issueType as string | undefined;
      const action = req.query.action as string | undefined;

      const taskIdx = mockCollectionTasks.findIndex((t) => t.id === id);
      if (taskIdx === -1) {
        res.status(404).json(error('任务不存在', 404));
        return;
      }

      let filtered = mockCleanRecords.filter((r) => r.taskId === id);

      if (issueType) {
        filtered = filtered.filter((r) => r.issueType === issueType);
      }

      if (action) {
        filtered = filtered.filter((r) => r.action === action);
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
  '/tasks/trigger-all',
  requireAuth,
  requirePermissions([PERMISSIONS.COLLECTION_TRIGGER]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const triggered: string[] = [];
      const skipped: string[] = [];

      for (let i = 0; i < mockCollectionTasks.length; i++) {
        if (mockCollectionTasks[i].status === 'running') {
          skipped.push(mockCollectionTasks[i].id);
          continue;
        }

        mockCollectionTasks[i] = {
          ...mockCollectionTasks[i],
          status: 'running',
          progress: 0,
          startedAt: new Date().toISOString(),
          completedAt: undefined,
          errorMessage: undefined,
          collected: 0,
          cleaned: 0,
          discarded: 0,
        };
        triggered.push(mockCollectionTasks[i].id);

        const taskId = mockCollectionTasks[i].id;
        const totalRecords = mockCollectionTasks[i].totalRecords;

        const progressSteps = [25, 50, 75, 100];
        let stepIdx = 0;

        const updateProgress = () => {
          if (stepIdx >= progressSteps.length) {
            const currentIdx = mockCollectionTasks.findIndex((t) => t.id === taskId);
            if (currentIdx !== -1) {
              mockCollectionTasks[currentIdx] = {
                ...mockCollectionTasks[currentIdx],
                status: 'completed',
                progress: 100,
                collected: totalRecords,
                cleaned: Math.floor(totalRecords * 0.92),
                discarded: Math.floor(totalRecords * 0.08),
                completedAt: new Date().toISOString(),
              };
            }
            return;
          }

          const progress = progressSteps[stepIdx];
          const currentIdx = mockCollectionTasks.findIndex((t) => t.id === taskId);
          if (currentIdx !== -1 && mockCollectionTasks[currentIdx].status === 'running') {
            const collected = Math.floor(totalRecords * (progress / 100));
            mockCollectionTasks[currentIdx] = {
              ...mockCollectionTasks[currentIdx],
              progress,
              collected,
              cleaned: Math.floor(collected * 0.92),
              discarded: Math.floor(collected * 0.08),
            };
          }

          stepIdx++;
          setTimeout(updateProgress, 1500);
        };

        setTimeout(updateProgress, 1000);
      }

      res.json(
        success(
          {
            triggered,
            skipped,
            total: mockCollectionTasks.length,
          },
          `已触发 ${triggered.length} 个任务，跳过 ${skipped.length} 个运行中的任务`,
        ),
      );
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '触发失败', 500));
    }
  },
);

export default router;
