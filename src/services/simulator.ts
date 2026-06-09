import pb from '@/lib/pocketbase/client'
import { ServiceOrder } from '@/types'

export const createSimulatedLog = async (
  osId: string,
  action: string,
  result: string,
  details: any = {},
) => {
  try {
    return await pb.collection('automation_logs').create({
      webhook_type: 'simulator',
      service_order: osId,
      action_taken: action,
      result: result,
      details: details,
    })
  } catch (err) {
    console.error('Failed to create log', err)
  }
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
