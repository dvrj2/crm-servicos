migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    try {
      app.findAuthRecordByEmail('users', 'valimreis@gmail.com')
      return // already seeded
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('valimreis@gmail.com')
    record.setPassword('Skip@Pass')
    record.setVerified(true)
    record.set('name', 'Admin')
    record.set('tipo_role', 'admin')
    record.set('ativo', true)

    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'valimreis@gmail.com')
      app.delete(record)
    } catch (_) {}
  },
)
