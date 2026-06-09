migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('users')

    let adminId = null
    try {
      const admin = app.findAuthRecordByEmail('users', 'valimreis@gmail.com')
      adminId = admin.id
    } catch (_) {
      const admin = new Record(usersCol)
      admin.setEmail('valimreis@gmail.com')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('name', 'Admin Valim')
      app.save(admin)
      adminId = admin.id
    }

    const customersCol = app.findCollectionByNameOrId('customers')

    const customersData = [
      { name: 'João Residencial', phone: '11999999991', tipo_cliente: 'residencial' },
      { name: 'Empresa Comercial', phone: '11999999992', tipo_cliente: 'comercial' },
      { name: 'Fábrica Industrial', phone: '11999999993', tipo_cliente: 'industrial' },
    ]

    const customerIds = []
    for (const cData of customersData) {
      let customerId
      try {
        const existing = app.findFirstRecordByData('customers', 'phone', cData.phone)
        customerId = existing.id
      } catch (_) {
        const record = new Record(customersCol)
        record.set('name', cData.name)
        record.set('phone', cData.phone)
        record.set('tipo_cliente', cData.tipo_cliente)
        app.save(record)
        customerId = record.id
      }
      customerIds.push(customerId)
    }

    const soCol = app.findCollectionByNameOrId('service_orders')
    const quotesCol = app.findCollectionByNameOrId('quotes')
    const apptsCol = app.findCollectionByNameOrId('appointments')
    const finsCol = app.findCollectionByNameOrId('financials')

    const now = new Date()
    const date5DaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()

    const ordersData = [
      {
        customer_idx: 0,
        service_type: 'Instalação Ar-Condicionado',
        status: 'concluído',
        payment_status: 'pago',
        final_value: 1500,
        planned_margin: 25,
        actual_margin: 28,
        is_recurring: false,
        payment_link: 'https://pay.example.com/1',
      },
      {
        customer_idx: 1,
        service_type: 'Manutenção Preventiva',
        status: 'concluído',
        payment_status: 'pago',
        final_value: 300,
        planned_margin: 40,
        actual_margin: 35,
        is_recurring: true,
        payment_link: 'https://pay.example.com/2',
      },
      {
        customer_idx: 2,
        service_type: 'Reparo de Máquina',
        status: 'concluído',
        payment_status: 'pendente',
        final_value: 2500,
        planned_margin: 20,
        actual_margin: 15,
        is_recurring: false,
        payment_link: 'https://pay.example.com/3',
      },
      {
        customer_idx: 1,
        service_type: 'Limpeza de Filtros',
        status: 'concluído',
        payment_status: 'pendente',
        final_value: 400,
        planned_margin: 30,
        actual_margin: 30,
        is_recurring: true,
        payment_link: 'https://pay.example.com/4',
      },
      {
        customer_idx: 0,
        service_type: 'Troca de Peças',
        status: 'concluído',
        payment_status: 'vencido',
        final_value: 800,
        planned_margin: 35,
        actual_margin: 10,
        is_recurring: false,
        payment_link: 'https://pay.example.com/5',
      },
    ]

    for (let i = 0; i < ordersData.length; i++) {
      const oData = ordersData[i]

      let soId
      try {
        const existing = app.findFirstRecordByData(
          'service_orders',
          'payment_link',
          oData.payment_link,
        )
        soId = existing.id
      } catch (_) {
        const so = new Record(soCol)
        so.set('customer', customerIds[oData.customer_idx])
        so.set('customer_name', customersData[oData.customer_idx].name)
        so.set('service_type', oData.service_type)
        so.set('status', 'em_andamento') // bypass hook validation temporariamente
        so.set('urgency', 'média')
        so.set('sla_deadline', date5DaysAgo)
        so.set('scheduled_date', date5DaysAgo)
        so.set('finished_at', date5DaysAgo)
        so.set('technician', adminId)
        so.set('payment_status', oData.payment_status)
        so.set('final_value', oData.final_value)
        so.set('planned_margin', oData.planned_margin)
        so.set('actual_margin', oData.actual_margin)
        so.set('is_recurring', oData.is_recurring)
        so.set('payment_link', oData.payment_link)
        app.save(so)
        soId = so.id

        if (oData.status === 'concluído') {
          app
            .db()
            .newQuery("UPDATE service_orders SET status = 'concluído' WHERE id = {:id}")
            .bind({ id: soId })
            .execute()
        }

        const quote = new Record(quotesCol)
        quote.set('service_order', soId)
        quote.set('estimated_cost', oData.final_value * 0.7)
        quote.set('suggested_margin', oData.planned_margin)
        quote.set('status', 'approved')
        app.save(quote)

        const appt = new Record(apptsCol)
        appt.set('quote', quote.id)
        appt.set('technician', adminId)
        appt.set('start_time', date5DaysAgo)
        appt.set('operation_status', 'agendado') // bypass hook validation
        app.save(appt)

        app
          .db()
          .newQuery("UPDATE appointments SET operation_status = 'concluido' WHERE id = {:id}")
          .bind({ id: appt.id })
          .execute()

        const execId = $security.randomString(15)
        app
          .db()
          .newQuery(
            `INSERT INTO executions (id, appointment, signature, materials_used, is_rework, created, updated) VALUES ({:id}, {:appt}, '', {:mat}, 0, {:now}, {:now})`,
          )
          .bind({
            id: execId,
            appt: appt.id,
            mat: JSON.stringify([{ name: 'Parafuso', quantity: 2 }]),
            now: date5DaysAgo.replace('T', ' '),
          })
          .execute()

        const fin = new Record(finsCol)
        fin.set('execution', execId)
        fin.set('final_value', oData.final_value)
        fin.set(
          'payment_status',
          oData.payment_status === 'vencido' ? 'pendente' : oData.payment_status,
        )
        fin.set('actual_margin', oData.actual_margin)
        fin.set('is_recurring', oData.is_recurring)
        app.save(fin)
      }
    }
  },
  (app) => {
    const links = [
      'https://pay.example.com/1',
      'https://pay.example.com/2',
      'https://pay.example.com/3',
      'https://pay.example.com/4',
      'https://pay.example.com/5',
    ]
    for (const link of links) {
      try {
        const so = app.findFirstRecordByData('service_orders', 'payment_link', link)
        app.delete(so)
      } catch (_) {}
    }
  },
)
