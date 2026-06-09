migrate(
  (app) => {
    const soCol = app.findCollectionByNameOrId('service_orders')
    if (!soCol.fields.getByName('ultimo_contato')) {
      soCol.fields.add(new DateField({ name: 'ultimo_contato' }))
    }

    const statusField = soCol.fields.getByName('status')
    const newStatuses = ['aguardando cliente', 'risco', 'faturado']
    for (const s of newStatuses) {
      if (!statusField.values.includes(s)) {
        statusField.values.push(s)
      }
    }
    app.save(soCol)

    const finCol = app.findCollectionByNameOrId('financials')
    const paymentField = finCol.fields.getByName('payment_status')
    if (!paymentField.values.includes('erro')) {
      paymentField.values.push('erro')
    }
    app.save(finCol)
  },
  (app) => {
    const soCol = app.findCollectionByNameOrId('service_orders')
    soCol.fields.removeByName('ultimo_contato')

    const statusField = soCol.fields.getByName('status')
    statusField.values = statusField.values.filter(
      (v) => !['aguardando cliente', 'risco', 'faturado'].includes(v),
    )
    app.save(soCol)

    const finCol = app.findCollectionByNameOrId('financials')
    const paymentField = finCol.fields.getByName('payment_status')
    paymentField.values = paymentField.values.filter((v) => v !== 'erro')
    app.save(finCol)
  },
)
