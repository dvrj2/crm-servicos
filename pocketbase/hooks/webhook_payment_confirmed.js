routerAdd('POST', '/backend/v1/webhook/payment-confirmed', (e) => {
  const body = e.requestInfo().body || {}
  const soId = body.service_order

  if (!soId) return e.badRequestError('Missing service_order')

  try {
    const so = $app.findRecordById('service_orders', soId)

    try {
      const fin = $app.findFirstRecordByData('financials', 'service_order', soId)
      fin.set('payment_status', 'pago')
      $app.save(fin)
    } catch (_) {
      const fin = new Record($app.findCollectionByNameOrId('financials'))
      fin.set('service_order', soId)
      fin.set('payment_status', 'pago')
      fin.set('final_value', so.get('final_value') || so.get('suggested_price') || 0)
      $app.save(fin)
    }

    so.set('status', 'concluído')
    so.set('payment_status', 'pago')
    $app.save(so)

    const log = new Record($app.findCollectionByNameOrId('automation_logs'))
    log.set('webhook_type', 'PAYMENT_CONFIRMED')
    log.set('service_order', soId)
    log.set('action_taken', 'Updated payment_status to pago and OS to concluído')
    log.set('result', 'Success')
    $app.save(log)

    return e.json(200, { success: true })
  } catch (err) {
    return e.internalServerError(err.message)
  }
})
