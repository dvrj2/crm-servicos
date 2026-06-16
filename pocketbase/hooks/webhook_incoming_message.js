routerAdd('POST', '/backend/v1/webhook/incoming-message', (e) => {
  const body = e.requestInfo().body || {}
  const phone = body.phone || ''
  const text = body.message || ''

  if (!phone || !text) return e.badRequestError('Missing phone or message')

  let customerId = null
  let customerName = 'Cliente Via Webhook'
  try {
    const customer = $app.findFirstRecordByData('customers', 'phone', phone)
    customerId = customer.id
    customerName = customer.getString('name')
  } catch (_) {}

  let soId = null
  let actionTaken = ''
  try {
    if (customerId) {
      const activeSOs = $app.findRecordsByFilter(
        'service_orders',
        `customer = '${customerId}' && status != 'concluído'`,
        '-created',
        1,
        0,
      )
      if (activeSOs.length > 0) {
        soId = activeSOs[0].id
      }
    }
  } catch (_) {}

  let isNewSO = false
  if (!soId) {
    const so = new Record($app.findCollectionByNameOrId('service_orders'))
    so.set('customer_name', customerName)
    if (customerId) so.set('customer', customerId)
    so.set('service_type', 'Solicitação Direta via Webhook')
    so.set('urgency', 'média')
    const tmw = new Date()
    tmw.setDate(tmw.getDate() + 1)
    so.set('sla_deadline', tmw.toISOString())
    so.set('status', 'novo')
    so.set('payment_status', 'pendente')
    $app.save(so)
    soId = so.id
    actionTaken = 'Created new Service Order'
    isNewSO = true
  } else {
    actionTaken = 'Found existing Service Order'
  }

  const msg = new Record($app.findCollectionByNameOrId('service_order_messages'))
  msg.set('service_order', soId)
  msg.set('message', text)
  $app.save(msg)

  if (isNewSO) {
    let isSandbox = false
    try {
      let settings = null
      try {
        settings = $app.findFirstRecordByData('system_settings', 'key', 'modo_sandbox')
      } catch (err) {
        settings = $app.findFirstRecordByData('system_settings', 'key', 'sandbox_mode')
      }
      isSandbox = settings.get('value') === true || settings.get('value')?.enabled === true
    } catch (err) {}

    const replyMsg = 'Recebemos sua solicitação! Uma ordem de serviço foi criada.'

    if (isSandbox) {
      try {
        const simLog = new Record($app.findCollectionByNameOrId('simulation_logs'))
        simLog.set('action_type', 'WhatsApp')
        simLog.set('content', {
          message: replyMsg,
          recipient: phone,
          note: 'SIMULAÇÃO: WhatsApp enviado',
        })
        simLog.set('status', 'simulado')
        simLog.set('event_source', 'webhook_incoming_message')
        $app.save(simLog)
      } catch (eLog) {}
    } else {
      // enviarWhatsAppReal(phone, replyMsg)
    }
  }

  try {
    const log = new Record($app.findCollectionByNameOrId('automation_logs'))
    log.set('webhook_type', 'INCOMING_MESSAGE')
    log.set('service_order', soId)
    log.set('action_taken', actionTaken)
    log.set('result', 'Success')
    $app.save(log)
  } catch (err) {
    console.log('Log error', err.message)
  }

  return e.json(200, { success: true, service_order: soId })
})
