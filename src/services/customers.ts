import pb from '@/lib/pocketbase/client'
import { Customer } from '@/types'

export const getCustomers = async () => {
  return await pb.collection<Customer>('customers').getFullList({
    sort: 'name',
  })
}

export const createCustomerWithUser = async (data: {
  nome: string
  email: string
  senha: string
  telefone: string
  cpf_cnpj: string
  endereco: string
  tipo_cliente: 'residencial' | 'comercial' | 'industrial'
}) => {
  // 1. Create Customer
  const customer = await pb.collection('customers').create({
    name: data.nome,
    email: data.email,
    cpf_cnpj: data.cpf_cnpj,
    phone: data.telefone,
    address: data.endereco,
    tipo_cliente: data.tipo_cliente,
  })

  // 2. Create User
  try {
    await pb.collection('users').create({
      email: data.email,
      password: data.senha,
      passwordConfirm: data.senha,
      name: data.nome,
      tipo_role: 'cliente',
      cliente_id: customer.id,
      emailVisibility: true,
    })
  } catch (error) {
    // rollback customer
    await pb
      .collection('customers')
      .delete(customer.id)
      .catch(() => {})
    throw error
  }

  return customer
}
