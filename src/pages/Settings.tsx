import { useEffect, useState } from 'react'
import { getSettings, saveSetting } from '@/services/system_settings'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const AVAILABLE_FEATURES = [
  { id: 'dashboard', label: 'Dashboard Kanban' },
  { id: 'finance', label: 'Financeiro' },
  { id: 'users', label: 'Gestão de Usuários' },
  { id: 'settings', label: 'Configurações do Sistema' },
  { id: 'reports', label: 'Relatórios' },
  { id: 'empresarios', label: 'Empresários' },
  { id: 'technicians', label: 'Técnicos' },
  { id: 'schedule', label: 'Agenda' },
  { id: 'execution', label: 'Execução de OS' },
  { id: 'portal', label: 'Portal do Cliente' },
]

const ROLES = ['admin', 'empresario', 'tecnico', 'cliente']

export default function Settings() {
  const [rawJson, setRawJson] = useState('{}')
  const [rbac, setRbac] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    getSettings().then((data) => {
      const customSetting = data.find((s) => s.key === 'custom_settings')
      if (customSetting) setRawJson(JSON.stringify(customSetting.value, null, 2))

      const rbacSetting = data.find((s) => s.key === 'rbac_config')
      if (rbacSetting) {
        setRbac(rbacSetting.value)
      } else {
        setRbac({ admin: [], empresario: [], tecnico: [], cliente: [] })
      }
    })
  }, [])

  const handleSaveJson = async () => {
    setIsLoading(true)
    try {
      const parsed = JSON.parse(rawJson)
      await saveSetting('custom_settings', parsed)
      toast.success('Configurações salvas')
    } catch {
      toast.error('JSON Inválido')
    }
    setIsLoading(false)
  }

  const handleToggleFeature = async (role: string, featureId: string, checked: boolean) => {
    const currentFeatures = rbac[role] || []
    const newFeatures = checked
      ? [...currentFeatures, featureId]
      : currentFeatures.filter((f) => f !== featureId)

    const newRbac = { ...rbac, [role]: newFeatures }
    setRbac(newRbac)

    try {
      await saveSetting('rbac_config', newRbac)
      toast.success('Permissão atualizada')
    } catch {
      toast.error('Erro ao salvar permissão')
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Configurações do Sistema</h1>
      <Tabs defaultValue="rbac">
        <TabsList>
          <TabsTrigger value="rbac">Controle de Acesso (RBAC)</TabsTrigger>
          <TabsTrigger value="json">Configurações Avançadas</TabsTrigger>
        </TabsList>
        <TabsContent value="rbac" className="space-y-4 mt-4">
          {ROLES.map((role) => (
            <Card key={role}>
              <CardHeader>
                <CardTitle className="capitalize">{role}</CardTitle>
                <CardDescription>
                  Gerencie as funcionalidades acessíveis para o perfil {role}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {AVAILABLE_FEATURES.map((feat) => {
                    const hasAccess = (rbac[role] || []).includes(feat.id)
                    return (
                      <div key={feat.id} className="flex items-center space-x-2">
                        <Switch
                          id={`${role}-${feat.id}`}
                          checked={hasAccess}
                          onCheckedChange={(c) => handleToggleFeature(role, feat.id, c)}
                        />
                        <Label htmlFor={`${role}-${feat.id}`}>{feat.label}</Label>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="json" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>JSON Global</CardTitle>
              <CardDescription>
                Edite propriedades genéricas do sistema em formato JSON.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                rows={15}
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                className="font-mono"
              />
              <Button onClick={handleSaveJson} disabled={isLoading}>
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
