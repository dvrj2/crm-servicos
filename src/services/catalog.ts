import pb from '@/lib/pocketbase/client'
import { CompanyService, CompanyMaterial } from '@/types'
import { getEmpresaFilter } from '@/lib/pocketbase/auth-filter'

export async function getCompanyServices() {
  const filter = getEmpresaFilter()
  return pb.collection('company_services').getFullList<CompanyService>({
    filter,
    sort: 'name',
  })
}

export async function createCompanyService(data: Partial<CompanyService>) {
  return pb.collection('company_services').create<CompanyService>(data)
}

export async function updateCompanyService(id: string, data: Partial<CompanyService>) {
  return pb.collection('company_services').update<CompanyService>(id, data)
}

export async function deleteCompanyService(id: string) {
  return pb.collection('company_services').delete(id)
}

export async function getCompanyMaterials() {
  const filter = getEmpresaFilter()
  return pb.collection('company_materials').getFullList<CompanyMaterial>({
    filter,
    sort: 'name',
  })
}

export async function createCompanyMaterial(data: Partial<CompanyMaterial>) {
  return pb.collection('company_materials').create<CompanyMaterial>(data)
}

export async function updateCompanyMaterial(id: string, data: Partial<CompanyMaterial>) {
  return pb.collection('company_materials').update<CompanyMaterial>(id, data)
}

export async function deleteCompanyMaterial(id: string) {
  return pb.collection('company_materials').delete(id)
}
