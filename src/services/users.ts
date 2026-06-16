import pb from '@/lib/pocketbase/client'
import { User } from '@/types'

export const getUsers = () =>
  pb.collection('users').getFullList<User>({ sort: '-created', expand: 'empresa_id,cliente_id' })
export const createUser = (data: any) => pb.collection('users').create<User>(data)
export const updateUser = (id: string, data: any) => pb.collection('users').update<User>(id, data)
export const deleteUser = (id: string) => pb.collection('users').delete(id)
