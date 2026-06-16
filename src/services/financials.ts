import pb from '@/lib/pocketbase/client'
import { Financial } from '@/types'
import { getEmpresaFilter } from '@/lib/pocketbase/auth-filter'

export const getFinancials = async () => {
  return pb.collection('financials').getFullList<Financial>({
    filter: getEmpresaFilter(),
    expand: 'execution,service_order',
  })
}
