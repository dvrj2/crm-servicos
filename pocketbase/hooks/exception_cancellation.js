onRecordUpdate((e) => {
  const os = e.record
  const oldStatus = os.original().getString('status')
  const newStatus = os.getString('status')

  if (oldStatus !== 'cancelado' && newStatus === 'cancelado') {
    const opStatus = os.getString('operational_status')
    if (opStatus === 'pending' || opStatus === 'en_route') {
      try {
        const msg = new Record($app.findCollectionByNameOrId('service_order_messages'))
        msg.set('service_order', os.id)
        msg.set(
          'message',
          'Alerta ao Técnico: O cliente cancelou o serviço antes do início. Por favor, aborte o deslocamento.',
        )
        $app.save(msg)

        const log = new Record($app.findCollectionByNameOrId('automation_logs'))
        log.set('webhook_type', 'EXCEPTION')
        log.set('service_order', os.id)
        log.set('action_taken', 'Alerted technician of pre-service cancellation')
        log.set('result', 'Success')
        $app.save(log)
      } catch (err) {
        console.log('Exception cancellation failed', err.message)
      }
    }
  }
  e.next()
}, 'service_orders')
