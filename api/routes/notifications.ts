import { Router, type Request, type Response } from 'express';
import type { InboxMessage, SmsRecord } from '../../shared/types.js';
import { PERMISSIONS } from '../../shared/types.js';
import { success, error, requireAuth, requirePermissions, type AuthRequest } from '../utils.js';
import { inboxMessages as mockInboxMessages, smsRecords as mockSmsRecords } from '../data/mockData.js';

const router = Router();

router.get(
  '/inbox',
  requireAuth,
  requirePermissions([PERMISSIONS.NOTIFICATIONS_VIEW]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 10;
      const read = req.query.read as string | undefined;
      const type = req.query.type as string | undefined;

      let filtered = mockInboxMessages.filter((m) => m.userId === user.id);

      if (read !== undefined) {
        filtered = filtered.filter((m) => m.read === (read === 'true'));
      }

      if (type) {
        filtered = filtered.filter((m) => m.type === type);
      }

      filtered.sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const total = filtered.length;
      const list = filtered.slice((page - 1) * pageSize, page * pageSize);
      const unreadCount = mockInboxMessages.filter((m) => m.userId === user.id && !m.read).length;

      res.json(
        success(
          {
            list,
            total,
            page,
            pageSize,
            unreadCount,
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
  '/inbox/:id/read',
  requireAuth,
  requirePermissions([PERMISSIONS.NOTIFICATIONS_MARK_READ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;
      const { id } = req.params;

      const idx = mockInboxMessages.findIndex((m) => m.id === id && m.userId === user.id);
      if (idx === -1) {
        res.status(404).json(error('消息不存在', 404));
        return;
      }

      mockInboxMessages[idx] = {
        ...mockInboxMessages[idx],
        read: true,
      };

      const data: InboxMessage = mockInboxMessages[idx];
      res.json(success(data, '标记已读成功'));
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '标记失败', 500));
    }
  },
);

router.post(
  '/inbox/read-all',
  requireAuth,
  requirePermissions([PERMISSIONS.NOTIFICATIONS_MARK_READ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;

      let count = 0;
      for (let i = 0; i < mockInboxMessages.length; i++) {
        if (mockInboxMessages[i].userId === user.id && !mockInboxMessages[i].read) {
          mockInboxMessages[i] = {
            ...mockInboxMessages[i],
            read: true,
          };
          count++;
        }
      }

      res.json(success({ count }, `已标记 ${count} 条消息为已读`));
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '标记失败', 500));
    }
  },
);

router.get(
  '/sms',
  requireAuth,
  requirePermissions([PERMISSIONS.NOTIFICATIONS_VIEW]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 10;
      const assigneeUserId = req.query.assigneeUserId as string | undefined;
      const status = req.query.status as string | undefined;
      const type = req.query.type as string | undefined;

      let filtered = [...mockSmsRecords];

      if (assigneeUserId) {
        filtered = filtered.filter((s) => s.assigneeUserId === assigneeUserId);
      }

      if (status) {
        filtered = filtered.filter((s) => s.status === status);
      }

      if (type) {
        filtered = filtered.filter((s) => s.type === type);
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
  '/sms/send',
  requireAuth,
  requirePermissions([PERMISSIONS.NOTIFICATIONS_VIEW]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthRequest).currentUser!;
      const { phone, receiverName, content, type } = req.body as {
        phone: string;
        receiverName: string;
        content: string;
        type: 'alert' | 'marketing' | 'verification';
      };

      if (!phone || !content) {
        res.status(400).json(error('手机号和内容不能为空', 400));
        return;
      }

      const successRate = Math.random();
      const status: 'sent' | 'failed' = successRate > 0.1 ? 'sent' : 'failed';
      const failureReason = status === 'failed'
        ? ['信号弱，发送超时', '号码为空号', '用户拒收'][Math.floor(Math.random() * 3)]
        : undefined;

      const newRecord: SmsRecord = {
        id: `SMS${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(2, 6)}`,
        phone,
        receiverName: receiverName || '未知',
        content,
        type: type || 'alert',
        status,
        sentAt: status === 'sent' ? new Date().toISOString() : undefined,
        failureReason,
        assigneeUserId: user.id,
        createdAt: new Date().toISOString(),
      };

      mockSmsRecords.unshift(newRecord);

      res.json(
        success(
          {
            record: newRecord,
            success: status === 'sent',
          },
          status === 'sent' ? '发送成功' : '发送失败',
        ),
      );
    } catch (e) {
      const err = e as Error;
      res.status(500).json(error(err.message || '发送失败', 500));
    }
  },
);

export default router;
