routerAdd('POST', '/backend/v1/webhook/service-completed', (e) => {
  const body = e.requestInfo().body || {}
  const soId = body.service_order

  if (!soId) return e.badRequestError('Missing service_order')

  try {
    const so = $app.findRecordById('service_orders', soId)

    so.set('operational_status', 'completed')
    so.set('status', 'concluído')
    if (!so.get('finished_at')) so.set('finished_at', new Date().toISOString())

    $app.save(so)

    try {
      $app.findFirstRecordByData('financials', 'service_order', soId)
    } catch (_) {
      const fin = new Record($app.findCollectionByNameOrId('financials'))
      fin.set('service_order', soId)
      fin.set('payment_status', 'pendente')
      fin.set('final_value', so.get('final_value') || so.get('suggested_price') || 0)
      $app.save(fin)
    }

    const log = new Record($app.findCollectionByNameOrId('automation_logs'))
    log.set('webhook_type', 'SERVICE_COMPLETED')
    log.set('service_order', soId)
    log.set('action_taken', 'Set OS concluded, generated report (via hook), created financials')
    log.set('result', 'Success')
    $app.save(log)

    return e.json(200, { success: true })
  } catch (err) {
    return e.internalServerError(err.message)
  }
})
