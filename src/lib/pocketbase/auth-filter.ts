import pb from '@/lib/pocketbase/client'

export function getEmpresaFilter(prefix = 'empresa_id') {
  if (!pb.authStore.isValid || !pb.authStore.record) return ''
  const user = pb.authStore.record

  if (user.tipo_role === 'admin') {
    return '' // Admin sees everything globally
  }

  if (user.empresa_id) {
    return `${prefix} = "${user.empresa_id}"`
  }

  if (user.tipo_role === 'tecnico' || user.tipo_role === 'cliente') {
    return `${prefix} != ""` // Provide a non-empty check if specific role logic dictates
  }

  return ''
}

export function withEmpresaId(data: Record<string, any>) {
  if (!pb.authStore.isValid || !pb.authStore.record) return data
  const user = pb.authStore.record

  if (user.tipo_role === 'admin') {
    return data
  }

  if (user.empresa_id && !data.empresa_id) {
    return { ...data, empresa_id: user.empresa_id }
  }

  return data
}
