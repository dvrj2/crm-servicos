import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, ServiceOrder } from '@/types'
import { Card, CardContent } from '@/components/ui/card'

export function FiltersBar({ filters, setFilters, users, orders }: any) {
  const regions = Array.from(new Set(orders.map((o: ServiceOrder) => o.region).filter(Boolean)))
  const categories = Array.from(
    new Set(orders.map((o: ServiceOrder) => o.service_type).filter(Boolean)),
  )

  const update = (key: string, val: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: val === 'all' ? '' : val }))
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Período</label>
          <Select value={filters.period} onValueChange={(v) => update('period', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Técnico</label>
          <Select
            value={filters.technician || 'all'}
            onValueChange={(v) => update('technician', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Técnicos</SelectItem>
              {users.map((u: User) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Região</label>
          <Select value={filters.region || 'all'} onValueChange={(v) => update('region', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Regiões</SelectItem>
              {regions.map((r: any) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Categoria</label>
          <Select value={filters.category || 'all'} onValueChange={(v) => update('category', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              {categories.map((c: any) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Urgência</label>
          <Select value={filters.urgency || 'all'} onValueChange={(v) => update('urgency', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Cliente</label>
          <Select value={filters.customer || 'all'} onValueChange={(v) => update('customer', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Clientes</SelectItem>
              {Array.from(new Set(orders.map((o: ServiceOrder) => o.customer_name)))
                .slice(0, 50)
                .map((c: any) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
