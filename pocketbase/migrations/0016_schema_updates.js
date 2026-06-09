migrate(
  (app) => {
    const customers = app.findCollectionByNameOrId('customers')
    if (!customers.fields.getByName('tipo_cliente')) {
      customers.fields.add(
        new SelectField({
          name: 'tipo_cliente',
          values: ['residencial', 'comercial', 'industrial'],
        }),
      )
    }
    app.save(customers)

    const serviceOrders = app.findCollectionByNameOrId('service_orders')
    if (!serviceOrders.fields.getByName('customer')) {
      serviceOrders.fields.add(
        new RelationField({
          name: 'customer',
          collectionId: customers.id,
          maxSelect: 1,
        }),
      )
    }

    const originField = serviceOrders.fields.getByName('origin')
    if (originField && originField.type === 'text') {
      serviceOrders.fields.removeByName('origin')
      serviceOrders.fields.add(
        new SelectField({
          name: 'origin',
          values: ['whatsapp', 'site', 'outros'],
        }),
      )
    }

    if (!serviceOrders.fields.getByName('photos')) {
      serviceOrders.fields.add(
        new FileField({
          name: 'photos',
          maxSelect: 10,
          maxSize: 52428800,
        }),
      )
    }

    const urgencyField = serviceOrders.fields.getByName('urgency')
    if (urgencyField) {
      urgencyField.values = ['baixa', 'média', 'crítica']
    }

    const statusField = serviceOrders.fields.getByName('status')
    if (statusField) {
      statusField.values = [
        'novo',
        'qualificado',
        'orçamento',
        'aprovado',
        'agendado',
        'executando',
        'concluído',
      ]
    }

    app.save(serviceOrders)

    const quotes = app.findCollectionByNameOrId('quotes')
    if (!quotes.fields.getByName('suggested_price')) {
      quotes.fields.add(new NumberField({ name: 'suggested_price' }))
    }
    const quotesStatusField = quotes.fields.getByName('status')
    if (quotesStatusField && quotesStatusField.type === 'text') {
      quotes.fields.removeByName('status')
      quotes.fields.add(
        new SelectField({
          name: 'status',
          values: ['analise', 'enviado', 'aguardando', 'aprovado', 'reprovado'],
        }),
      )
    }
    app.save(quotes)

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('occupancy_current_hours')) {
      users.fields.add(new NumberField({ name: 'occupancy_current_hours' }))
    }
    const usersStatusField = users.fields.getByName('status')
    if (usersStatusField) {
      usersStatusField.values = ['disponível', 'em rota', 'ocupado']
    }
    app.save(users)

    const appointments = app.findCollectionByNameOrId('appointments')
    if (!appointments.fields.getByName('operation_status')) {
      appointments.fields.add(
        new SelectField({
          name: 'operation_status',
          values: ['pendente', 'a_caminho', 'em_execucao', 'concluido'],
        }),
      )
    }
    app.save(appointments)

    try {
      app.findCollectionByNameOrId('executions')
    } catch (_) {
      const executions = new Collection({
        name: 'executions',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'appointment',
            type: 'relation',
            required: true,
            collectionId: appointments.id,
            maxSelect: 1,
          },
          { name: 'checklist', type: 'json' },
          { name: 'photos_before', type: 'file', maxSelect: 10, maxSize: 52428800 },
          { name: 'photos_after', type: 'file', maxSelect: 10, maxSize: 52428800 },
          { name: 'signature', type: 'file', required: true, maxSelect: 1, maxSize: 5242880 },
          { name: 'materials_used', type: 'json' },
          { name: 'technical_report', type: 'text' },
          { name: 'is_rework', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(executions)
    }

    try {
      app.findCollectionByNameOrId('financials')
    } catch (_) {
      const financials = new Collection({
        name: 'financials',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'execution',
            type: 'relation',
            required: true,
            collectionId: app.findCollectionByNameOrId('executions').id,
            maxSelect: 1,
          },
          { name: 'final_value', type: 'number' },
          { name: 'payment_status', type: 'select', values: ['pendente', 'pago'] },
          { name: 'payment_method', type: 'text' },
          { name: 'average_ticket', type: 'number' },
          { name: 'actual_margin', type: 'number' },
          { name: 'is_recurring', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(financials)
    }
  },
  (app) => {
    // down migration
  },
)
