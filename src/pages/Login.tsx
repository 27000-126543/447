import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Sparkles,
  Package,
  Megaphone,
  Workflow,
  Settings,
  User,
  Lock,
  AlertCircle,
  Box,
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { User as UserType } from '@shared/types';

const testAccounts = [
  { username: 'admin', password: 'admin123', role: '超级管理员' },
  { username: 'operator', password: 'oper123', role: '运营' },
  { username: 'finance', password: 'fin123', role: '财务' },
  { username: 'warehouse', password: 'ware123', role: '仓储' },
  { username: 'region', password: 'reg123', role: '区域经理' },
];

const featureList = [
  { icon: LayoutDashboard, title: '全渠道数据看板', desc: '实时掌握全域经营数据' },
  { icon: ShoppingCart, title: '订单智能处理', desc: '多渠道订单统一管理' },
  { icon: Sparkles, title: 'AI 推荐引擎', desc: '精准提升转化率' },
  { icon: Package, title: '智能库存管理', desc: '预测需求优化采购' },
  { icon: Megaphone, title: '自动化营销', desc: '全链路用户触达' },
  { icon: Workflow, title: '灵活规则引擎', desc: '自定义业务规则' },
];

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: UserType }>('/auth/login', {
        username,
        password,
      });
      if (res.code === 0) {
        api.setToken(res.data.token);
        setAuth(res.data.token, res.data.user);
        navigate('/dashboard');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const fillAccount = (acc: (typeof testAccounts)[number]) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-slate-950 overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800" />
        <div className="absolute inset-0 bg-grid-slate bg-[size:40px_40px] opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-400/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 flex flex-col justify-center px-16 py-20 w-full">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-glow-accent">
              <Box className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold font-display text-white">
              OmniOps
            </span>
          </div>

          <h1 className="text-4xl font-bold font-display text-white mb-4 leading-tight">
            全渠道订单聚合
            <br />
            与智能运营平台
          </h1>
          <p className="text-brand-200/80 text-lg mb-12 max-w-md">
            打通全域渠道数据，AI 驱动智能决策，助力企业实现数字化运营升级
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-lg">
            {featureList.map((feature) => (
              <div
                key={feature.title}
                className="glass-card p-4 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-accent-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm mb-0.5">
                    {feature.title}
                  </h3>
                  <p className="text-brand-200/60 text-xs">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-10 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-glow-accent">
              <Box className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold font-display text-white">
              OmniOps
            </span>
          </div>

          <h2 className="text-2xl font-bold font-display text-white mb-2">
            欢迎登录
          </h2>
          <p className="text-slate-400 mb-8">请输入账号密码访问系统</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="input-field pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-field pl-10"
                  disabled={loading}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-danger text-sm bg-danger/10 px-3 py-2 rounded-lg border border-danger/30">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full btn-primary py-3 text-base',
                loading && 'opacity-70 cursor-not-allowed'
              )}
            >
              {loading ? (
                <LoadingSpinner size="sm" className="flex-row" />
              ) : (
                '登 录'
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="text-xs text-slate-500 mb-3 flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" />
              测试账号（点击快速填充）
            </div>
            <div className="grid grid-cols-2 gap-2">
              {testAccounts.map((acc) => (
                <button
                  key={acc.username}
                  onClick={() => fillAccount(acc)}
                  className="glass-card-hover px-3 py-2.5 text-left group"
                  disabled={loading}
                >
                  <div className="text-sm text-white font-medium group-hover:text-accent-400 transition-colors">
                    {acc.username}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {acc.role}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
