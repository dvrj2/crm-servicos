import pb from '@/lib/pocketbase/client'
import type { Tecnico } from '@/types'

export const getTecnicos = () => pb.collection<Tecnico>('tecnicos').getFullList({ sort: 'nome' })
export const getTecnico = (id: string) => pb.collection<Tecnico>('tecnicos').getOne(id)
export const createTecnico = (data: Partial<Tecnico>) =>
  pb.collection<Tecnico>('tecnicos').create(data)
export const updateTecnico = (id: string, data: Partial<Tecnico>) =>
  pb.collection<Tecnico>('tecnicos').update(id, data)
export const deleteTecnico = (id: string) => pb.collection<Tecnico>('tecnicos').delete(id)
