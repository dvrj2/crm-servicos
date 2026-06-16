migrate(
  (app) => {
    const collection = new Collection({
      name: 'system_settings',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'key', type: 'text', required: true },
        { name: 'value', type: 'json', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_sys_settings_key ON system_settings (key)'],
    })
    app.save(collection)

    // Seed sandbox mode
    const record = new Record(collection)
    record.set('key', 'sandbox_mode')
    record.set('value', { enabled: false })
    app.save(record)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('system_settings')
    app.delete(collection)
  },
)
