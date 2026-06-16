import pb from '@/lib/pocketbase/client'
import { Financial } from '@/types'

export const getFinancials = () =>
  pb
    .collection('financials')
    .getFullList<Financial>({ sort: '-created', expand: 'execution,service_order' })
