import pb from '@/lib/pocketbase/client'
import { Customer } from '@/types'

export const getCustomers = async () => {
  return await pb.collection<Customer>('customers').getFullList({
    sort: 'name',
  })
}
