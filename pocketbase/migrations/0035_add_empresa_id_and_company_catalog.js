migrate(
  (app) => {
    const empresariosColId = app.findCollectionByNameOrId('empresarios').id

    // 1. Add empresa_id to existing collections
    const collections = ['service_orders', 'tecnicos', 'customers', 'financials']
    for (const colName of collections) {
      const col = app.findCollectionByNameOrId(colName)
      if (!col.fields.getByName('empresa_id')) {
        col.fields.add(
          new RelationField({
            name: 'empresa_id',
            collectionId: empresariosColId,
            maxSelect: 1,
          }),
        )
        app.save(col)
      }
    }

    // 2. Create company_services
    if (!app.hasTable('company_services')) {
      const servicesCol = new Collection({
        name: 'company_services',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'description', type: 'text' },
          { name: 'base_price', type: 'number' },
          {
            name: 'empresa_id',
            type: 'relation',
            required: true,
            collectionId: empresariosColId,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(servicesCol)
    }

    // 3. Create company_materials
    if (!app.hasTable('company_materials')) {
      const materialsCol = new Collection({
        name: 'company_materials',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'unit_cost', type: 'number' },
          { name: 'stock_quantity', type: 'number' },
          {
            name: 'empresa_id',
            type: 'relation',
            required: true,
            collectionId: empresariosColId,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(materialsCol)
    }
  },
  (app) => {
    // Revert
  },
)
