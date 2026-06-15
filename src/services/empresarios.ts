import pb from '@/lib/pocketbase/client'
import type { Empresario } from '@/types'

export const getEmpresarios = () =>
  pb.collection<Empresario>('empresarios').getFullList({ sort: '-created' })
export const createEmpresario = (data: FormData) =>
  pb.collection<Empresario>('empresarios').create(data)
export const updateEmpresario = (id: string, data: FormData) =>
  pb.collection<Empresario>('empresarios').update(id, data)
export const deleteEmpresario = (id: string) => pb.collection<Empresario>('empresarios').delete(id)
