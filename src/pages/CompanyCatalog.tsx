import { useEffect, useState } from 'react'
import {
  getCompanyServices,
  getCompanyMaterials,
  createCompanyService,
  createCompanyMaterial,
} from '@/services/catalog'
import { CompanyService, CompanyMaterial } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Package, Wrench, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function CompanyCatalog() {
  const [services, setServices] = useState<CompanyService[]>([])
  const [materials, setMaterials] = useState<CompanyMaterial[]>([])

  const [newService, setNewService] = useState({ name: '', description: '', base_price: 0 })
  const [newMaterial, setNewMaterial] = useState({ name: '', unit_cost: 0, stock_quantity: 0 })

  const [openS, setOpenS] = useState(false)
  const [openM, setOpenM] = useState(false)

  const loadData = () => {
    getCompanyServices().then(setServices)
    getCompanyMaterials().then(setMaterials)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddService = async () => {
    if (!newService.name) return toast.error('Nome é obrigatório')
    try {
      await createCompanyService(newService)
      toast.success('Serviço adicionado')
      setOpenS(false)
      loadData()
    } catch (e) {
      toast.error('Erro ao adicionar')
    }
  }

  const handleAddMaterial = async () => {
    if (!newMaterial.name) return toast.error('Nome é obrigatório')
    try {
      await createCompanyMaterial(newMaterial)
      toast.success('Material adicionado')
      setOpenM(false)
      loadData()
    } catch (e) {
      toast.error('Erro ao adicionar')
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Catálogo de Serviços e Materiais</h1>
        <p className="text-muted-foreground">Gerencie o que sua empresa oferece.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" /> Serviços
            </CardTitle>
            <Dialog open={openS} onOpenChange={setOpenS}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Novo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Serviço</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={newService.name}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input
                      value={newService.description}
                      onChange={(e) =>
                        setNewService({ ...newService, description: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Preço Base (R$)</Label>
                    <Input
                      type="number"
                      value={newService.base_price}
                      onChange={(e) =>
                        setNewService({ ...newService, base_price: Number(e.target.value) })
                      }
                    />
                  </div>
                  <Button onClick={handleAddService}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço Base</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>R$ {s.base_price?.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {services.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4">
                      Nenhum serviço
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> Materiais
            </CardTitle>
            <Dialog open={openM} onOpenChange={setOpenM}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Novo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Material</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={newMaterial.name}
                      onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Custo Unitário (R$)</Label>
                    <Input
                      type="number"
                      value={newMaterial.unit_cost}
                      onChange={(e) =>
                        setNewMaterial({ ...newMaterial, unit_cost: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label>Estoque</Label>
                    <Input
                      type="number"
                      value={newMaterial.stock_quantity}
                      onChange={(e) =>
                        setNewMaterial({ ...newMaterial, stock_quantity: Number(e.target.value) })
                      }
                    />
                  </div>
                  <Button onClick={handleAddMaterial}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Estoque</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>R$ {m.unit_cost?.toFixed(2)}</TableCell>
                    <TableCell>{m.stock_quantity}</TableCell>
                  </TableRow>
                ))}
                {materials.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      Nenhum material
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
