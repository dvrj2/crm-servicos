import pb from '@/lib/pocketbase/client'
import { Empresario } from '@/types'

export async function getEmpresarios(): Promise<Empresario[]> {
  return pb.collection('empresarios').getFullList<Empresario>({
    sort: 'nome',
  })
}

export async function createEmpresario(
  data: FormData | Partial<Empresario>,
  senha?: string,
): Promise<Empresario> {
  const record = await pb.collection('empresarios').create<Empresario>(data)

  if (senha && data instanceof FormData) {
    const email = data.get('email') as string
    const nome = data.get('nome') as string
    if (email) {
      await pb.collection('users').create({
        email,
        name: nome,
        password: senha,
        passwordConfirm: senha,
        tipo_role: 'empresario',
        empresa_id: record.id,
        ativo: true,
      })
    }
  }

  return record
}

export async function updateEmpresario(
  id: string,
  data: FormData | Partial<Empresario>,
): Promise<Empresario> {
  return pb.collection('empresarios').update<Empresario>(id, data)
}

export async function deleteEmpresario(id: string): Promise<void> {
  return pb.collection('empresarios').delete(id)
}
