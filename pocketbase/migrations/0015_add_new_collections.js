migrate(
  (app) => {
    const customers = new Collection({
      name: 'customers',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'phone', type: 'text' },
        { name: 'address', type: 'text' },
        { name: 'lat', type: 'number' },
        { name: 'lng', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ["CREATE UNIQUE INDEX idx_customers_phone ON customers (phone) WHERE phone != ''"],
    })
    app.save(customers)

    const soCol = app.findCollectionByNameOrId('service_orders')

    const quotes = new Collection({
      name: 'quotes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'service_order',
          type: 'relation',
          collectionId: soCol.id,
          required: true,
          maxSelect: 1,
        },
        { name: 'estimated_hours', type: 'number' },
        { name: 'materials', type: 'json' },
        { name: 'estimated_cost', type: 'number' },
        { name: 'suggested_margin', type: 'number' },
        { name: 'status', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(quotes)

    const appointments = new Collection({
      name: 'appointments',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'quote', type: 'relation', collectionId: quotes.id, maxSelect: 1 },
        { name: 'technician', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'start_time', type: 'date' },
        { name: 'predicted_duration', type: 'number' },
        { name: 'travel_time_min', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(appointments)

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.add(
      new SelectField({
        name: 'operational_status',
        values: ['available', 'en_route', 'busy'],
        maxSelect: 1,
      }),
    )
    app.save(users)

    soCol.fields.add(new NumberField({ name: 'sla_deadline_minutes' }))
    const urgencyField = soCol.fields.getByName('urgency')
    if (urgencyField) {
      urgencyField.selectValues = ['baixa', 'media', 'alta', 'critica']
    }
    app.save(soCol)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('appointments'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('quotes'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('customers'))
    } catch (_) {}
  },
)
