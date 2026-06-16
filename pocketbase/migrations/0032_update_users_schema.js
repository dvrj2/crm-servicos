/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const empresarios = app.findCollectionByNameOrId('empresarios')
    const customers = app.findCollectionByNameOrId('customers')

    if (!users.fields.getByName('tipo_role')) {
      users.fields.add(
        new SelectField({
          name: 'tipo_role',
          values: ['admin', 'empresario', 'tecnico', 'cliente'],
          maxSelect: 1,
        }),
      )
    }

    if (!users.fields.getByName('empresa_id')) {
      users.fields.add(
        new RelationField({
          name: 'empresa_id',
          collectionId: empresarios.id,
          maxSelect: 1,
        }),
      )
    }

    if (!users.fields.getByName('cliente_id')) {
      users.fields.add(
        new RelationField({
          name: 'cliente_id',
          collectionId: customers.id,
          maxSelect: 1,
        }),
      )
    }

    if (!users.fields.getByName('ultimo_login')) {
      users.fields.add(
        new DateField({
          name: 'ultimo_login',
        }),
      )
    }

    if (!users.fields.getByName('ativo')) {
      users.fields.add(
        new BoolField({
          name: 'ativo',
        }),
      )
    }

    users.listRule = "id = @request.auth.id || @request.auth.tipo_role = 'admin'"
    users.viewRule = "id = @request.auth.id || @request.auth.tipo_role = 'admin'"
    users.updateRule = "id = @request.auth.id || @request.auth.tipo_role = 'admin'"
    users.deleteRule = "id = @request.auth.id || @request.auth.tipo_role = 'admin'"

    app.save(users)

    users.addIndex('idx_users_empresa_id', false, 'empresa_id', '')
    users.addIndex('idx_users_cliente_id', false, 'cliente_id', '')

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    users.fields.removeByName('tipo_role')
    users.fields.removeByName('empresa_id')
    users.fields.removeByName('cliente_id')
    users.fields.removeByName('ultimo_login')
    users.fields.removeByName('ativo')

    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.updateRule = 'id = @request.auth.id'
    users.deleteRule = 'id = @request.auth.id'

    users.removeIndex('idx_users_empresa_id')
    users.removeIndex('idx_users_cliente_id')

    app.save(users)
  },
)
