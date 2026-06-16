import pb from '@/lib/pocketbase/client'

export function getEmpresaFilter(additionalFilter: string = ''): string {
  const user = pb.authStore.record
  if (user?.tipo_role === 'empresario' && user.empresa_id) {
    const base = `empresa_id = "${user.empresa_id}"`
    return additionalFilter ? `(${additionalFilter}) && ${base}` : base
  }
  return additionalFilter
}

export function withEmpresaId<T extends Record<string, any>>(data: T): T {
  const user = pb.authStore.record
  if (user?.tipo_role === 'empresario' && user.empresa_id) {
    return { ...data, empresa_id: user.empresa_id }
  }
  return data
}
