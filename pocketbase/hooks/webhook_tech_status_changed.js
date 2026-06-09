routerAdd('POST', '/backend/v1/webhook/tech-status-changed', (e) => {
  const body = e.requestInfo().body || {}
  const soId = body.service_order
  const statusEvent = body.status_event

  if (!soId || !statusEvent) return e.badRequestError('Missing service_order or status_event')

  try {
    const so = $app.findRecordById('service_orders', soId)
    let actionTaken = ''

    if (statusEvent === 'a caminho') {
      so.set('operational_status', 'en_route')
      if (so.getString('status') === 'aprovado') {
        so.set('status', 'agendado')
      }

      const techId = so.get('technician')
      if (techId) {
        try {
          const tech = $app.findRecordById('users', techId)
          tech.set('status', 'em rota')
          tech.set('operational_status', 'en_route')
          $app.save(tech)
        } catch (_) {}
      }
      actionTaken = 'Set OS to en_route and Tech to em rota'

      try {
        const quote = $app.findFirstRecordByData('quotes', 'service_order', soId)
        const appts = $app.findRecordsByFilter(
          'appointments',
          `quote = '${quote.id}'`,
          '-created',
          1,
          0,
        )
        if (appts.length > 0) {
          appts[0].set('operation_status', 'a_caminho')
          $app.save(appts[0])
        }
      } catch (_) {}
    } else if (statusEvent === 'iniciar') {
      so.set('operational_status', 'in_progress')
      so.set('status', 'executando')
      if (!so.get('started_at')) so.set('started_at', new Date().toISOString())

      const techId = so.get('technician')
      if (techId) {
        try {
          const tech = $app.findRecordById('users', techId)
          tech.set('status', 'ocupado')
          tech.set('operational_status', 'busy')
          $app.save(tech)
        } catch (_) {}
      }
      actionTaken = 'Set OS to in_progress and recorded started_at'
    } else if (statusEvent === 'concluir') {
      so.set('operational_status', 'completed')
      so.set('status', 'concluído')
      if (!so.get('finished_at')) so.set('finished_at', new Date().toISOString())

      const techId = so.get('technician')
      if (techId) {
        try {
          const tech = $app.findRecordById('users', techId)
          tech.set('status', 'disponível')
          tech.set('operational_status', 'available')
          $app.save(tech)
        } catch (_) {}
      }
      actionTaken = 'Set OS to completed and Tech to available'
    } else {
      return e.badRequestError('Invalid status_event')
    }

    $app.save(so)

    const log = new Record($app.findCollectionByNameOrId('automation_logs'))
    log.set('webhook_type', 'TECH_STATUS_CHANGED')
    log.set('service_order', soId)
    log.set('action_taken', actionTaken)
    log.set('result', 'Success')
    $app.save(log)

    return e.json(200, { success: true })
  } catch (err) {
    return e.internalServerError(err.message)
  }
})
