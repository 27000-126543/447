import { useEffect, useState } from 'react'
import {
  Shield, ChevronDown, ChevronRight, Check,
  Square, Minus, Save, Users, LayoutDashboard,
  ShoppingCart, Sparkles, Package, FileText,
  Settings, Bell, Database, UserCheck
} from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { PermissionRole } from '@shared/types'

interface PermissionModule {
  key: string
  label: string
  icon: typeof LayoutDashboard
  children: { key: string; label: string }[]
}

const permissionModules: PermissionModule[] = [
  {
    key: 'dashboard',
    label: '数据看板',
    icon: LayoutDashboard,
    children: [
      { key: 'dashboard:view', label: '查看' },
      { key: 'dashboard:edit', label: '编辑' },
      { key: 'dashboard:export', label: '导出' },
    ],
  },
  {
    key: 'orders',
    label: '订单中心',
    icon: ShoppingCart,
    children: [
      { key: 'orders:view', label: '查看' },
      { key: 'orders:edit', label: '编辑' },
      { key: 'orders:delete', label: '删除' },
      { key: 'orders:export', label: '导出' },
    ],
  },
  {
    key: 'recommendation',
    label: '推荐引擎',
    icon: Sparkles,
    children: [
      { key: 'recommendation:view', label: '查看' },
      { key: 'recommendation:edit', label: '编辑' },
      { key: 'recommendation:export', label: '导出' },
    ],
  },
  {
    key: 'inventory',
    label: '库存管理',
    icon: Package,
    children: [
      { key: 'inventory:view', label: '查看' },
      { key: 'inventory:edit', label: '编辑' },
      { key: 'inventory:delete', label: '删除' },
      { key: 'inventory:export', label: '导出' },
    ],
  },
  {
    key: 'marketing',
    label: '营销中心',
    icon: Bell,
    children: [
      { key: 'marketing:view', label: '查看' },
      { key: 'marketing:edit', label: '编辑' },
      { key: 'marketing:delete', label: '删除' },
    ],
  },
  {
    key: 'finance',
    label: '财务中心',
    icon: FileText,
    children: [
      { key: 'finance:view', label: '查看' },
      { key: 'finance:edit', label: '编辑' },
      { key: 'finance:export', label: '导出' },
      { key: 'finance:approve', label: '审核' },
    ],
  },
  {
    key: 'settings',
    label: '系统设置',
    icon: Settings,
    children: [
      { key: 'settings:view', label: '查看' },
      { key: 'settings:edit', label: '编辑' },
    ],
  },
  {
    key: 'users',
    label: '用户管理',
    icon: Users,
    children: [
      { key: 'users:view', label: '查看' },
      { key: 'users:edit', label: '编辑' },
      { key: 'users:delete', label: '删除' },
    ],
  },
]

const dataScopeOptions = [
  { value: 'all', label: '全部数据', icon: Database, description: '可查看所有区域数据' },
  { value: 'region', label: '本区域数据', icon: UserCheck, description: '仅可查看所属区域数据' },
  { value: 'self', label: '仅自己数据', icon: Shield, description: '仅可查看自己创建的数据' },
] as const

