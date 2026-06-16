import pb from '@/lib/pocketbase/client'
import type { SimulationLog } from '@/types'

export const getSimulationLogs = async () => {
  return pb.collection<SimulationLog>('simulation_logs').getFullList({
    sort: '-created',
  })
}
