migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('service_order_photos')
    col.viewRule = ''
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('service_order_photos')
    col.viewRule = "@request.auth.id != ''"
    app.save(col)
  },
)
