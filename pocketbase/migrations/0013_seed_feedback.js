migrate(
  (app) => {
    const soCol = app.findCollectionByNameOrId('service_orders')
    const fbCol = app.findCollectionByNameOrId('service_feedback')

    const orders = app.findRecordsByFilter(
      'service_orders',
      "status = 'concluido' || status = 'faturado'",
      '-created',
      20,
      0,
    )

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i]
      try {
        app.findFirstRecordByData('service_feedback', 'service_order', order.id)
      } catch (_) {
        const fb = new Record(fbCol)
        fb.set('service_order', order.id)
        const score = Math.floor(Math.random() * 11) // 0 to 10
        fb.set('nps_score', score)
        if (score < 7) {
          fb.set(
            'complaint_description',
            'Serviço demorou ou apresentou problemas no decorrer da execução.',
          )
        }
        app.save(fb)
      }

      if (i % 4 === 0) {
        order.set('is_recurring', true)
        app.save(order)
      }
    }
  },
  (app) => {
    const records = app.findRecordsByFilter('service_feedback', "id != ''", '', 100, 0)
    for (const r of records) {
      app.delete(r)
    }
  },
)
