migrate(
  (app) => {
    try {
      app.findFirstRecordByData('service_orders', 'customer_name', 'Condomínio Solar')
      return
    } catch (_) {}

    const ordersCol = app.findCollectionByNameOrId('service_orders')
    const order = new Record(ordersCol)
    order.set('customer_name', 'Condomínio Solar')
    order.set('service_type', 'Manutenção Preventiva')
    order.set('urgency', 'media')
    order.set('sla_deadline', new Date().toISOString())
    order.set('status', 'concluido')
    order.set('diagnosis', 'Falha no inversor de frequência por superaquecimento.')
    order.set('activities_performed', 'Substituição de cooler e limpeza de contatos.')
    order.set('current_condition', 'Operando em carga nominal dentro dos parâmetros.')
    order.set('recommendations', 'Limpeza trimestral do painel elétrico.')
    order.set('is_rework', false)
    order.set('has_pending_checklist', false)
    order.set('started_at', new Date(Date.now() - 7200000).toISOString())
    order.set('finished_at', new Date().toISOString())
    order.set('materials_used', 'Cooler 12V DC, Limpa Contato Spray')
    app.save(order)

    const photosCol = app.findCollectionByNameOrId('service_order_photos')
    try {
      const photoBefore = new Record(photosCol)
      photoBefore.set('service_order', order.id)
      photoBefore.set('stage', 'before')
      app.save(photoBefore)
    } catch (err) {}

    try {
      const photoAfter = new Record(photosCol)
      photoAfter.set('service_order', order.id)
      photoAfter.set('stage', 'after')
      app.save(photoAfter)
    } catch (err) {}
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData(
        'service_orders',
        'customer_name',
        'Condomínio Solar',
      )
      app.delete(record)
    } catch (_) {}
  },
)
