onRecordUpdate((e) => {
  const fin = e.record
  const oldStatus = fin.original().getString('payment_status')
  const newStatus = fin.getString('payment_status')

  if (oldStatus !== 'vencido' && newStatus === 'vencido') {
    let finalOsId = fin.getString('service_order')

    if (!finalOsId) {
      try {
        const exec = $app.findRecordById('executions', fin.getString('execution'))
        const appt = $app.findRecordById('appointments', exec.getString('appointment'))
        const quote = $app.findRecordById('quotes', appt.getString('quote'))
        finalOsId = quote.getString('service_order')
      } catch (e) {}
    }

    if (finalOsId) {
      try {
        const msg = new Record($app.findCollectionByNameOrId('service_order_messages'))
        msg.set('service_order', finalOsId)
        msg.set(
          'message',
          `Olá! Identificamos uma falha no seu pagamento. Por favor, tente novamente utilizando este link: https://pay.mock.com/${finalOsId}?retry=true`,
        )
        $app.save(msg)

        const log = new Record($app.findCollectionByNameOrId('automation_logs'))
        log.set('webhook_type', 'EXCEPTION')
        log.set('service_order', finalOsId)
        log.set('action_taken', 'Sent retry link to customer for failed payment')
        log.set('result', 'Success')
        $app.save(log)
      } catch (err) {
        console.log('Exception payment failed', err.message)
      }
    }
  }
  e.next()
}, 'financials')
