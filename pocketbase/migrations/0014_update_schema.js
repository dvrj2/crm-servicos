migrate((app) => {
  const users = app.findCollectionByNameOrId('users')
  if (!users.fields.getByName('region')) {
    users.fields.add(new TextField({ name: 'region' }))
    users.fields.add(new TextField({ name: 'certifications' }))
    users.fields.add(
      new SelectField({ name: 'status', values: ['active', 'inactive'], maxSelect: 1 }),
    )
    app.save(users)
  }

  const so = app.findCollectionByNameOrId('service_orders')
  if (!so.fields.getByName('origin')) {
    so.fields.add(new TextField({ name: 'origin' }))
    so.fields.add(new TextField({ name: 'category' }))
    so.fields.add(new TextField({ name: 'estimated_materials' }))
    so.fields.add(new NumberField({ name: 'suggested_price' }))
    so.fields.add(new NumberField({ name: 'displacement_min' }))
    so.fields.add(new TextField({ name: 'technical_report' }))
    so.fields.add(new TextField({ name: 'recurrence_config' }))
    app.save(so)
  }
})
