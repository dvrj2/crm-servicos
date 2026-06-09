onRecordAfterCreateSuccess((e) => {
  const os = e.record
  if (!os.getFloat('lat') && !os.getFloat('lng')) {
    try {
      const msg = new Record($app.findCollectionByNameOrId('service_order_messages'))
      msg.set('service_order', os.id)
      msg.set(
        'message',
        'Notamos que seu endereço pode estar incompleto. Por favor, confirme a localização enviando um pino (localização) no WhatsApp.',
      )
      $app.save(msg)

      const log = new Record($app.findCollectionByNameOrId('automation_logs'))
      log.set('webhook_type', 'EXCEPTION')
      log.set('service_order', os.id)
      log.set('action_taken', 'Requested location pin for invalid address')
      log.set('result', 'Success')
      $app.save(log)

      const updatedOs = $app.findRecordById('service_orders', os.id)
      updatedOs.set('operational_status', 'pending')
      $app.save(updatedOs)
    } catch (err) {
      console.log('Exception address handler failed', err.message)
    }
  }
  e.next()
}, 'service_orders')