export default function SettingsPermissions() {
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<PermissionRole[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(permissionModules.map(m => m.key)))
  const [saving, setSaving] = useState(false)

  const [editingRole, setEditingRole] = useState<Partial<PermissionRole>>({
    name: '',
    description: '',
    dataScope: 'self',
    permissions: [],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get<PermissionRole[]>('/settings/permissions')
        setRoles(res.data)
        if (res.data.length > 0) {
          const firstRole = res.data[0]
          setSelectedRoleId(firstRole.id)
          setEditingRole({
            name: firstRole.name,
            description: firstRole.description,
            dataScope: firstRole.dataScope,
            permissions: [...firstRole.permissions],
          })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const selectedRole = roles.find(r => r.id === selectedRoleId)

  const handleSelectRole = (role: PermissionRole) => {
    setSelectedRoleId(role.id)
    setEditingRole({
      name: role.name,
      description: role.description,
      dataScope: role.dataScope,
      permissions: [...role.permissions],
    })
  }

  const toggleModule = (key: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const getModulePermissions = (module: PermissionModule) => {
    return module.children.map(c => c.key)
  }

  const isModuleAllChecked = (module: PermissionModule) => {
    const perms = getModulePermissions(module)
    return perms.every(p => editingRole.permissions?.includes(p))
  }

  const isModulePartiallyChecked = (module: PermissionModule) => {
    const perms = getModulePermissions(module)
    const checkedCount = perms.filter(p => editingRole.permissions?.includes(p)).length
    return checkedCount > 0 && checkedCount < perms.length
  }

  const toggleModulePermission = (module: PermissionModule) => {
    const perms = getModulePermissions(module)
    const allChecked = isModuleAllChecked(module)
    setEditingRole(prev => {
      let newPerms = [...(prev.permissions || [])]
      if (allChecked) {
        newPerms = newPerms.filter(p => !perms.includes(p))
      } else {
        perms.forEach(p => {
          if (!newPerms.includes(p)) newPerms.push(p)
        })
      }
      return { ...prev, permissions: newPerms }
    })
  }

  const toggleSinglePermission = (permKey: string) => {
    setEditingRole(prev => {
      const perms = [...(prev.permissions || [])]
      const idx = perms.indexOf(permKey)
      if (idx > -1) {
        perms.splice(idx, 1)
      } else {
        perms.push(permKey)
      }
      return { ...prev, permissions: perms }
    })
  }

  const handleSave = async () => {
    if (!selectedRoleId) return
    setSaving(true)
    setTimeout(() => {
      setRoles(prev => prev.map(r => r.id === selectedRoleId ? {
        ...r,
        name: editingRole.name || r.name,
        description: editingRole.description || r.description,
        dataScope: editingRole.dataScope || r.dataScope,
        permissions: editingRole.permissions || r.permissions,
      } : r))
      setSaving(false)
    }, 1000)
  }

  const totalPermissions = permissionModules.reduce((sum, m) => sum + m.children.length, 0)
  const checkedPermissions = editingRole.permissions?.length || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">权限管理</h1>
          <p className="text-slate-400 text-sm mt-1">配置角色权限与数据访问范围</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <div className="glass-card p-2">
            <div className="px-3 py-2 border-b border-slate-700/50 mb-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent-400" />
                角色列表
              </h3>
            </div>
            <div className="space-y-1">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200',
                    selectedRoleId === role.id
                      ? 'bg-accent-500/15 text-white border border-accent-500/30'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white border border-transparent'
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                    selectedRoleId === role.id
                      ? 'bg-accent-500/20 text-accent-400'
                      : 'bg-slate-700/50 text-slate-400'
                  )}>
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{role.name}</div>
                    <div className="text-xs text-slate-500 truncate">{role.description}</div>
                  </div>
                  {selectedRoleId === role.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-9 space-y-6">
          {selectedRole ? (
            <>
              <div className="glass-card p-5">
                <h3 className="text-base font-semibold text-white mb-4">角色基础信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">角色名称</label>
                    <input
                      type="text"
                      value={editingRole.name || ''}
                      onChange={(e) => setEditingRole(prev => ({ ...prev, name: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">角色编码</label>
                    <input
                      type="text"
                      value={selectedRole.code}
                      disabled
                      className="input-field bg-slate-800/30 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-slate-300 mb-2">角色描述</label>
                  <textarea
                    value={editingRole.description || ''}
                    onChange={(e) => setEditingRole(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="input-field resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">数据范围</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {dataScopeOptions.map(option => {
                      const Icon = option.icon
                      const active = editingRole.dataScope === option.value
                      return (
                        <button
                          key={option.value}
                          onClick={() => setEditingRole(prev => ({ ...prev, dataScope: option.value }))}
                          className={cn(
                            'flex items-start gap-3 p-4 rounded-lg border text-left transition-all duration-200',
                            active
                              ? 'border-accent-500/50 bg-accent-500/10'
                              : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                          )}
                        >
                          <div className={cn(
                            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                            active ? 'bg-accent-500/20 text-accent-400' : 'bg-slate-700/50 text-slate-400'
                          )}>
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={cn('text-sm font-medium', active ? 'text-accent-400' : 'text-white')}>
                              {option.label}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{option.description}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-white">功能权限</h3>
                  <span className="text-sm text-slate-400">
                    已选 <span className="text-accent-400 font-medium">{checkedPermissions}</span> / {totalPermissions}
                  </span>
                </div>

                <div className="space-y-2">
                  {permissionModules.map(module => {
                    const Icon = module.icon
                    const expanded = expandedModules.has(module.key)
                    const allChecked = isModuleAllChecked(module)
                    const partialChecked = isModulePartiallyChecked(module)
                    return (
                      <div key={module.key} className="border border-slate-700/50 rounded-lg overflow-hidden">
                        <div
                          className="flex items-center gap-3 px-4 py-3 bg-slate-800/30 cursor-pointer hover:bg-slate-800/50 transition-colors"
                          onClick={() => toggleModule(module.key)}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleModulePermission(module) }}
                            className="p-0.5 rounded transition-colors"
                          >
                            {allChecked ? (
                              <Check className="w-4 h-4 text-accent-400" />
                            ) : partialChecked ? (
                              <Minus className="w-4 h-4 text-accent-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                          <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-white flex-1">{module.label}</span>
                          <span className="text-xs text-slate-500">
                            {module.children.filter(c => editingRole.permissions?.includes(c.key)).length} / {module.children.length}
                          </span>
                          {expanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>

                        {expanded && (
                          <div className="px-4 py-3 border-t border-slate-700/50">
                            <div className="flex flex-wrap gap-2">
                              {module.children.map(child => {
                                const checked = editingRole.permissions?.includes(child.key)
                                return (
                                  <button
                                    key={child.key}
                                    onClick={() => toggleSinglePermission(child.key)}
                                    className={cn(
                                      'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all duration-200',
                                      checked
                                        ? 'border-accent-500/40 bg-accent-500/10 text-accent-400'
                                        : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                                    )}
                                  >
                                    {checked ? (
                                      <Check className="w-3.5 h-3.5" />
                                    ) : (
                                      <Square className="w-3.5 h-3.5" />
                                    )}
                                    {child.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => selectedRole && handleSelectRole(selectedRole)}
                  className="btn-secondary"
                >
                  重置
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={cn(
                    'btn-primary flex items-center gap-2',
                    saving && 'opacity-70 cursor-not-allowed'
                  )}
                >
                  <Save className="w-4 h-4" />
                  {saving ? '保存中...' : '保存配置'}
                </button>
              </div>
            </>
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-slate-400">
              <Shield className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-base">请从左侧选择一个角色</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
