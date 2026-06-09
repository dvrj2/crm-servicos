routerAdd('POST', '/backend/v1/webhook/order-approved', (e) => {
  const body = e.requestInfo().body || {}
  const soId = body.service_order

  if (!soId) return e.badRequestError('Missing service_order')

  try {
    const so = $app.findRecordById('service_orders', soId)
    so.set('status', 'aprovado')
    $app.save(so)

    let quoteId = null
    try {
      const quote = $app.findFirstRecordByData('quotes', 'service_order', soId)
      quote.set('status', 'aprovado')
      $app.save(quote)
      quoteId = quote.id
    } catch (_) {
      const quote = new Record($app.findCollectionByNameOrId('quotes'))
      quote.set('service_order', soId)
      quote.set('status', 'aprovado')
      $app.save(quote)
      quoteId = quote.id
    }

    try {
      $app.findFirstRecordByData('appointments', 'quote', quoteId)
    } catch (_) {
      const appt = new Record($app.findCollectionByNameOrId('appointments'))
      appt.set('quote', quoteId)
      appt.set('operation_status', 'pendente')
      $app.save(appt)
    }

    const log = new Record($app.findCollectionByNameOrId('automation_logs'))
    log.set('webhook_type', 'ORDER_APPROVED')
    log.set('service_order', soId)
    log.set('action_taken', 'Updated OS to aprovado and created appointment')
    log.set('result', 'Success')
    $app.save(log)

    return e.json(200, { success: true })
  } catch (err) {
    return e.internalServerError(err.message)
  }
})
