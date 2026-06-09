import pb from '@/lib/pocketbase/client'
import { ServiceOrder } from '@/types'

export const createSimulatedLog = async (
  osId: string,
  action: string,
  result: string,
  details: any = {},
) => {
  return await pb.collection('automation_logs').create({
    webhook_type: 'simulator',
    service_order: osId,
    action_taken: action,
    result: result,
    details: details,
  })
}

export const createSimulatedOS = async (text: string): Promise<ServiceOrder> => {
  const os = await pb.collection('service_orders').create({
    customer_name: 'Cliente Simulação',
    service_type: 'Manutenção',
    urgency: 'média',
    sla_deadline: new Date(Date.now() + 86400000).toISOString(),
    status: 'novo',
    payment_status: 'pendente',
    description: text,
    origin: 'whatsapp',
  })

  await createSimulatedLog(os.id, 'Recebimento de Mensagem (WhatsApp)', 'Sucesso', { texto: text })
  return os as ServiceOrder
}

export const uploadInitialPhotos = async (osId: string, files: File[]) => {
  for (const file of files) {
    const formData = new FormData()
    formData.append('service_order', osId)
    formData.append('file', file)
    formData.append('stage', 'before')
    await pb.collection('service_order_photos').create(formData)
  }
  await createSimulatedLog(osId, 'Upload de Fotos Iniciais', 'Sucesso', { count: files.length })
}

export const simulateQuoteApproval = async (osId: string) => {
  const os = await pb.collection('service_orders').update(osId, { status: 'aprovado' })

  const quote = await pb.collection('quotes').create({
    service_order: osId,
    estimated_cost: 150,
    status: 'aprovado',
  })

  const techs = await pb.collection('users').getList(1, 1)
  const techId = techs.items[0]?.id

  const apptData: any = {
    quote: quote.id,
    start_time: new Date().toISOString(),
    operation_status: 'pendente',
  }
  if (techId) apptData.technician = techId

  await pb.collection('appointments').create(apptData)

  await createSimulatedLog(osId, 'Aprovação de Orçamento (Cliente respondeu SIM)', 'Sucesso', {
    status_atualizado: 'aprovado',
  })
  return os
}

export const updateOperationalStatus = async (
  osId: string,
  status: string,
  appointmentStatus: string,
) => {
  const os = await pb.collection('service_orders').update(osId, { operational_status: status })

  try {
    const quote = await pb.collection('quotes').getFirstListItem(`service_order = "${osId}"`)
    const appt = await pb.collection('appointments').getFirstListItem(`quote = "${quote.id}"`)
    await pb.collection('appointments').update(appt.id, { operation_status: appointmentStatus })
  } catch (e) {
    // ignore missing appointment
  }

  await createSimulatedLog(osId, `Atualização de Status Operacional: ${status}`, 'Sucesso')
  return os
}

export const simulateChecklist = async (osId: string) => {
  const items = ['Verificar equipamento', 'Limpeza da área', 'Testes de funcionamento']
  for (const task of items) {
    await pb.collection('service_order_checklist_items').create({
      service_order: osId,
      task_description: task,
      is_completed: true,
    })
  }
  await createSimulatedLog(osId, 'Preenchimento de Checklist', 'Sucesso', { itens_concluidos: 3 })
}

export const uploadExecutionPhotos = async (osId: string, files: File[]) => {
  for (const file of files) {
    const formData = new FormData()
    formData.append('service_order', osId)
    formData.append('file', file)
    formData.append('stage', 'after')
    await pb.collection('service_order_photos').create(formData)
  }
  await createSimulatedLog(osId, 'Upload de Fotos da Execução (After)', 'Sucesso', {
    count: files.length,
  })
}

