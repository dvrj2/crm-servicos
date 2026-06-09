onRecordUpdate((e) => {
  const appt = e.record
  const oldTech = appt.original().getString('technician')
  const newTech = appt.getString('technician')

  if (oldTech && !newTech) {
    const quoteId = appt.getString('quote')
    if (quoteId) {
      try {
        const quote = $app.findRecordById('quotes', quoteId)
        const osId = quote.getString('service_order')

        const os = $app.findRecordById('service_orders', osId)
        os.set('status', 'qualificado')
        os.set('technician', '')
        $app.save(os)

        const msg = new Record($app.findCollectionByNameOrId('service_order_messages'))
        msg.set('service_order', osId)
        msg.set(
          'message',
          'Atenção: O técnico anterior declinou ou foi removido. A OS retornou para a fila de qualificação.',
        )
        $app.save(msg)

        const log = new Record($app.findCollectionByNameOrId('automation_logs'))
        log.set('webhook_type', 'EXCEPTION')
        log.set('service_order', osId)
        log.set('action_taken', 'Handled technician decline - OS reset to qualificado')
        log.set('result', 'Success')
        $app.save(log)
      } catch (err) {
        console.log('Exception tech decline failed', err.message)
      }
    }
  }
  e.next()
}, 'appointments')
