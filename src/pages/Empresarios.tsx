import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  getEmpresarios,
  createEmpresario,
  updateEmpresario,
  deleteEmpresario,
} from '@/services/empresarios'
import { useRealtime } from '@/hooks/use-realtime'
import type { Empresario } from '@/types'
import { EmpresarioForm } from '@/components/empresarios/EmpresarioForm'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'

export default function EmpresariosPage() {
  const [empresarios, setEmpresarios] = useState<Empresario[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selected, setSelected] = useState<Empresario | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const data = await getEmpresarios()
      setEmpresarios(data)
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('empresarios', loadData)

  const handleOpen = (e?: Empresario) => {
    setSelected(e || null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este empresário?')) return
    try {
      await deleteEmpresario(id)
      toast({ title: 'Sucesso', description: 'Empresário excluído.' })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      if (selected) {
        data.delete('senha')
        await updateEmpresario(selected.id, data)
      } else {
        const senha = data.get('senha') as string
        data.delete('senha')
        await createEmpresario(data, senha)
      }
      setIsModalOpen(false)
      toast({ title: 'Sucesso', description: 'Empresário salvo com sucesso.' })
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDocUrl = (e: Empresario) => pb.files.getURL(e, e.documento_identificacao!)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Empresários</h1>
        <Button onClick={() => handleOpen()}>
          <Plus className="w-4 h-4 mr-2" /> Novo Empresário
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>Área de Atuação</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead className="w-[150px]">Documentos</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empresarios.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.nome}</TableCell>
                <TableCell>{e.cpf_cnpj}</TableCell>
                <TableCell>{e.area_de_atuacao || '-'}</TableCell>
                <TableCell>
                  {e.email}
                  <br />
                  <span className="text-xs text-muted-foreground">{e.telefone}</span>
                </TableCell>
                <TableCell>
                  {e.documento_identificacao ? (
                    <a
                      href={getDocUrl(e)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center text-sm text-blue-600 hover:underline"
                    >
                      <FileText className="w-4 h-4 mr-1" /> Ver Documento
                    </a>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpen(e)}>
                    <Pencil className="w-4 h-4 text-slate-600" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {empresarios.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum empresário cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected ? 'Editar Empresário' : 'Novo Empresário'}</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para {selected ? 'atualizar o' : 'cadastrar um novo'}{' '}
              empresário.
            </DialogDescription>
          </DialogHeader>
          <EmpresarioForm
            initialData={selected}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
