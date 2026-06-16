import pb from '@/lib/pocketbase/client'
import { Financial } from '@/types'
import { getEmpresaFilter } from '@/lib/pocketbase/auth-filter'

export async function getFinancials(): Promise<Financial[]> {
  const filter = getEmpresaFilter()
  return pb.collection('financials').getFullList<Financial>({
    filter,
    sort: '-created',
  })
}
