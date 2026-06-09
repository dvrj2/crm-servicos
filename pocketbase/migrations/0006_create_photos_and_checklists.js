migrate(
  (app) => {
    const serviceOrdersColId = app.findCollectionByNameOrId('service_orders').id

    const photos = new Collection({
      name: 'service_order_photos',
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
          required: true,
          collectionId: serviceOrdersColId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'file',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        {
          name: 'stage',
          type: 'select',
          required: true,
          values: ['before', 'after'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(photos)

    const checklists = new Collection({
      name: 'service_order_checklist_items',
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
          required: true,
          collectionId: serviceOrdersColId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'task_description', type: 'text', required: true },
        { name: 'is_completed', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(checklists)
  },
  (app) => {
    const photos = app.findCollectionByNameOrId('service_order_photos')
    app.delete(photos)
    const checklists = app.findCollectionByNameOrId('service_order_checklist_items')
    app.delete(checklists)
  },
)
