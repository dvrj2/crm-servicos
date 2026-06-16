import { useEffect, useState } from 'react'
import { Plus, Users, Mail, MapPin, Clock, Edit, Trash, Phone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useRealtime } from '@/hooks/use-realtime'
import { TecnicoForm } from '@/components/tecnicos/TecnicoForm'
import { getTecnicos, createTecnico, updateTecnico, deleteTecnico } from '@/services/tecnicos'
import type { Tecnico } from '@/types'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function Technicians() {
  const [technicians, setTechnicians] = useState<Tecnico[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTech, setEditingTech] = useState<Tecnico | null>(null)

  const loadData = async () => {
    try {
      const records = await getTecnicos()
      setTechnicians(records)
    } catch (err) {
      toast.error('Erro ao carregar técnicos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('tecnicos', () => {
    loadData()
  })

  const handleOpenCreate = () => {
    setEditingTech(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (tech: Tecnico) => {
    setEditingTech(tech)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este técnico?')) return
    try {
      await deleteTecnico(id)
      toast.success('Técnico excluído com sucesso')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleSubmit = async (data: Partial<Tecnico>) => {
    try {
      if (editingTech) {
        await updateTecnico(editingTech.id, data)
        toast.success('Técnico atualizado com sucesso')
      } else {
        await createTecnico(data)
        toast.success('Técnico criado com sucesso')
      }
      setIsModalOpen(false)
    } catch (err) {
      toast.error('Erro ao salvar técnico', { description: getErrorMessage(err) })
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const getInitials = (name: string) => (name ? name.substring(0, 2).toUpperCase() : 'TC')

  return (
    <div className="h-full flex flex-col space-y-6 overflow-auto pb-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Técnicos
          </h2>
          <p className="text-sm text-slate-500">
            Gerencie a equipe técnica e verifique a capacidade diária.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Novo Técnico
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipe Operacional</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Técnico</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Capac. (Uso/Total)</TableHead>
                <TableHead>Região</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technicians.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    Nenhum técnico encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                technicians.map((tech) => (
                  <TableRow key={tech.id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(tech.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium block">{tech.nome}</span>
                        <span className="text-xs text-slate-500">{tech.cpf}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm text-slate-600 gap-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" /> {tech.email}
                        </div>
                        {tech.telefone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" /> {tech.telefone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="h-3 w-3" />
                        {tech.ocupacao_atual_horas || 0} / {tech.capacidade_diaria_hours || 8} h
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="h-3 w-3 text-blue-500" />
                        {tech.regiao || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {tech.status || 'disponível'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(tech)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => handleDelete(tech.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTech ? 'Editar Técnico' : 'Novo Técnico'}</DialogTitle>
          </DialogHeader>
          <TecnicoForm
            initialData={editingTech}
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
