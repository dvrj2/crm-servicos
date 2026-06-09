migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')

    if (!col.fields.getByName('final_value')) {
      col.fields.add(new NumberField({ name: 'final_value' }))
    }
    if (!col.fields.getByName('payment_status')) {
      col.fields.add(
        new SelectField({
          name: 'payment_status',
          values: ['pago', 'pendente', 'vencido'],
          maxSelect: 1,
          required: true,
        }),
      )
    }
    if (!col.fields.getByName('payment_link')) {
      col.fields.add(new TextField({ name: 'payment_link' }))
    }
    if (!col.fields.getByName('planned_margin')) {
      col.fields.add(new NumberField({ name: 'planned_margin' }))
    }
    if (!col.fields.getByName('actual_margin')) {
      col.fields.add(new NumberField({ name: 'actual_margin' }))
    }
    if (!col.fields.getByName('payment_proof')) {
      col.fields.add(new FileField({ name: 'payment_proof', maxSelect: 1, maxSize: 5242880 }))
    }
    if (!col.fields.getByName('customer_delays_count')) {
      col.fields.add(new NumberField({ name: 'customer_delays_count' }))
    }

    col.addIndex('idx_so_payment_status', false, 'payment_status', '')
    col.addIndex('idx_so_actual_margin', false, 'actual_margin', '')
    col.addIndex('idx_so_finished_at', false, 'finished_at', '')

    app.save(col)

    app
      .db()
      .newQuery(
        "UPDATE service_orders SET payment_status = 'pendente' WHERE payment_status = '' OR payment_status IS NULL",
      )
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')
    col.fields.removeByName('final_value')
    col.fields.removeByName('payment_status')
    col.fields.removeByName('payment_link')
    col.fields.removeByName('planned_margin')
    col.fields.removeByName('actual_margin')
    col.fields.removeByName('payment_proof')
    col.fields.removeByName('customer_delays_count')
    col.removeIndex('idx_so_payment_status')
    col.removeIndex('idx_so_actual_margin')
    col.removeIndex('idx_so_finished_at')
    app.save(col)
  },
)
