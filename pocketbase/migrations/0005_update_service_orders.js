migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')
    col.fields.add(new DateField({ name: 'started_at' }))
    col.fields.add(new DateField({ name: 'finished_at' }))
    col.fields.add(new NumberField({ name: 'total_pause_time_minutes' }))
    col.fields.add(new TextField({ name: 'materials_used' }))
    col.fields.add(new TextField({ name: 'technical_observations' }))
    col.fields.add(
      new FileField({
        name: 'signature',
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
      }),
    )
    col.fields.add(new BoolField({ name: 'is_rework' }))
    col.fields.add(new NumberField({ name: 'total_distance_km' }))
    col.fields.add(
      new SelectField({
        name: 'operational_status',
        values: ['pending', 'en_route', 'in_progress', 'paused', 'completed'],
        maxSelect: 1,
      }),
    )
    col.fields.add(new DateField({ name: 'last_paused_at' }))
    col.fields.add(new NumberField({ name: 'actual_duration_hours' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')
    col.fields.removeByName('started_at')
    col.fields.removeByName('finished_at')
    col.fields.removeByName('total_pause_time_minutes')
    col.fields.removeByName('materials_used')
    col.fields.removeByName('technical_observations')
    col.fields.removeByName('signature')
    col.fields.removeByName('is_rework')
    col.fields.removeByName('total_distance_km')
    col.fields.removeByName('operational_status')
    col.fields.removeByName('last_paused_at')
    col.fields.removeByName('actual_duration_hours')
    app.save(col)
  },
)
