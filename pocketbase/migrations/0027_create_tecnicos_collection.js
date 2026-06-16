migrate(
  (app) => {
    const collection = new Collection({
      name: 'tecnicos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'cpf', type: 'text', required: true },
        { name: 'telefone', type: 'text' },
        { name: 'email', type: 'email', required: true },
        { name: 'regiao', type: 'text' },
        { name: 'certificacoes', type: 'text' },
        { name: 'capacidade_diaria_hours', type: 'number' },
        { name: 'ocupacao_atual_horas', type: 'number' },
        {
          name: 'status',
          type: 'select',
          values: ['disponível', 'a caminho', 'em serviço'],
          maxSelect: 1,
        },
        { name: 'habilidades', type: 'text' },
        { name: 'custo_hora', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_tecnicos_cpf ON tecnicos (cpf)',
        'CREATE INDEX idx_tecnicos_status ON tecnicos (status)',
        'CREATE INDEX idx_tecnicos_regiao ON tecnicos (regiao)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('tecnicos')
    app.delete(collection)
  },
)
