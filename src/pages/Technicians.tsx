import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Users, Mail, MapPin, Clock } from 'lucide-react'

export default function Technicians() {
  const [technicians, setTechnicians] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      try {
        const records = await pb.collection('users').getFullList({
          sort: 'name',
        })
        setTechnicians(records)
      } catch (err) {
        toast({ title: 'Erro', description: 'Erro ao carregar técnicos', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const getInitials = (name: string) => (name ? name.substring(0, 2).toUpperCase() : 'U')

  return (
    <div className="h-full flex flex-col space-y-6 overflow-auto pb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Técnicos
        </h2>
        <p className="text-sm text-slate-500">
          Gerencie a equipe técnica e verifique a capacidade diária.
        </p>
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
                <TableHead>Email</TableHead>
                <TableHead>Capacidade Diária</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technicians.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    Nenhum técnico encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                technicians.map((tech) => (
                  <TableRow key={tech.id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={tech.avatar ? pb.files.getURL(tech, tech.avatar) : undefined}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(tech.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{tech.name || 'Sem nome'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-3 w-3" />
                        {tech.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="h-3 w-3" />
                        {tech.capacity_diaria_hours || 8} horas
                      </div>
                    </TableCell>
                    <TableCell>
                      {tech.current_lat && tech.current_lng ? (
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="h-3 w-3 text-blue-500" />
                          Rastreado
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">Desconhecida</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Ativo
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
