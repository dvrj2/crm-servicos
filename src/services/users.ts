import pb from '@/lib/pocketbase/client'
import { User } from '@/types'
import { getEmpresaFilter } from '@/lib/pocketbase/auth-filter'

export async function getUsers(): Promise<User[]> {
  const filter = getEmpresaFilter()
  return pb.collection('users').getFullList<User>({
    filter,
    sort: 'name',
  })
}

export async function createUser(data: Partial<User>) {
  return pb.collection('users').create<User>(data)
}

export async function updateUser(id: string, data: Partial<User>) {
  return pb.collection('users').update<User>(id, data)
}

export async function deleteUser(id: string) {
  return pb.collection('users').delete(id)
}
