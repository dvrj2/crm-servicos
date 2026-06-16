routerAdd(
  'POST',
  '/backend/v1/payments/process',
  (e) => {
    const body = e.requestInfo().body || {}
    const financialId = body.financial_id
    if (!financialId) return e.badRequestError('financial_id is required')

    const financial = $app.findRecordById('financials', financialId)

    function isSandboxActive() {
      try {
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

    const isSandbox = isSandboxActive()
    const simulateStatus = body.simulate_success ? 'simulado_aprovado' : 'simulado_negado'

    if (isSandbox) {
      // Sandbox Verification and Gateway Bypass
      financial.set('payment_status', simulateStatus)
      $app.save(financial)

      if (financial.get('service_order')) {
        try {
          const so = $app.findRecordById('service_orders', financial.get('service_order'))
          so.set('payment_status', simulateStatus)
          $app.save(so)
        } catch (err) {}
      }

      // Log Registration
      try {
        const logCol = $app.findCollectionByNameOrId('simulation_logs')
        const log = new Record(logCol)
        log.set('action_type', 'PAGAMENTO_SIMULADO')
        log.set('content', {
          financial_id: financialId,
          service_order: financial.get('service_order'),
          value: financial.get('final_value'),
          simulated_status: simulateStatus,
        })
        log.set('event_source', 'process_payment_endpoint')
        log.set('status', 'simulado')
        $app.saveNoValidate(log)
      } catch (logErr) {}

      return e.json(200, {
        success: true,
        status: simulateStatus,
        message: 'Pagamento simulado processado',
      })
    }

    // Normal flow (enviarPagamentoReal)
    function enviarPagamentoReal(finRecord) {
      // Implementation of real payment gateway call would go here
      // Returning the requested intent as a mock result
      return body.simulate_success !== false
    }

    try {
      const realSuccess = enviarPagamentoReal(financial)
      const realStatus = realSuccess ? 'pago' : 'erro'
      financial.set('payment_status', realStatus)
      $app.save(financial)

      if (financial.get('service_order')) {
        try {
          const so = $app.findRecordById('service_orders', financial.get('service_order'))
          so.set('payment_status', realStatus === 'pago' ? 'pago' : 'pendente')
          $app.save(so)
        } catch (err) {}
      }
      return e.json(200, {
        success: realSuccess,
        status: realStatus,
        message: realSuccess ? 'Pagamento real processado com sucesso' : 'Falha no pagamento real',
      })
    } catch (err) {
      return e.internalServerError('Falha no pagamento real: ' + err.message)
    }
  },
  $apis.requireAuth(),
)
