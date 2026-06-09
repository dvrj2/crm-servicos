onRecordAfterCreateSuccess((e) => {
  const appt = e.record
  let soId = ''
  const quoteId = appt.get('quote')
  if (quoteId) {
    try {
      const quote = $app.findRecordById('quotes', quoteId)
      soId = quote.get('service_order')
    } catch (err) {}
  }
  if (soId) {
    try {
      const msg = new Record($app.findCollectionByNameOrId('service_order_messages'))
      msg.set('service_order', soId)
      const dt = appt.get('start_time') || 'data a combinar'
      msg.set(
        'message',
        `Confirmação de Agendamento: Seu serviço foi marcado para ${dt}. Em caso de dúvidas, nos avise!`,
      )
      $app.save(msg)
    } catch (err) {}
  }
  e.next()
}, 'appointments')

onRecordAfterUpdateSuccess((e) => {
  const appt = e.record
  const oldStatus = appt.original().getString('operation_status')
  const newStatus = appt.getString('operation_status')

  if (oldStatus !== newStatus && newStatus === 'a_caminho') {
    let soId = ''
    const quoteId = appt.get('quote')
    if (quoteId) {
      try {
        const quote = $app.findRecordById('quotes', quoteId)
        soId = quote.get('service_order')
      } catch (err) {}
    }
    if (soId) {
      try {
        const msg = new Record($app.findCollectionByNameOrId('service_order_messages'))
        msg.set('service_order', soId)
        msg.set(
          'message',
          'Aviso de Rota: Nosso técnico acaba de sair e está a caminho do seu local.',
        )
        $app.save(msg)
      } catch (err) {}
    }
  }
  e.next()
}, 'appointments')

onRecordAfterCreateSuccess((e) => {
  const fin = e.record
  let soId = fin.get('service_order')

  if (!soId) {
    try {
      const execId = fin.get('execution')
      if (execId) {
        const exec = $app.findRecordById('executions', execId)
        const appt = $app.findRecordById('appointments', exec.get('appointment'))
        const quote = $app.findRecordById('quotes', appt.get('quote'))
        soId = quote.get('service_order')

        fin.set('service_order', soId)
        $app.saveNoValidate(fin)
      }
    } catch (err) {}
  }

  if (soId) {
    try {
      const so = $app.findRecordById('service_orders', soId)
      const report = so.getString('technical_report') || 'Laudo não disponível.'
      const paymentLink = so.getString('payment_link') || 'Link de pagamento não disponível.'

      const msg = new Record($app.findCollectionByNameOrId('service_order_messages'))
      msg.set('service_order', soId)
      msg.set(
        'message',
        `Serviço concluído!\n\nLaudo Técnico:\n${report}\n\nFaturamento: O valor total do trabalho foi de R$ ${fin.get('final_value') || 0}.\n\nPara realizar o pagamento, acesse:\n${paymentLink}`,
      )
      $app.save(msg)
    } catch (err) {}
  }
  e.next()
}, 'financials')

onRecordAfterUpdateSuccess((e) => {
  const fin = e.record
  const oldStatus = fin.original().getString('payment_status')
  const newStatus = fin.getString('payment_status')

  if (oldStatus !== newStatus && newStatus === 'pago') {
    const soId = fin.get('service_order')
    if (soId) {
      try {
        const so = $app.findRecordById('service_orders', soId)
        so.set('payment_status', 'pago')
        if (so.getString('status') !== 'concluído') {
          so.set('status', 'concluído')
        }
        $app.save(so)

        const msg = new Record($app.findCollectionByNameOrId('service_order_messages'))
        msg.set('service_order', soId)
        msg.set(
          'message',
          'Pagamento Confirmado! Agradecemos pela preferência e confiança na nossa equipe.',
        )
        $app.save(msg)
      } catch (err) {}
    }
  }
  e.next()
}, 'financials')
