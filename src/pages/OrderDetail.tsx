import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  ArrowLeft,
  MapPin,
  User,
  Phone,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  FileText,
  UserCircle,
  History,
  Package,
} from 'lucide-react'
import ChannelBadge from '@/components/ChannelBadge'
import StatusBadge from '@/components/StatusBadge'
import LoadingSpinner from '@/components/LoadingSpinner'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, maskPhone } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus } from '@shared/types'

const ORDER_STEPS: { status: OrderStatus; label: string; Icon: typeof CreditCard }[] = [
  { status: 'pending', label: '待支付', Icon: CreditCard },
  { status: 'paid', label: '已支付', Icon: CheckCircle2 },
  { status: 'shipped', label: '已发货', Icon: Truck },
  { status: 'completed', label: '已完成', Icon: Package },
]

function getStepIndex(status: OrderStatus): number {
  const index = ORDER_STEPS.findIndex((s) => s.status === status)
  if (index === -1) {
    if (status === 'refunded' || status === 'cancelled') return 0
  }
  return index
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return
      try {
        const res = await api.get<Order>(`/orders/${id}`)
        setOrder(res.data)
      } catch (error) {
        console.error('Failed to fetch order:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  if (loading || !order) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const currentStepIndex = getStepIndex(order.status)
  const itemsTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingFee = itemsTotal > 500 ? 0 : 15
  const discount = Math.round(itemsTotal * 0.05 * 100) / 100
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0)

  const timelineEvents = [
    { time: order.createdAt, text: '订单创建', Icon: FileText, done: true },
    ...(order.paidAt ? [{ time: order.paidAt, text: '支付成功', Icon: CreditCard, done: true }] : []),
    ...(order.shippedAt ? [{ time: order.shippedAt, text: '商品已发货', Icon: Truck, done: true }] : []),
    ...(order.status === 'completed' ? [{ time: order.createdAt, text: '订单已完成', Icon: CheckCircle2, done: true }] : []),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回订单列表
        </button>
        <ChevronRight className="w-4 h-4 text-slate-600" />
        <span className="text-slate-400">订单管理</span>
        <ChevronRight className="w-4 h-4 text-slate-600" />
        <span className="text-white font-medium">订单详情</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-display font-bold text-white">订单 {order.orderNo}</h1>
            <StatusBadge status={order.status} type="order" />
            <ChannelBadge channel={order.channel} />
          </div>
          <p className="text-sm text-slate-400">下单时间：{formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-white mb-5">订单状态</h3>
            <div className="relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-700 mx-12">
                <div
                  className="h-full bg-gradient-to-r from-accent-500 to-accent-400 transition-all duration-500"
                  style={{
                    width: `${currentStepIndex >= 0 ? (currentStepIndex / (ORDER_STEPS.length - 1)) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="relative flex justify-between">
                {ORDER_STEPS.map((step, index) => {
                  const isActive = index <= currentStepIndex
                  const isCurrent = index === currentStepIndex
                  const { Icon } = step
                  return (
                    <div key={step.status} className="flex flex-col items-center z-10">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                          isActive
                            ? 'bg-accent-500 text-white shadow-glow-accent'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={cn(
                          'mt-2 text-xs font-medium',
                          isCurrent ? 'text-accent-400' : isActive ? 'text-white' : 'text-slate-500'
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-accent-400" />
              <h3 className="text-base font-semibold text-white">收货地址</h3>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-500/15 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-accent-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-white font-medium">{order.userName}</span>
                  <span className="text-slate-400 text-sm">{maskPhone(order.userPhone)}</span>
                </div>
                <p className="text-slate-300 text-sm">{order.address}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="badge bg-slate-700/50 text-slate-400 border border-slate-600/50">
                    {order.region}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-accent-400" />
                <h3 className="text-base font-semibold text-white">商品清单</h3>
                <span className="text-xs text-slate-400 ml-2">共 {totalQuantity} 件商品</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="pl-5">商品信息</th>
                    <th className="text-center">单价</th>
                    <th className="text-center">数量</th>
                    <th className="text-right pr-5">小计</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={`${item.skuId}-${index}`}>
                      <td className="pl-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.skuName}
                            className="w-14 h-14 rounded-lg object-cover bg-slate-800"
                          />
                          <div>
                            <div className="text-white font-medium">{item.skuName}</div>
                            <div className="text-xs text-slate-500 mt-0.5">SKU: {item.skuId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center text-slate-300">{formatCurrency(item.price)}</td>
                      <td className="text-center text-slate-300">x{item.quantity}</td>
                      <td className="text-right pr-5 text-white font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-white mb-4">费用明细</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">商品总额</span>
                <span className="text-slate-200">{formatCurrency(itemsTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">运费</span>
                <span className="text-slate-200">
                  {shippingFee === 0 ? <span className="text-emerald-400">免运费</span> : formatCurrency(shippingFee)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">优惠</span>
                <span className="text-rose-400">-{formatCurrency(discount)}</span>
              </div>
              <div className="h-px bg-slate-700/50 my-2" />
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">实付金额</span>
                <span className="text-2xl font-display font-bold text-accent-400">
                  {formatCurrency(order.amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-accent-400" />
              <h3 className="text-base font-semibold text-white">订单信息</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">订单号</span>
                <span className="text-white font-mono">{order.orderNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">订单渠道</span>
                <ChannelBadge channel={order.channel} showIcon={false} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">订单状态</span>
                <StatusBadge status={order.status} type="order" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">下单时间</span>
                <span className="text-slate-200 text-xs">{formatDate(order.createdAt)}</span>
              </div>
              {order.paidAt && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">支付时间</span>
                  <span className="text-slate-200 text-xs">{formatDate(order.paidAt)}</span>
                </div>
              )}
              {order.shippedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">发货时间</span>
                  <span className="text-slate-200 text-xs">{formatDate(order.shippedAt)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserCircle className="w-4 h-4 text-accent-400" />
              <h3 className="text-base font-semibold text-white">用户信息</h3>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {order.userName.charAt(0)}
                </span>
              </div>
              <div>
                <div className="text-white font-medium">{order.userName}</div>
                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />
                  {maskPhone(order.userPhone)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/50">
              <div className="text-center">
                <div className="text-xl font-display font-bold text-white">12</div>
                <div className="text-xs text-slate-400 mt-0.5">历史订单</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-display font-bold text-accent-400">VIP2</div>
                <div className="text-xs text-slate-400 mt-0.5">会员等级</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-accent-400" />
              <h3 className="text-base font-semibold text-white">操作记录</h3>
            </div>
            <div className="space-y-4">
              {timelineEvents.map((event, index) => {
                const { Icon } = event
                const isLast = index === timelineEvents.length - 1
                return (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-emerald-400" />
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-slate-700/50 mt-2" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="text-sm text-white font-medium">{event.text}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(event.time)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
