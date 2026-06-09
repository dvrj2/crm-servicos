migrate(
  (app) => {
    const records = app.findRecordsByFilter(
      'service_orders',
      "status = 'concluido' || status = 'faturado'",
      '-created',
      100,
      0,
    )
    for (const record of records) {
      if (!record.get('final_value')) {
        const val = Math.floor(Math.random() * 5000) + 500
        record.set('final_value', val)
        record.set('planned_margin', 30)
        const actual = Math.floor(Math.random() * 60) - 20
        record.set('actual_margin', actual)

        const statuses = ['pago', 'pendente', 'vencido']
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        record.set('payment_status', status)
        record.set('payment_link', 'https://pay.goskip.app/' + record.id)
        app.save(record)
      }
    }
  },
  (app) => {
    // Irreversible
  },
)