export const finalizeSimulation = async (osId: string) => {
  const os = await pb.collection('service_orders').update(osId, {
    operational_status: 'completed',
    technical_report:
      'Relatório Técnico Gerado Automaticamente.\n\nServiço realizado com sucesso. Equipamento testado e validado. Foram substituídas as peças defeituosas e realizada limpeza da área.',
    final_value: 150,
    payment_link: 'https://pay.stripe.com/test_link_123',
  })

  let execId = ''
  try {
    const quote = await pb.collection('quotes').getFirstListItem(`service_order = "${osId}"`)
    const appt = await pb.collection('appointments').getFirstListItem(`quote = "${quote.id}"`)

    const execData = new FormData()
    execData.append('appointment', appt.id)
    execData.append('technical_report', os.technical_report || '')
    execData.append(
      'signature',
      new File(['dummy signature'], 'signature.png', { type: 'image/png' }),
    )

    const exec = await pb.collection('executions').create(execData)
    execId = exec.id
  } catch (e) {
    // fallback if no appt
  }

  const financialData: any = {
    service_order: osId,
    final_value: 150,
    payment_status: 'pendente',
  }
  if (execId) financialData.execution = execId
  await pb.collection('financials').create(financialData)

  await createSimulatedLog(osId, 'Finalização e Geração de Relatório', 'Sucesso', {
    report_generated: true,
    financial_created: true,
  })
  return os
}

export const confirmPayment = async (osId: string) => {
  try {
    const fin = await pb.collection('financials').getFirstListItem(`service_order = "${osId}"`)
    await pb.collection('financials').update(fin.id, { payment_status: 'pago' })
  } catch (e) {
    // ignore
  }

  const os = await pb.collection('service_orders').update(osId, {
    status: 'concluído',
    payment_status: 'pago',
  })
  await createSimulatedLog(osId, 'Confirmação de Pagamento (Webhook)', 'Sucesso', {
    status_os: 'concluído',
  })
  return os
}

export const simulateBulkAssignment = async () => {
  let techs = await pb.collection('users').getFullList()

  const capacities = [8, 6, 4]
  const locations = [
    { lat: -23.5505, lng: -46.6333 }, // Centro
    { lat: -23.6, lng: -46.65 }, // Sul
    { lat: -23.5, lng: -46.6 }, // Norte
  ]

  // Update existing users where permitted (usually just the logged-in user due to API rules)
  for (let i = 0; i < techs.length; i++) {
    if (i >= 3) break
    try {
      await pb.collection('users').update(techs[i].id, {
        capacity_diaria_hours: capacities[i],
        occupancy_current_hours: 0,
        current_lat: locations[i].lat,
        current_lng: locations[i].lng,
        status: 'disponível',
      })
    } catch (e) {
      console.warn('Could not update existing user, keeping original values.', e)
    }
  }

  // Create new users if we don't have 3, setting their values on creation to comply with API rules
  while (techs.length < 3) {
    const i = techs.length
    const email = `tech_sim_${Date.now()}_${i}@example.com`
    const password = 'password123'
    const newTech = await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name: `Técnico Simulação ${i + 1}`,
      status: 'disponível',
      operational_status: 'available',
      capacity_diaria_hours: capacities[i],
      occupancy_current_hours: 0,
      current_lat: locations[i].lat,
      current_lng: locations[i].lng,
    })
    techs.push(newTech)
  }

  const activeTechs = techs.slice(0, 3)

  const orders = []
  for (let i = 0; i < 10; i++) {
    const baseLoc = locations[i % 3]
    const os = await pb.collection('service_orders').create({
      customer_name: `Cliente Bulk ${i + 1}`,
      service_type: 'Manutenção',
      urgency: 'média',
      sla_deadline: new Date(Date.now() + 86400000).toISOString(),
      status: 'novo',
      payment_status: 'pendente',
      description: `Ordem de serviço gerada em massa ${i + 1}`,
      origin: 'sistema',
      predicted_duration_hours: 2,
      lat: baseLoc.lat + (Math.random() - 0.5) * 0.05,
      lng: baseLoc.lng + (Math.random() - 0.5) * 0.05,
    })
    orders.push(os)
  }

  const promises = orders.map(async (os) => {
    try {
      const res = await pb.send(`/backend/v1/service-orders/${os.id}/assign`, { method: 'POST' })
      return { os, success: true, data: res }
    } catch (e) {
      return { os, success: false, error: e }
    }
  })

  const results = await Promise.all(promises)
  return { orders, results }
}
