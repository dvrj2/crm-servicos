import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

export function KPI({
  title,
  value,
  description,
  icon,
  alert,
}: {
  title: string
  value: string
  description?: string
  icon?: ReactNode
  alert?: boolean
}) {
  return (
    <Card className={cn('shadow-sm', { 'border-red-500 bg-red-50': alert })}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <div className={cn('h-4 w-4 text-muted-foreground', { 'text-red-500': alert })}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold', { 'text-red-700': alert })}>{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}
