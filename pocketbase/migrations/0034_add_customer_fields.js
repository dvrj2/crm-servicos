migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('customers')

    if (!col.fields.getByName('email')) {
      col.fields.add(new EmailField({ name: 'email', required: true }))
    }
    if (!col.fields.getByName('cpf_cnpj')) {
      col.fields.add(new TextField({ name: 'cpf_cnpj', required: true }))
    }
    app.save(col)

    try {
      col.addIndex('idx_customers_email', true, 'email', "email != ''")
      col.addIndex('idx_customers_cpf_cnpj', true, 'cpf_cnpj', "cpf_cnpj != ''")
      app.save(col)
    } catch (e) {
      console.log('Index creation failed, maybe duplicates exist', e.message)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('customers')
    col.removeIndex('idx_customers_email')
    col.removeIndex('idx_customers_cpf_cnpj')

    const emailField = col.fields.getByName('email')
    if (emailField) col.fields.removeById(emailField.id)

    const cpfCnpjField = col.fields.getByName('cpf_cnpj')
    if (cpfCnpjField) col.fields.removeById(cpfCnpjField.id)

    app.save(col)
  },
)
