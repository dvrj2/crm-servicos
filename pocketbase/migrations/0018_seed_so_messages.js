migrate(
  (app) => {
    try {
      const orders = app.findRecordsByFilter('service_orders', "status != ''", '-created', 1, 0)
      if (orders && orders.length > 0) {
        const order = orders[0]

        const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'valimreis@gmail.com')

        const msgCol = app.findCollectionByNameOrId('service_order_messages')

        const msg1 = new Record(msgCol)
        msg1.set('service_order', order.id)
        msg1.set('sender', admin.id)
        msg1.set(
          'message',
          'Cliente entrou em contato relatando o problema inicial. Aguardando mais detalhes.',
        )
        app.save(msg1)

        const msg2 = new Record(msgCol)
        msg2.set('service_order', order.id)
        msg2.set('sender', admin.id)
        msg2.set(
          'message',
          'Fotos iniciais recebidas, repassando para análise técnica do problema reportado.',
        )
        app.save(msg2)
      }
    } catch (e) {
      console.log('Error seeding so messages:', e)
    }
  },
  (app) => {
    try {
      app.db().newQuery('DELETE FROM service_order_messages').execute()
    } catch (e) {}
  },
)
