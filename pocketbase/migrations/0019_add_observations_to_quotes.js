migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('quotes')
    if (!col.fields.getByName('observations')) {
      col.fields.add(new TextField({ name: 'observations', required: false }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('quotes')
    if (col.fields.getByName('observations')) {
      col.fields.removeByName('observations')
    }
    app.save(col)
  },
)
