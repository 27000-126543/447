import { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Sparkles,
  Package,
  Megaphone,
  Workflow,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Box,
  MapPin,
  LogOut,
  Database,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { filterMenuByRole } from '@/lib/permissions';
import { ROLE_MENU_ACCESS } from '@shared/types';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  children?: { path: string; label: string }[];
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: '数据看板', icon: LayoutDashboard },
  { path: '/orders', label: '订单中心', icon: ShoppingCart },
  {
    path: '/recommendation',
    label: '推荐引擎',
    icon: Sparkles,
    children: [
      { path: '/recommendation', label: '策略配置' },
      { path: '/recommendation/analytics', label: '效果分析' },
    ],
  },
  {
    path: '/inventory',
    label: '库存管理',
    icon: Package,
    children: [
      { path: '/inventory', label: '库存预测' },
      { path: '/inventory/purchase', label: '采购审批' },
    ],
  },
  {
    path: '/marketing',
    label: '营销中心',
    icon: Megaphone,
    children: [
      { path: '/marketing', label: '用户分层' },
      { path: '/marketing/automation', label: '自动化流程' },
    ],
  },
  { path: '/rules', label: '规则引擎', icon: Workflow },
  { path: '/data-collection', label: '数据采集', icon: Database },
  { path: '/notifications', label: '消息中心', icon: Bell },
  {
    path: '/settings',
    label: '系统设置',
    icon: Settings,
    children: [
      { path: '/settings/permissions', label: '权限管理' },
      { path: '/settings/logs', label: '操作日志' },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    '/recommendation',
    '/inventory',
    '/marketing',
    '/settings',
  ]);

  const filteredMenuItems = useMemo(() => {
    return filterMenuByRole(menuItems);
  }, [user]);

  const toggleMenu = (path: string) => {
    setExpandedMenus((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isChildActive = (item: MenuItem) => {
    if (!item.children) return false;
    return item.children.some((child) => location.pathname === child.path);
  };

  const handleLogout = async () => {
    logout();
  };

  return (
    <aside
      className={cn(
        'h-screen flex flex-col bg-slate-950/80 border-r border-slate-800/60 backdrop-blur-xl transition-all duration-300 sticky top-0',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div
        className={cn(
          'flex items-center border-b border-slate-800/60',
          collapsed ? 'justify-center h-16' : 'px-5 h-16 gap-3'
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-glow-accent flex-shrink-0">
          <Box className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-bold font-display text-white leading-tight">
              OmniOps
            </span>
            <span className="text-[10px] text-slate-500">智能运营平台</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        <div className="space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenus.includes(item.path);
            const active =
              location.pathname === item.path || isChildActive(item);

            return (
              <div key={item.path}>
                {hasChildren ? (
                  <button
                    onClick={() => !collapsed && toggleMenu(item.path)}
                    className={cn(
                      'sidebar-item w-full group',
                      active && 'sidebar-item-active',
                      collapsed && 'justify-center'
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 transition-transform duration-200',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </>
                    )}
                  </button>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'sidebar-item',
                        isActive && 'sidebar-item-active',
                        collapsed && 'justify-center'
                      )
                    }
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                )}

                {hasChildren && !collapsed && isExpanded && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-slate-800 pl-3">
                    {item.children!.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          cn(
                            'sidebar-item text-sm py-2',
                            isActive && 'sidebar-item-active'
                          )
                        }
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" />
                        <span>{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-800/60 p-3">
        <div
          className={cn(
            'glass-card p-3',
            collapsed && 'flex justify-center'
          )}
        >
          {collapsed ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.charAt(0) || 'U'}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium truncate">
                  {user?.name || '用户'}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">
                    {user?.region || user?.roleName || '未设置'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-item mt-2 justify-center w-full"
          title={collapsed ? '展开侧边栏' : '折叠侧边栏'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">折叠菜单</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
