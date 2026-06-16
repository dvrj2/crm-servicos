migrate(
  (app) => {
    const collection = new Collection({
      name: 'simulation_logs',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'action_type', type: 'text', required: true },
        { name: 'content', type: 'json', required: false },
        { name: 'event_source', type: 'text', required: true },
        { name: 'status', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_simlogs_action_type ON simulation_logs (action_type)',
        'CREATE INDEX idx_simlogs_created ON simulation_logs (created)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('simulation_logs')
    app.delete(collection)
  },
)
