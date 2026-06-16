import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/ui/skeleton'

export default function SecuritySettings() {
  const [loading, setLoading] = useState(true)
  const [lockId, setLockId] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const records = await pb
          .collection('system_settings')
          .getFullList({ filter: 'key="bloqueio_total"' })
        if (records.length > 0) {
          setLockId(records[0].id)
          setIsLocked(records[0].value?.enabled === true || records[0].value === true)
        } else {
          const newRecord = await pb.collection('system_settings').create({
            key: 'bloqueio_total',
            value: { enabled: true },
          })
          setLockId(newRecord.id)
          setIsLocked(true)
        }
      } catch (e) {
        toast({ title: 'Erro ao carregar configurações', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleToggle = async (checked: boolean) => {
    setIsLocked(checked)
    try {
      if (lockId) {
        await pb.collection('system_settings').update(lockId, {
          value: { enabled: checked },
        })
      }
      toast({
        title: 'Configuração atualizada',
        description: `Bloqueio Total de Créditos ${checked ? 'ativado' : 'desativado'}.`,
      })
    } catch (e) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
      setIsLocked(!checked)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações de Segurança</h1>
        <p className="text-muted-foreground">Gerencie bloqueios e simulações do sistema.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bloqueio Total de Créditos</CardTitle>
          <CardDescription>
            Quando ativado, todas as integrações externas (WhatsApp, Emails, Pagamentos reais,
            IA/Geolocalização) são bloqueadas e substituídas por simulações internas para evitar
            custos e ações indesejadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 border p-4 rounded-lg bg-slate-50/50">
            <Switch id="bloqueio-total" checked={isLocked} onCheckedChange={handleToggle} />
            <Label htmlFor="bloqueio-total" className="flex flex-col gap-1 cursor-pointer">
              <span className="font-semibold text-slate-900">Ativar Bloqueio Total</span>
              <span className="text-sm text-slate-500 font-normal">
                Previne chamadas de API externas e gera logs de simulação.
              </span>
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
