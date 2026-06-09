onRecordAfterCreateSuccess((e) => {
  if (e.record.getString('status') === 'duplicado') {
    try {
      const log = new Record($app.findCollectionByNameOrId('automation_logs'))
      log.set('webhook_type', 'EXCEPTION')
      log.set('service_order', e.record.id)
      log.set('action_taken', 'Duplicate OS - Marked new OS as duplicated and linked to original')
      log.set('result', 'Success')
      $app.save(log)
    } catch (err) {
      console.log('Exception duplicate os failed', err.message)
    }
  }
  e.next()
}, 'service_orders')
