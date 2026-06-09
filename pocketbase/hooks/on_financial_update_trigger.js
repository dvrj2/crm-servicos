onRecordUpdate((e) => {
  const fin = e.record
  const oldStatus = fin.original().getString('payment_status')
  const newStatus = fin.getString('payment_status')

  if (oldStatus !== 'pago' && newStatus === 'pago') {
    let finalOsId = fin.getString('service_order')
    if (!finalOsId) {
      try {
        const exec = $app.findRecordById('executions', fin.getString('execution'))
        const appt = $app.findRecordById('appointments', exec.getString('appointment'))
        const quote = $app.findRecordById('quotes', appt.getString('quote'))
        finalOsId = quote.getString('service_order')
      } catch (err) {}
    }

    if (finalOsId) {
      try {
        const os = $app.findRecordById('service_orders', finalOsId)
        os.set('status', 'faturado')
        os.set('payment_status', 'pago')
        $app.save(os)
      } catch (err) {}
    }

    const finalValue = fin.getFloat('final_value') || 0
    let cost = 100
    try {
      if (finalOsId) {
        const os = $app.findRecordById('service_orders', finalOsId)
        if (os.getFloat('actual_duration_hours')) {
          cost = os.getFloat('actual_duration_hours') * 100
        }
      }
    } catch (err) {}
    if (finalValue > 0) {
      fin.set('actual_margin', ((finalValue - cost) / finalValue) * 100)
    }
  }

  if (oldStatus !== 'erro' && newStatus === 'erro') {
    try {
      let finalOsId = fin.getString('service_order')
      if (finalOsId) {
        const log = new Record($app.findCollectionByNameOrId('automation_logs'))
        log.set('webhook_type', 'EXCEPTION')
        log.set('service_order', finalOsId)
        log.set('action_taken', 'falha de pagamento - cobrança manual necessária')
        log.set('result', 'Failure')
        $app.save(log)
      }
    } catch (err) {}
  }

  e.next()
}, 'financials')
