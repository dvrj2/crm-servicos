migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.add(new NumberField({ name: 'capacity_diaria_hours' }))
    users.fields.add(new NumberField({ name: 'current_lat' }))
    users.fields.add(new NumberField({ name: 'current_lng' }))
    app.save(users)

    const os = app.findCollectionByNameOrId('service_orders')
    os.fields.add(new NumberField({ name: 'predicted_duration_hours' }))
    os.fields.add(new NumberField({ name: 'estimated_travel_hours' }))
    os.fields.add(new NumberField({ name: 'lat' }))
    os.fields.add(new NumberField({ name: 'lng' }))

    os.addIndex('idx_so_lat', false, 'lat', '')
    os.addIndex('idx_so_lng', false, 'lng', '')
    os.addIndex('idx_so_scheduled_date', false, 'scheduled_date', '')
    app.save(os)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('capacity_diaria_hours')
    users.fields.removeByName('current_lat')
    users.fields.removeByName('current_lng')
    app.save(users)

    const os = app.findCollectionByNameOrId('service_orders')
    os.removeIndex('idx_so_lat')
    os.removeIndex('idx_so_lng')
    os.removeIndex('idx_so_scheduled_date')
    os.fields.removeByName('predicted_duration_hours')
    os.fields.removeByName('estimated_travel_hours')
    os.fields.removeByName('lat')
    os.fields.removeByName('lng')
    app.save(os)
  },
)
