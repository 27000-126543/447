import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children?: ReactNode
  footer?: ReactNode
  closeOnOverlay?: boolean
  closeOnEsc?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  closeOnOverlay = true,
  closeOnEsc = true,
  size = 'md',
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open || !closeOnEsc) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, closeOnEsc, onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => closeOnOverlay && onClose()}
      />
      <div
        className={cn(
          'relative w-full glass-card animate-slide-up overflow-hidden',
          sizeMap[size],
          className
        )}
      >
        {(title || onClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
            {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
