// This hook manages automated billing and external communications to the customer.
onRecordAfterUpdateSuccess((e) => {
  try {
    const isSandboxActive = () => {
      try {
        try {
          const s = $app.findFirstRecordByData('system_settings', 'key', 'bloqueio_total')
          if (s.get('value') === true || s.get('value')?.enabled === true) return true
        } catch (_) {}
        try {
          const s = $app.findFirstRecordByData('system_settings', 'key', 'modo_sandbox')
          if (s.get('value') === true || s.get('value')?.enabled === true) return true
        } catch (_) {}
        try {
          const s = $app.findFirstRecordByData('system_settings', 'key', 'sandbox_mode')
          if (s.get('value') === true || s.get('value')?.enabled === true) return true
        } catch (_) {}
        return false
      } catch (err) {
        return false
      }
    }

    if (
      e.record.get('operation_status') === 'concluido' &&
      e.record.original().get('operation_status') !== 'concluido'
    ) {
      const messageContent = 'Seu serviço foi concluído! Acesse o link para pagamento.'
      let recipient = 'Unknown'
      try {
        const appt = $app.findRecordById('appointments', e.record.id)
        $app.expandRecord(appt, ['quote.service_order.customer'])
        const customer = appt.expanded?.quote?.expanded?.service_order?.expanded?.customer
        if (customer) recipient = customer.getString('phone') || 'Unknown'
      } catch (err) {}

      if (isSandboxActive()) {
        const log = new Record($app.findCollectionByNameOrId('simulation_logs'))
        log.set('action_type', 'whatsapp_message')
        log.set('content', {
          message: messageContent,
          recipient: recipient,
          template: 'billing_trigger',
          note: 'SIMULAÇÃO: WhatsApp enviado',
        })
        log.set('status', 'simulado')
        log.set('event_source', 'on_appt_financial_communication')
        $app.save(log)
        return e.next()
      }

      // enviarWhatsAppReal(recipient, messageContent)
      // Normal external trigger logic would go here if not in sandbox
      // $http.send({ url: "https://api.whatsapp.com/send", ... })
    }
  } catch (err) {}

  e.next()
}, 'appointments')
