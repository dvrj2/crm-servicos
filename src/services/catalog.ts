import pb from '@/lib/pocketbase/client'
import { CompanyService, CompanyMaterial } from '@/types'
import { getEmpresaFilter, withEmpresaId } from '@/lib/pocketbase/auth-filter'

export const getCompanyServices = async () => {
  return pb
    .collection('company_services')
    .getFullList<CompanyService>({ filter: getEmpresaFilter() })
}
export const createCompanyService = async (data: Partial<CompanyService>) => {
  return pb.collection('company_services').create<CompanyService>(withEmpresaId(data))
}
export const updateCompanyService = async (id: string, data: Partial<CompanyService>) => {
  return pb.collection('company_services').update<CompanyService>(id, data)
}
export const deleteCompanyService = async (id: string) => {
  return pb.collection('company_services').delete(id)
}

export const getCompanyMaterials = async () => {
  return pb
    .collection('company_materials')
    .getFullList<CompanyMaterial>({ filter: getEmpresaFilter() })
}
export const createCompanyMaterial = async (data: Partial<CompanyMaterial>) => {
  return pb.collection('company_materials').create<CompanyMaterial>(withEmpresaId(data))
}
export const updateCompanyMaterial = async (id: string, data: Partial<CompanyMaterial>) => {
  return pb.collection('company_materials').update<CompanyMaterial>(id, data)
}
export const deleteCompanyMaterial = async (id: string) => {
  return pb.collection('company_materials').delete(id)
}
