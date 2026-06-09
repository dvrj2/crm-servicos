migrate(
  (app) => {
    const collection = new Collection({
      name: 'service_order_messages',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && sender = @request.auth.id",
      deleteRule: "@request.auth.id != '' && sender = @request.auth.id",
      fields: [
        {
          name: 'service_order',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('service_orders').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'sender',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'message', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_so_msg_order ON service_order_messages (service_order)',
        'CREATE INDEX idx_so_msg_sender ON service_order_messages (sender)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('service_order_messages')
    app.delete(collection)
  },
)
