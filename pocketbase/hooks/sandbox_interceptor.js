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
        const log = new Record($app.findCollectionByNameOrId('automation_logs'))
        log.set('webhook_type', 'SANDBOX')
        log.set('action_taken', 'Mock Geolocation Override')
        log.set('result', 'Fixed coordinates applied (-23.5505, -46.6333)')
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
      const log = new Record($app.findCollectionByNameOrId('automation_logs'))
      log.set('webhook_type', 'SANDBOX')
      log.set('service_order', e.record.get('service_order'))
      log.set('action_taken', 'WhatsApp Simulation')
      log.set('result', 'SIMULAÇÃO: mensagem enviada')
      log.set('details', { message: e.record.get('message'), type: 'WhatsApp/Email bypass' })
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
        const log = new Record($app.findCollectionByNameOrId('automation_logs'))
        log.set('webhook_type', 'SANDBOX')
        log.set('service_order', e.record.id)
        log.set('action_taken', 'Email Simulation')
        log.set('result', 'SIMULAÇÃO: Pesquisa de satisfação enviada (Email)')
        $app.saveNoValidate(log)
      } catch (logErr) {}
    }
  }
  e.next()
}, 'service_orders')
