import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  ChevronRight,
  User,
  LogOut,
  Shield,
  MapPin,
  AlertTriangle,
  FileCheck,
  Info,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { formatRelativeTime } from '@/lib/format';
import type { InboxMessage } from '@shared/types';

interface Breadcrumb {
  label: string;
  path?: string;
}

const breadcrumbMap: Record<string, Breadcrumb[]> = {
  '/dashboard': [{ label: '数据看板' }],
  '/orders': [{ label: '订单中心' }],
  '/recommendation': [
    { label: '推荐引擎', path: '/recommendation' },
    { label: '策略配置' },
  ],
  '/recommendation/analytics': [
    { label: '推荐引擎', path: '/recommendation' },
    { label: '效果分析' },
  ],
  '/inventory': [
    { label: '库存管理', path: '/inventory' },
    { label: '库存预测' },
  ],
  '/inventory/purchase': [
    { label: '库存管理', path: '/inventory' },
    { label: '采购审批' },
  ],
  '/marketing': [
    { label: '营销中心', path: '/marketing' },
    { label: '用户分层' },
  ],
  '/marketing/automation': [
    { label: '营销中心', path: '/marketing' },
    { label: '自动化流程' },
  ],
  '/rules': [{ label: '规则引擎' }],
  '/data-collection': [{ label: '数据采集' }],
  '/notifications': [{ label: '消息中心' }],
  '/settings/permissions': [
    { label: '系统设置', path: '/settings/permissions' },
    { label: '权限管理' },
  ],
  '/settings/logs': [
    { label: '系统设置', path: '/settings/permissions' },
    { label: '操作日志' },
  ],
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<InboxMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const breadcrumbs = breadcrumbMap[location.pathname] || [
    { label: '首页' },
  ];

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get<{ list: InboxMessage[]; unreadCount: number }>('/notifications/inbox?limit=5&unreadOnly=true');
      if (res.data) {
        setNotifications(res.data.list || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/inbox/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  };

  const handleNotificationClick = (msg: InboxMessage) => {
    if (!msg.read) {
      markAsRead(msg.id);
    }
    setShowNotifications(false);
    navigate('/notifications');
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="w-4 h-4 text-danger" />;
      case 'approval': return <FileCheck className="w-4 h-4 text-accent-400" />;
      default: return <Info className="w-4 h-4 text-info" />;
    }
  };

  const getNotifDotClass = (type: string) => {
    switch (type) {
      case 'alert': return 'bg-danger';
      case 'approval': return 'bg-accent-500';
      default: return 'bg-info';
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-slate-950/50 backdrop-blur-xl border-b border-slate-800/60 sticky top-0 z-30">
      <div className="h-full flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button className="btn-ghost p-2">
            <Menu className="w-5 h-5" />
          </button>

          <nav className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">首页</span>
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-slate-600" />
                {crumb.path ? (
                  <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">
                    {crumb.label}
                  </span>
                ) : (
                  <span className="text-white font-medium">{crumb.label}</span>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative mr-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="搜索订单、商品、用户..."
              className="w-64 h-9 pl-9 pr-4 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-400/60 focus:ring-1 focus:ring-brand-400/30 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
              ⌘K
            </kbd>
          </div>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn-ghost p-2.5 relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger text-white text-[10px] font-medium rounded-full flex items-center justify-center animate-glow-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 glass-card p-2 shadow-card animate-fade-in">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <h3 className="text-sm font-medium text-white">
                    未读消息 ({unreadCount})
                  </h3>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                      <p className="text-sm text-slate-500">暂无未读消息</p>
                    </div>
                  ) : (
                    notifications.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => handleNotificationClick(msg)}
                        className="px-3 py-2.5 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                              getNotifDotClass(msg.type)
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {getNotifIcon(msg.type)}
                              <p className="text-sm text-white font-medium truncate">
                                {msg.title}
                              </p>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2">
                              {msg.content}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {formatRelativeTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-3 py-2 border-t border-slate-800 mt-1">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/notifications');
                    }}
                    className="w-full text-sm text-accent-400 hover:text-accent-300 transition-colors"
                  >
                    查看全部消息
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm text-white font-medium leading-tight">
                  {user?.name || '用户'}
                </div>
                <div className="text-xs text-slate-500">
                  {user?.roleName || '未设置角色'}
                </div>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 glass-card p-2 shadow-card animate-fade-in">
                <div className="px-3 py-3 border-b border-slate-800 mb-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-medium">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-white font-medium truncate">
                        {user?.name || '用户'}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {user?.username}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="badge bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      <Shield className="w-3 h-3 mr-1" />
                      {user?.roleName || '未设置'}
                    </span>
                    {user?.region && (
                      <span className="badge bg-slate-700/50 text-slate-300 border border-slate-600/50">
                        <MapPin className="w-3 h-3 mr-1" />
                        {user.region}
                      </span>
                    )}
                  </div>
                </div>
                <button className="sidebar-item w-full">
                  <User className="w-4 h-4" />
                  <span>个人信息</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="sidebar-item w-full text-danger hover:text-danger hover:bg-danger/10"
                >
                  <LogOut className="w-4 h-4" />
                  <span>退出登录</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
