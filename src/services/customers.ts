import pb from '@/lib/pocketbase/client'
import { Customer } from '@/types'
import { getEmpresaFilter, withEmpresaId } from '@/lib/pocketbase/auth-filter'

export const getCustomers = async () => {
  return pb.collection('customers').getFullList<Customer>({
    filter: getEmpresaFilter(),
  })
}

export const createCustomerWithUser = async (data: Partial<Customer>) => {
  const customer = await pb.collection('customers').create<Customer>(withEmpresaId(data))
  return customer
}

export const createCustomer = async (data: Partial<Customer>) => {
  return pb.collection('customers').create<Customer>(withEmpresaId(data))
}
