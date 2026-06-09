cronAdd('exception_engine', '*/5 * * * *', () => {
  // 1. Customer No Response (30min)
  try {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60000).toISOString()
    const unnotifiedNoResponse = $app.findRecordsByFilter(
      'service_orders',
      `status = 'orçamento' && updated <= '${thirtyMinsAgo}'`,
      '',
      100,
      0,
    )

    for (const os of unnotifiedNoResponse) {
      const logs = $app.findRecordsByFilter(
        'automation_logs',
        `webhook_type = 'EXCEPTION' && service_order = '${os.id}' && action_taken ~ 'Customer No Response'`,
        '',
        1,
        0,
      )
      if (logs.length === 0) {
        const msg = new Record($app.findCollectionByNameOrId('service_order_messages'))
        msg.set('service_order', os.id)
        msg.set(
          'message',
          'Olá! Ainda estamos aguardando a sua resposta sobre o orçamento. Como podemos ajudar para avançarmos com o serviço?',
        )
        $app.save(msg)

        const log = new Record($app.findCollectionByNameOrId('automation_logs'))
        log.set('webhook_type', 'EXCEPTION')
        log.set('service_order', os.id)
        log.set('action_taken', 'Customer No Response - Sent follow up')
        log.set('result', 'Success')
        $app.save(log)
      } else if (logs.length === 1) {
        const logCreated = new Date(logs[0].getString('created')).getTime()
        if (Date.now() - logCreated > 30 * 60000) {
          os.set('operational_status', 'pending')

          const msg = new Record($app.findCollectionByNameOrId('service_order_messages'))
          msg.set('service_order', os.id)
          msg.set('message', '@Manager: Cliente não respondeu ao follow-up. Necessária revisão.')
          $app.save(msg)

          const log2 = new Record($app.findCollectionByNameOrId('automation_logs'))
          log2.set('webhook_type', 'EXCEPTION')
          log2.set('service_order', os.id)
          log2.set('action_taken', 'Customer No Response - Fallback to Manager')
          log2.set('result', 'Success')
          $app.save(log2)
        }
      }
    }
  } catch (err) {}

  // 2. Technician Late
  try {
    const now = new Date().toISOString()
    const lateAppts = $app.findRecordsByFilter(
      'appointments',
      `start_time <= '${now}' && operation_status = 'pendente'`,
      '',
      100,
      0,
    )

    for (const appt of lateAppts) {
      const quoteId = appt.getString('quote')
      if (!quoteId) continue
      try {
        const quote = $app.findRecordById('quotes', quoteId)
        const osId = quote.getString('service_order')

        const logs = $app.findRecordsByFilter(
          'automation_logs',
          `webhook_type = 'EXCEPTION' && service_order = '${osId}' && action_taken ~ 'Technician Late'`,
          '',
          1,
          0,
        )
        if (logs.length === 0) {
          const msg = new Record($app.findCollectionByNameOrId('service_order_messages'))
          msg.set('service_order', osId)
          msg.set(
            'message',
            'Alerta ao Técnico: O horário previsto para início já passou. Você está a caminho?',
          )
          $app.save(msg)

          const log = new Record($app.findCollectionByNameOrId('automation_logs'))
          log.set('webhook_type', 'EXCEPTION')
          log.set('service_order', osId)
          log.set('action_taken', 'Technician Late - Sent status request')
          log.set('result', 'Success')
          $app.save(log)
        }
      } catch (e) {}
    }
  } catch (err) {}

  // 6. Budget Ignored
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600000).toISOString()
    const ignoredQuotes = $app.findRecordsByFilter(
      'quotes',
      `status = 'novo' && created <= '${twentyFourHoursAgo}'`,
      '',
      100,
      0,
    )

    for (const quote of ignoredQuotes) {
      const osId = quote.getString('service_order')
      const logs = $app.findRecordsByFilter(
        'automation_logs',
        `webhook_type = 'EXCEPTION' && service_order = '${osId}' && action_taken ~ 'Budget Ignored'`,
        '',
        1,
        0,
      )

      if (logs.length === 0) {
        const msg = new Record($app.findCollectionByNameOrId('service_order_messages'))
        msg.set('service_order', osId)
        msg.set(
          'message',
          'Temos uma oferta especial! Aproveite 10% de desconto fechando seu orçamento hoje. Responda "SIM" para aprovar.',
        )
        $app.save(msg)

        const log = new Record($app.findCollectionByNameOrId('automation_logs'))
        log.set('webhook_type', 'EXCEPTION')
        log.set('service_order', osId)
        log.set('action_taken', 'Budget Ignored - Sent discount reminder')
        log.set('result', 'Success')
        $app.save(log)
      } else if (logs.length === 1) {
        const logCreated = new Date(logs[0].getString('created')).getTime()
        if (Date.now() - logCreated > 24 * 3600000) {
          quote.set('status', 'expirado')
          $app.save(quote)

          const log2 = new Record($app.findCollectionByNameOrId('automation_logs'))
          log2.set('webhook_type', 'EXCEPTION')
          log2.set('service_order', osId)
          log2.set('action_taken', 'Budget Ignored - Fallback to Expired')
          log2.set('result', 'Success')
          $app.save(log2)
        }
      }
    }
  } catch (err) {}

  // 11. Customer Follow-up Exception (Script 7)
  try {
    const threshold = new Date(Date.now() - 48 * 3600000).toISOString()
    const waitingQuotes = $app.findRecordsByFilter(
      'service_orders',
      `status = 'orçamento' && ultimo_contato != '' && ultimo_contato <= '${threshold}'`,
      '',
      100,
      0,
    )
    for (const os of waitingQuotes) {
      os.set('status', 'aguardando cliente')
      $app.save(os)

      const log = new Record($app.findCollectionByNameOrId('automation_logs'))
      log.set('webhook_type', 'EXCEPTION')
      log.set('service_order', os.id)
      log.set('action_taken', 'Customer Follow-up needed (Threshold exceeded)')
      log.set('result', 'Success')
      $app.save(log)
    }
  } catch (err) {}

  // 12. Technician Delay Governance (Script 8)
  try {
    const now = new Date().toISOString()
    const delayedOs = $app.findRecordsByFilter(
      'service_orders',
      `status = 'agendado' && scheduled_date != '' && scheduled_date < '${now}' && operational_status != 'en_route' && operational_status != 'in_progress'`,
      '',
      100,
      0,
    )
    for (const os of delayedOs) {
      os.set('status', 'risco')
      $app.save(os)

      const log = new Record($app.findCollectionByNameOrId('automation_logs'))
      log.set('webhook_type', 'EXCEPTION')
      log.set('service_order', os.id)
      log.set('action_taken', 'verificar atraso')
      log.set('result', 'Warning')
      $app.save(log)
    }
  } catch (err) {}

  // 10. SLA Breach (Impending)
  try {
    const activeOs = $app.findRecordsByFilter(
      'service_orders',
      `status != 'concluído' && status != 'cancelado' && sla_deadline != '' && urgency != 'crítica'`,
      '',
      100,
      0,
    )

    for (const os of activeOs) {
      const deadline = new Date(os.getString('sla_deadline')).getTime()
      const created = new Date(os.getString('created')).getTime()
      const totalSla = deadline - created
      const remaining = deadline - Date.now()

      if (totalSla > 0 && remaining > 0 && remaining / totalSla < 0.15) {
        os.set('urgency', 'crítica')
        $app.save(os)

        const msg = new Record($app.findCollectionByNameOrId('service_order_messages'))
        msg.set('service_order', os.id)
        msg.set(
          'message',
          'Alerta do Sistema: Prazo SLA está expirando (menos de 15% restante). Prioridade escalada para Crítica!',
        )
        $app.save(msg)

        const log = new Record($app.findCollectionByNameOrId('automation_logs'))
        log.set('webhook_type', 'EXCEPTION')
        log.set('service_order', os.id)
        log.set('action_taken', 'SLA Breach Impending - Escalated urgency to crítica')
        log.set('result', 'Success')
        $app.save(log)
      }
    }
  } catch (err) {}
})
