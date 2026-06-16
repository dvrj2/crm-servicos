import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { SimulationLog } from '@/types'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function SimulationLogs() {
  const [logs, setLogs] = useState<SimulationLog[]>([])

  const loadData = async () => {
    try {
      const data = await pb
        .collection('simulation_logs')
        .getFullList<SimulationLog>({ sort: '-created' })
      setLogs(data)
    } catch (e) {
      console.error('Failed to load logs', e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('simulation_logs', loadData)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sandbox Logs</h1>

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Fonte</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px] text-right">Conteúdo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{format(new Date(log.created), 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                <TableCell className="font-medium">{log.action_type}</TableCell>
                <TableCell>{log.event_source}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {log.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Ver JSON
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                      <DialogHeader>
                        <DialogTitle>Conteúdo do Evento</DialogTitle>
                      </DialogHeader>
                      <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-sm overflow-auto">
                        {JSON.stringify(log.content, null, 2)}
                      </pre>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum log encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
