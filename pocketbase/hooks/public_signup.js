routerAdd('POST', '/backend/v1/signup', (e) => {
  const body = e.requestInfo().body || {}
  const name = (body.name || '').trim()
  const email = (body.email || '').trim()
  const password = body.password || ''
  const cpfCnpj = (body.cpf_cnpj || '').trim()
  const tipoPerfil = body.tipo_perfil // 'Prestador' | 'Cliente'

  const errors = {}
  if (!name) errors.name = new ValidationError('validation_required', 'Nome é obrigatório')
  if (!email) {
    errors.email = new ValidationError('validation_required', 'Email é obrigatório')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = new ValidationError('validation_invalid_email', 'Email inválido')
  }
  if (password.length < 8)
    errors.password = new ValidationError(
      'validation_length',
      'Senha deve ter no mínimo 8 caracteres',
    )
  if (!cpfCnpj)
    errors.cpf_cnpj = new ValidationError('validation_required', 'CPF/CNPJ é obrigatório')
  if (tipoPerfil !== 'Prestador' && tipoPerfil !== 'Cliente') {
    errors.tipo_perfil = new ValidationError(
      'validation_invalid',
      'Tipo de perfil deve ser Prestador ou Cliente',
    )
  }

  if (Object.keys(errors).length > 0) {
    throw new BadRequestError('Dados inválidos', errors)
  }

  let record = null

  try {
    $app.runInTransaction((txApp) => {
      try {
        txApp.findAuthRecordByEmail('users', email)
        throw new Error('EMAIL_EXISTS')
      } catch (err) {
        if (err.message === 'EMAIL_EXISTS') throw err
      }

      try {
        if (tipoPerfil === 'Prestador') {
          txApp.findFirstRecordByData('empresarios', 'cpf_cnpj', cpfCnpj)
          throw new Error('CPF_CNPJ_EXISTS')
        } else {
          txApp.findFirstRecordByData('customers', 'cpf_cnpj', cpfCnpj)
          throw new Error('CPF_CNPJ_EXISTS')
        }
      } catch (err) {
        if (err.message === 'CPF_CNPJ_EXISTS') throw err
      }

      let relatedId = ''
      if (tipoPerfil === 'Prestador') {
        const col = txApp.findCollectionByNameOrId('empresarios')
        const emp = new Record(col)
        emp.set('nome', name)
        emp.set('email', email)
        emp.set('cpf_cnpj', cpfCnpj)
        txApp.save(emp)
        relatedId = emp.id
      } else {
        const col = txApp.findCollectionByNameOrId('customers')
        const cust = new Record(col)
        cust.set('name', name)
        cust.set('email', email)
        cust.set('cpf_cnpj', cpfCnpj)
        cust.set('tipo_cliente', cpfCnpj.length > 14 ? 'comercial' : 'residencial')
        txApp.save(cust)
        relatedId = cust.id
      }

      const usersCol = txApp.findCollectionByNameOrId('users')
      const user = new Record(usersCol)
      user.set('name', name)
      user.setEmail(email)
      user.setPassword(password)
      user.set('ativo', true)

      if (tipoPerfil === 'Prestador') {
        user.set('tipo_role', 'empresario')
        user.set('empresa_id', relatedId)
      } else {
        user.set('tipo_role', 'cliente')
        user.set('cliente_id', relatedId)
      }

      txApp.save(user)
      record = user
    })
  } catch (err) {
    if (err.message === 'EMAIL_EXISTS') {
      throw new BadRequestError('Email já cadastrado', {
        email: new ValidationError('validation_invalid', 'Email já cadastrado'),
      })
    }
    if (err.message === 'CPF_CNPJ_EXISTS') {
      throw new BadRequestError('CPF/CNPJ já cadastrado', {
        cpf_cnpj: new ValidationError('validation_invalid', 'CPF/CNPJ já cadastrado'),
      })
    }
    throw err
  }

  return $apis.recordAuthResponse(e, record)
})
