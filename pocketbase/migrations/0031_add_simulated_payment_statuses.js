migrate(
  (app) => {
    const so = app.findCollectionByNameOrId('service_orders')
    const fieldSo = so.fields.getByName('payment_status')
    if (fieldSo) {
      fieldSo.values = ['pago', 'pendente', 'vencido', 'simulado_aprovado', 'simulado_negado']
    }
    app.save(so)

    const fin = app.findCollectionByNameOrId('financials')
    const fieldFin = fin.fields.getByName('payment_status')
    if (fieldFin) {
      fieldFin.values = ['pendente', 'pago', 'erro', 'simulado_aprovado', 'simulado_negado']
    }
    app.save(fin)
  },
  (app) => {
    const so = app.findCollectionByNameOrId('service_orders')
    const fieldSo = so.fields.getByName('payment_status')
    if (fieldSo) {
      fieldSo.values = ['pago', 'pendente', 'vencido']
    }
    app.save(so)

    const fin = app.findCollectionByNameOrId('financials')
    const fieldFin = fin.fields.getByName('payment_status')
    if (fieldFin) {
      fieldFin.values = ['pendente', 'pago', 'erro']
    }
    app.save(fin)
  },
)
