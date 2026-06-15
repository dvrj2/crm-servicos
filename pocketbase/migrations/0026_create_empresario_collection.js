migrate(
  (app) => {
    const collection = new Collection({
      name: 'empresarios',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'cpf_cnpj', type: 'text', required: true },
        { name: 'endereco', type: 'text' },
        { name: 'telefone', type: 'text' },
        { name: 'email', type: 'text', required: true },
        { name: 'certificacoes', type: 'text' },
        { name: 'area_de_atuacao', type: 'text' },
        { name: 'documento_identificacao', type: 'file', maxSelect: 1, maxSize: 5242880 },
        { name: 'registro_profissional', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_empresarios_cpf_cnpj ON empresarios (cpf_cnpj)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('empresarios')
    app.delete(collection)
  },
)
