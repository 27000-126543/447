import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import EmptyState from './EmptyState'
import Pagination from './Pagination'

export interface Column<T> {
  key: string
  title: ReactNode
  dataIndex?: keyof T
  render?: (record: T, index: number) => ReactNode
  width?: string | number
  align?: 'left' | 'center' | 'right'
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  rowKey?: keyof T | ((record: T) => string)
  onRowClick?: (record: T, index: number) => void
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange?: (pageSize: number) => void
    pageSizeOptions?: number[]
  }
  emptyText?: string
  emptyDescription?: string
  emptyIcon?: ReactNode
  striped?: boolean
  hoverable?: boolean
  className?: string
}

function getRowKey<T>(record: T, index: number, rowKey?: DataTableProps<T>['rowKey']): string {
  if (!rowKey) return String(index)
  if (typeof rowKey === 'function') return rowKey(record)
  return String(record[rowKey])
}

export default function DataTable<T extends object>({
  columns,
  data,
  loading = false,
  rowKey,
  onRowClick,
  pagination,
  emptyText,
  emptyDescription,
  emptyIcon,
  striped = true,
  hoverable = true,
  className,
}: DataTableProps<T>) {
  const isEmpty = !loading && data.length === 0

  return (
    <div className={cn('glass-card overflow-hidden', className)}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className={cn('data-table', !hoverable && 'data-table-no-hover')}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.className
                  )}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((record, index) => (
              <tr
                key={getRowKey(record, index, rowKey)}
                onClick={() => onRowClick?.(record, index)}
                className={cn(
                  striped && index % 2 === 1 && 'bg-slate-900/30',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(record, index)
                      : col.dataIndex
                      ? (record[col.dataIndex] as ReactNode)
                      : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEmpty && (
        <EmptyState
          icon={emptyIcon}
          title={emptyText}
          description={emptyDescription}
        />
      )}

      {pagination && !isEmpty && (
        <div className="px-4 border-t border-slate-700/50">
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
            pageSizeOptions={pagination.pageSizeOptions}
          />
        </div>
      )}
    </div>
  )
}
