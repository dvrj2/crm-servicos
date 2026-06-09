/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const som = app.findCollectionByNameOrId('service_order_messages')

    const soField = som.fields.getByName('service_order')
    if (soField) soField.required = false

    const senderField = som.fields.getByName('sender')
    if (senderField) senderField.required = false

    app.save(som)

    const fin = app.findCollectionByNameOrId('financials')
    const execField = fin.fields.getByName('execution')
    if (execField) execField.required = false

    if (!fin.fields.getByName('service_order')) {
      fin.fields.add(
        new RelationField({
          name: 'service_order',
          collectionId: app.findCollectionByNameOrId('service_orders').id,
          maxSelect: 1,
        }),
      )
    }
    app.save(fin)
  },
  (app) => {
    const som = app.findCollectionByNameOrId('service_order_messages')
    const soField = som.fields.getByName('service_order')
    if (soField) soField.required = true
    const senderField = som.fields.getByName('sender')
    if (senderField) senderField.required = true
    app.save(som)

    const fin = app.findCollectionByNameOrId('financials')
    const execField = fin.fields.getByName('execution')
    if (execField) execField.required = true
    fin.fields.removeByName('service_order')
    app.save(fin)
  },
)
