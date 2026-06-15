import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Modal from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'success'
  confirmLoading?: boolean
}

const iconMap = {
  danger: { Icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/20' },
  warning: { Icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  info: { Icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  success: { Icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = '确认操作',
  message = '确定要执行此操作吗？',
  confirmText = '确定',
  cancelText = '取消',
  type = 'warning',
  confirmLoading = false,
}: ConfirmDialogProps) {
  const { Icon, color, bg } = iconMap[type]

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmLoading}
            className={cn(
              'font-medium px-4 py-2 rounded-lg transition-all duration-200 active:scale-[0.98]',
              type === 'danger'
                ? 'bg-rose-500 hover:bg-rose-600 text-white hover:shadow-[0_0_20px_rgba(244,63,94,0.35)]'
                : 'btn-primary',
              confirmLoading && 'opacity-70 cursor-not-allowed'
            )}
          >
            {confirmLoading ? '处理中...' : confirmText}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0', bg)}>
          <Icon className={cn('w-6 h-6', color)} />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-semibold text-white mb-1.5">{title}</h4>
          <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  )
}
