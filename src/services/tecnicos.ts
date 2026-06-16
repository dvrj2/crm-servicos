import pb from '@/lib/pocketbase/client'
import { Tecnico } from '@/types'
import { getEmpresaFilter, withEmpresaId } from '@/lib/pocketbase/auth-filter'

export const getTecnicos = async () => {
  return pb.collection('tecnicos').getFullList<Tecnico>({
    filter: getEmpresaFilter(),
  })
}

export const getTecnico = async (id: string) => {
  return pb.collection('tecnicos').getOne<Tecnico>(id)
}

export const createTecnico = async (data: Partial<Tecnico>) => {
  return pb.collection('tecnicos').create<Tecnico>(withEmpresaId(data))
}

export const updateTecnico = async (id: string, data: Partial<Tecnico>) => {
  return pb.collection('tecnicos').update<Tecnico>(id, data)
}

export const deleteTecnico = async (id: string) => {
  return pb.collection('tecnicos').delete(id)
}
