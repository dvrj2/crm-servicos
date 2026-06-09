migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')
    if (!col.fields.getByName('diagnosis')) {
      col.fields.add(new TextField({ name: 'diagnosis' }))
    }
    if (!col.fields.getByName('activities_performed')) {
      col.fields.add(new TextField({ name: 'activities_performed' }))
    }
    if (!col.fields.getByName('current_condition')) {
      col.fields.add(new TextField({ name: 'current_condition' }))
    }
    if (!col.fields.getByName('recommendations')) {
      col.fields.add(new TextField({ name: 'recommendations' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')
    col.fields.removeByName('diagnosis')
    col.fields.removeByName('activities_performed')
    col.fields.removeByName('current_condition')
    col.fields.removeByName('recommendations')
    app.save(col)
  },
)
