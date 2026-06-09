/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const os = app.findCollectionByNameOrId('service_orders')
    const statusField = os.fields.getByName('status')
    statusField.values = [
      'novo',
      'qualificado',
      'orçamento',
      'aprovado',
      'agendado',
      'executando',
      'concluído',
      'cancelado',
      'duplicado',
    ]

    if (!os.fields.getByName('parent_order')) {
      os.fields.add(
        new RelationField({
          name: 'parent_order',
          collectionId: os.id,
          maxSelect: 1,
        }),
      )
    }
    app.save(os)
  },
  (app) => {
    const os = app.findCollectionByNameOrId('service_orders')
    const statusField = os.fields.getByName('status')
    statusField.values = [
      'novo',
      'qualificado',
      'orçamento',
      'aprovado',
      'agendado',
      'executando',
      'concluído',
    ]
    os.fields.removeByName('parent_order')
    app.save(os)
  },
)
