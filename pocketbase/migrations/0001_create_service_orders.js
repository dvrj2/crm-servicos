migrate(
  (app) => {
    const collection = new Collection({
      name: 'service_orders',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'customer_name', type: 'text', required: true },
        { name: 'service_type', type: 'text', required: true },
        {
          name: 'urgency',
          type: 'select',
          values: ['baixa', 'media', 'alta'],
          required: true,
          maxSelect: 1,
        },
        { name: 'sla_deadline', type: 'date', required: true },
        {
          name: 'technician',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'scheduled_date', type: 'date' },
        { name: 'region', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: [
            'novo',
            'qualificado',
            'orcamento',
            'aprovado',
            'agendado',
            'execucao',
            'concluido',
            'faturado',
          ],
          required: true,
          maxSelect: 1,
        },
        { name: 'has_pending_checklist', type: 'bool' },
        { name: 'description', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_so_status ON service_orders (status)',
        'CREATE INDEX idx_so_region ON service_orders (region)',
        'CREATE INDEX idx_so_technician ON service_orders (technician)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('service_orders')
    app.delete(collection)
  },
)
