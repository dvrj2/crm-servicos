import { User } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  techs: User[]
  selectedTechId: string
  setSelectedTechId: (v: string) => void
  minCapacity: number
  setMinCapacity: (v: number) => void
  regionFilter: string
  setRegionFilter: (v: string) => void
  urgencyFilter: string
  setUrgencyFilter: (v: string) => void
  serviceTypeFilter: string
  setServiceTypeFilter: (v: string) => void
}

export function ScheduleFilters({
  techs,
  selectedTechId,
  setSelectedTechId,
  minCapacity,
  setMinCapacity,
  regionFilter,
  setRegionFilter,
  urgencyFilter,
  setUrgencyFilter,
  serviceTypeFilter,
  setServiceTypeFilter,
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
      <div className="space-y-1.5">
        <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Técnico
        </Label>
        <Select value={selectedTechId} onValueChange={setSelectedTechId}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos</SelectItem>
            {techs.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Região
        </Label>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todas</SelectItem>
            <SelectItem value="norte">Norte</SelectItem>
            <SelectItem value="sul">Sul</SelectItem>
            <SelectItem value="leste">Leste</SelectItem>
            <SelectItem value="oeste">Oeste</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Capacidade Livre (h)
        </Label>
        <Input
          type="number"
          min="0"
          max="24"
          className="h-9"
          value={minCapacity || ''}
          onChange={(e) => setMinCapacity(parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Urgência
        </Label>
        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todas</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Serviço
        </Label>
        <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos</SelectItem>
            <SelectItem value="Instalação">Instalação</SelectItem>
            <SelectItem value="Manutenção">Manutenção</SelectItem>
            <SelectItem value="Reparo">Reparo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
