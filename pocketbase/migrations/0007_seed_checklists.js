migrate(
  (app) => {
    try {
      const orders = app.findRecordsByFilter('service_orders', "status != 'concluido'", '', 10, 0)
      const checklists = app.findCollectionByNameOrId('service_order_checklist_items')

      for (const order of orders) {
        const items = [
          'Isolar área de trabalho',
          'Verificar ferramentas necessárias',
          'Testar equipamento após conserto',
        ]
        for (const item of items) {
          const record = new Record(checklists)
          record.set('service_order', order.id)
          record.set('task_description', item)
          record.set('is_completed', false)
          app.save(record)
        }
      }
    } catch (e) {
      // Ignore if no records are found
    }
  },
  (app) => {
    try {
      const checklists = app.findCollectionByNameOrId('service_order_checklist_items')
      app.truncateCollection(checklists)
    } catch (e) {
      // Ignore
    }
  },
)
