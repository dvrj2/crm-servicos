migrate(
  (app) => {
    const soCol = app.findCollectionByNameOrId('service_orders')
    if (!soCol.fields.getByName('is_recurring')) {
      soCol.fields.add(new BoolField({ name: 'is_recurring' }))
    }
    app.save(soCol)

    const fbCol = new Collection({
      name: 'service_feedback',
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
          collectionId: soCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'nps_score', type: 'number', required: true, min: 0, max: 10 },
        { name: 'complaint_description', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_sf_so ON service_feedback (service_order)'],
    })
    app.save(fbCol)
  },
  (app) => {
    const fbCol = app.findCollectionByNameOrId('service_feedback')
    app.delete(fbCol)
    const soCol = app.findCollectionByNameOrId('service_orders')
    soCol.fields.removeByName('is_recurring')
    app.save(soCol)
  },
)
