// 1. Fixed GPS for technicians
onRecordUpdate((e) => {
  function isSandboxActive() {
    try {
      const settings = $app.findFirstRecordByData('system_settings', 'key', 'sandbox_mode')
      return settings.get('value')?.enabled === true
    } catch (err) {
      return false
    }
  }

  if (isSandboxActive()) {
    const oldLat = e.record.original().get('current_lat')
    const oldLng = e.record.original().get('current_lng')
    const newLat = e.record.get('current_lat')
    const newLng = e.record.get('current_lng')

    if (newLat !== oldLat || newLng !== oldLng) {
      e.record.set('current_lat', -23.5505)
      e.record.set('current_lng', -46.6333)

      try {
        const log = new Record($app.findCollectionByNameOrId('simulation_logs'))
        log.set('action_type', 'GPS')
        log.set('content', {
          requested: { lat: newLat, lng: newLng },
          provided: { lat: -23.5505, lng: -46.6333 },
        })
        log.set('event_source', 'onRecordUpdate(users)')
        log.set('status', 'simulado')
        $app.saveNoValidate(log)
      } catch (logErr) {}
    }
  }
  e.next()
}, 'users')

// 2. Intercept Email / WhatsApp on new system messages
onRecordAfterCreateSuccess((e) => {
  function isSandboxActive() {
    try {
      const settings = $app.findFirstRecordByData('system_settings', 'key', 'sandbox_mode')
      return settings.get('value')?.enabled === true
    } catch (err) {
      return false
    }
  }

  if (isSandboxActive() && e.record.get('sender') === '') {
    try {
      const log = new Record($app.findCollectionByNameOrId('simulation_logs'))
      log.set('action_type', 'WhatsApp')
      log.set('content', {
        service_order: e.record.get('service_order'),
        message: e.record.get('message'),
        recipient: 'Simulated Recipient',
      })
      log.set('event_source', 'onRecordAfterCreateSuccess(service_order_messages)')
      log.set('status', 'simulado')
      $app.saveNoValidate(log)
    } catch (logErr) {}
  }
  e.next()
}, 'service_order_messages')

// 3. Intercept Satisfaction Email on OS Completion
onRecordAfterUpdateSuccess((e) => {
  function isSandboxActive() {
    try {
      const settings = $app.findFirstRecordByData('system_settings', 'key', 'sandbox_mode')
      return settings.get('value')?.enabled === true
    } catch (err) {
      return false
    }
  }

  if (isSandboxActive()) {
    const oldStatus = e.record.original().getString('status')
    const newStatus = e.record.getString('status')
    if (oldStatus !== 'concluído' && newStatus === 'concluído') {
      try {
        const log = new Record($app.findCollectionByNameOrId('simulation_logs'))
        log.set('action_type', 'Email')
        log.set('content', {
          service_order: e.record.id,
          subject: 'Pesquisa de Satisfação',
          body: 'Pesquisa de satisfação enviada (Email)',
          recipient: 'Cliente',
        })
        log.set('event_source', 'onRecordAfterUpdateSuccess(service_orders)')
        log.set('status', 'simulado')
        $app.saveNoValidate(log)
      } catch (logErr) {}
    }
  }
  e.next()
}, 'service_orders')

// 4. Intercept Payment confirmation
onRecordUpdate((e) => {
  function isSandboxActive() {
    try {
      const settings = $app.findFirstRecordByData('system_settings', 'key', 'sandbox_mode')
      return settings.get('value')?.enabled === true
    } catch (err) {
      return false
    }
  }

  if (isSandboxActive()) {
    const oldStatus = e.record.original().getString('payment_status')
    const newStatus = e.record.getString('payment_status')
    if (oldStatus !== newStatus && newStatus === 'pago') {
      try {
        const log = new Record($app.findCollectionByNameOrId('simulation_logs'))
        log.set('action_type', 'Payment')
        log.set('content', {
          execution: e.record.get('execution'),
          value: e.record.get('final_value'),
          status: 'aprovado',
          intent: 'Pagamento de OS',
        })
        log.set('event_source', 'onRecordUpdate(financials)')
        log.set('status', 'simulado')
        $app.saveNoValidate(log)
      } catch (logErr) {}
    }
  }
  e.next()
}, 'financials')
