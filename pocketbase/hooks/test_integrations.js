routerAdd(
  'POST',
  '/backend/v1/test-integrations',
  (e) => {
    const body = e.requestInfo().body || {}
    const type = body.type // whatsapp, email, payment, webhook, gps

    let isLocked = false
    try {
      const settings = $app.findFirstRecordByData('system_settings', 'key', 'bloqueio_total')
      const val = settings.get('value')
      isLocked = val === true || (val && val.enabled === true)
    } catch (_) {}

    if (!isLocked) {
      return e.badRequestError('Bloqueio total não está ativo. Risco de chamada externa real.')
    }

    const logCol = $app.findCollectionByNameOrId('simulation_logs')
    const log = new Record(logCol)
    log.set('action_type', 'test_' + type)
    log.set('status', 'success')
    log.set('event_source', 'test_suite')

    let content = {}

    if (type === 'whatsapp') {
      content = { message: 'SIMULAÇÃO — WhatsApp', details: 'Mensagem interceptada com sucesso' }
    } else if (type === 'email') {
      content = { message: 'SIMULAÇÃO — email', details: 'Email interceptado com sucesso' }
    } else if (type === 'payment') {
      content = {
        payment_status: 'simulado_aprovado',
        details: 'Cobrança interceptada com sucesso',
      }
    } else if (type === 'webhook') {
      content = {
        message: 'SIMULAÇÃO — Webhook',
        details: 'POST evitado com sucesso',
        payload: { test: true },
      }
    } else if (type === 'gps') {
      content = { lat: -23.5505, lng: -46.6333, message: 'Coordenada Simulada Ativa' }
    } else {
      return e.badRequestError('Tipo de teste desconhecido.')
    }

    log.set('content', content)
    $app.save(log)

    return e.json(200, {
      success: true,
      log: { id: log.id, action_type: log.get('action_type'), content },
    })
  },
  $apis.requireAuth(),
)

routerAdd(
  'DELETE',
  '/backend/v1/test-integrations',
  (e) => {
    try {
      const records = $app.findRecordsByFilter(
        'simulation_logs',
        "event_source = 'test_suite'",
        '',
        1000,
        0,
      )
      for (const rec of records) {
        $app.delete(rec)
      }
    } catch (_) {}
    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
