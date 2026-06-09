onRecordCreate((e) => {
  const msg = e.record
  if (!msg.get('service_order')) {
    const so = new Record($app.findCollectionByNameOrId('service_orders'))
    so.set('customer_name', 'Cliente Via Mensagem')
    so.set('service_type', 'Solicitação Direta')
    so.set('urgency', 'média')
    const tmw = new Date()
    tmw.setDate(tmw.getDate() + 1)
    so.set('sla_deadline', tmw.toISOString())
    so.set('status', 'novo')
    so.set('payment_status', 'pendente')
    $app.save(so)
    msg.set('service_order', so.id)
  }
  e.next()
}, 'service_order_messages')

onRecordAfterCreateSuccess((e) => {
  const msg = e.record
  const soId = msg.get('service_order')
  const senderId = msg.get('sender')

  if (!soId) return e.next()

  try {
    const so = $app.findRecordById('service_orders', soId)

    // Auto Approve Quote
    if (so.get('status') === 'orçamento' && senderId) {
      const text = msg.getString('message')
      const reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              "Analise a intenção da mensagem. Responda APENAS 'sim' se a mensagem indicar aprovação explícita do orçamento ou agendamento do serviço, caso contrário responda 'nao'.",
          },
          { role: 'user', content: text },
        ],
      })
      const content = reply.choices[0].message.content.toLowerCase()
      if (content.includes('sim')) {
        try {
          const quote = $app.findFirstRecordByData('quotes', 'service_order', soId)
          quote.set('status', 'aprovado')
          $app.save(quote)

          so.set('status', 'agendado')
          $app.save(so)

          const appt = new Record($app.findCollectionByNameOrId('appointments'))
          appt.set('quote', quote.id)
          appt.set('operation_status', 'pendente')
          $app.save(appt)

          const replyMsg = new Record($app.findCollectionByNameOrId('service_order_messages'))
          replyMsg.set('service_order', soId)
          replyMsg.set('message', 'Aprovação recebida com sucesso. O seu serviço foi agendado!')
          $app.save(replyMsg)
        } catch (err) {
          console.log('Approval automation failed:', err.message)
        }
      }
    }
  } catch (err) {}
  e.next()
}, 'service_order_messages')
