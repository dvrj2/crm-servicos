onRecordValidate((e) => {
  const msg = e.record
  if (!msg.id) {
    const sender = msg.getString('sender')
    const so = msg.getString('service_order')
    const text = msg.getString('message')
    if (so && text) {
      const sixtySecAgo = new Date(Date.now() - 60000).toISOString()
      try {
        const query = sender
          ? `service_order = '${so}' && sender = '${sender}' && message = '${text}' && created >= '${sixtySecAgo}'`
          : `service_order = '${so}' && message = '${text}' && created >= '${sixtySecAgo}'`

        const dups = $app.findRecordsByFilter('service_order_messages', query, '', 1, 0)
        if (dups.length > 0) {
          try {
            const log = new Record($app.findCollectionByNameOrId('automation_logs'))
            log.set('webhook_type', 'EXCEPTION')
            log.set('service_order', so)
            log.set('action_taken', 'Ignored duplicate message within 60s')
            log.set('result', 'Success')
            $app.save(log)
          } catch (err) {}
          throw new BadRequestError('Mensagem duplicada ignorada.')
        }
      } catch (err) {
        if (err instanceof BadRequestError) throw err
      }
    }
  }
  e.next()
}, 'service_order_messages')

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

    // General outgoing message handling
    if (senderId) {
      let isSandbox = false
      try {
        let lock = null
        try {
          lock = $app.findFirstRecordByData('system_settings', 'key', 'bloqueio_total')
        } catch (e) {}
        if (lock && (lock.get('value') === true || lock.get('value')?.enabled === true)) {
          isSandbox = true
        } else {
          let settings = null
          try {
            settings = $app.findFirstRecordByData('system_settings', 'key', 'modo_sandbox')
          } catch (err) {
            try {
              settings = $app.findFirstRecordByData('system_settings', 'key', 'sandbox_mode')
            } catch (e) {}
          }
          if (
            settings &&
            (settings.get('value') === true || settings.get('value')?.enabled === true)
          ) {
            isSandbox = true
          }
        }
      } catch (err) {}

      let recipient = 'Unknown'
      try {
        $app.expandRecord(so, ['customer'])
        if (so.expanded?.customer) recipient = so.expanded.customer.getString('phone') || 'Unknown'
      } catch (err) {}

      const text = msg.getString('message')

      if (isSandbox) {
        try {
          const simLog = new Record($app.findCollectionByNameOrId('simulation_logs'))
          simLog.set('action_type', 'whatsapp_message')
          simLog.set('content', {
            message: text,
            recipient: recipient,
            note: 'SIMULAÇÃO: WhatsApp enviado',
          })
          simLog.set('status', 'simulado')
          simLog.set('event_source', 'on_so_message_automation_outgoing')
          $app.save(simLog)
        } catch (err) {}
      } else {
        // enviarWhatsAppReal(recipient, text)
      }
    }

    // Auto Approve Quote
    if (so.get('status') === 'orçamento' && senderId) {
      const text = msg.getString('message')

      let isSandboxApproval = false
      try {
        let lock = null
        try {
          lock = $app.findFirstRecordByData('system_settings', 'key', 'bloqueio_total')
        } catch (e) {}
        if (lock && (lock.get('value') === true || lock.get('value')?.enabled === true)) {
          isSandboxApproval = true
        } else {
          let settings = null
          try {
            settings = $app.findFirstRecordByData('system_settings', 'key', 'modo_sandbox')
          } catch (err) {
            try {
              settings = $app.findFirstRecordByData('system_settings', 'key', 'sandbox_mode')
            } catch (e) {}
          }
          if (
            settings &&
            (settings.get('value') === true || settings.get('value')?.enabled === true)
          ) {
            isSandboxApproval = true
          }
        }
      } catch (err) {}

      let content = 'nao'
      if (isSandboxApproval) {
        if (text.toLowerCase().includes('sim') || text.toLowerCase().includes('aprovo')) {
          content = 'sim'
        }
        try {
          const simLog = new Record($app.findCollectionByNameOrId('simulation_logs'))
          simLog.set('action_type', 'ai_mock')
          simLog.set('content', {
            service_order: soId,
            mock: 'message_intent',
            text,
            is_approval: content === 'sim',
          })
          simLog.set('status', 'simulado')
          simLog.set('event_source', 'on_so_message_automation_intent')
          $app.saveNoValidate(simLog)
        } catch (err) {}
      } else {
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
        content = reply.choices[0].message.content.toLowerCase()
      }

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

          let recipient = 'Unknown'
          try {
            $app.expandRecord(so, ['customer'])
            if (so.expanded?.customer)
              recipient = so.expanded.customer.getString('phone') || 'Unknown'
          } catch (err) {}

          if (isSandboxApproval) {
            try {
              const simLog = new Record($app.findCollectionByNameOrId('simulation_logs'))
              simLog.set('action_type', 'whatsapp_message')
              simLog.set('content', {
                message: 'Aprovação recebida com sucesso. O seu serviço foi agendado!',
                recipient: recipient,
                note: 'SIMULAÇÃO: WhatsApp enviado',
              })
              simLog.set('status', 'simulado')
              simLog.set('event_source', 'on_so_message_automation')
              $app.save(simLog)
            } catch (eLog) {}
          } else {
            // enviarWhatsAppReal(recipient, 'Aprovação recebida com sucesso. O seu serviço foi agendado!')
          }

          try {
            const log = new Record($app.findCollectionByNameOrId('automation_logs'))
            log.set('webhook_type', 'AUTO_APPROVAL')
            log.set('service_order', soId)
            log.set('action_taken', 'Automatically approved quote and scheduled via message intent')
            log.set('result', 'Success')
            $app.save(log)
          } catch (eLog) {}
        } catch (err) {
          console.log('Approval automation failed:', err.message)
        }
      }
    }
  } catch (err) {}
  e.next()
}, 'service_order_messages')
