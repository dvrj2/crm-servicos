import pb from '@/lib/pocketbase/client'
import type { Empresario } from '@/types'

export const getEmpresarios = () =>
  pb.collection<Empresario>('empresarios').getFullList({ sort: '-created' })
export const createEmpresario = async (data: FormData, senha?: string) => {
  const empresario = await pb.collection<Empresario>('empresarios').create(data)

  if (senha) {
    try {
      await pb.collection('users').create({
        name: empresario.nome,
        email: empresario.email,
        password: senha,
        passwordConfirm: senha,
        tipo_role: 'empresario',
        ativo: true,
        empresa_id: empresario.id,
      })
    } catch (error) {
      await pb.collection('empresarios').delete(empresario.id)
      throw error
    }
  }

  return empresario
}
export const updateEmpresario = (id: string, data: FormData) =>
  pb.collection<Empresario>('empresarios').update(id, data)
export const deleteEmpresario = (id: string) => pb.collection<Empresario>('empresarios').delete(id)
