migrate(
  (app) => {
    const collection = new Collection({
      name: 'automation_logs',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'webhook_type', type: 'text', required: true },
        {
          name: 'service_order',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('service_orders').id,
        },
        { name: 'action_taken', type: 'text', required: true },
        { name: 'result', type: 'text', required: true },
        { name: 'details', type: 'json', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('automation_logs')
    app.delete(collection)
  },
)
