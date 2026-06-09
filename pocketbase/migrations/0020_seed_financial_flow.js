migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('users')

    let tech1Id = null
    let tech2Id = null
    try {
      const tech1 = app.findAuthRecordByEmail('users', 'valimreis@gmail.com')
      tech1Id = tech1.id
    } catch (_) {
      const tech1 = new Record(usersCol)
      tech1.setEmail('valimreis@gmail.com')
      tech1.setPassword('Skip@Pass')
      tech1.setVerified(true)
      tech1.set('name', 'Admin Valim')
      app.save(tech1)
      tech1Id = tech1.id
    }

    try {
      const tech2 = app.findAuthRecordByEmail('users', 'tech2@example.com')
      tech2Id = tech2.id
    } catch (_) {
      const tech2 = new Record(usersCol)
      tech2.setEmail('tech2@example.com')
      tech2.setPassword('Skip@Pass')
      tech2.setVerified(true)
      tech2.set('name', 'Técnico Secundário')
      app.save(tech2)
      tech2Id = tech2.id
    }

    const customersCol = app.findCollectionByNameOrId('customers')

    const customersData = [
      { name: 'João Residencial', phone: '11999999991', tipo_cliente: 'residencial' },
      { name: 'Empresa Comercial', phone: '11999999992', tipo_cliente: 'comercial' },
      { name: 'Fábrica Industrial', phone: '11999999993', tipo_cliente: 'industrial' },
      { name: 'Condomínio das Flores', phone: '11999999994', tipo_cliente: 'comercial' },
      { name: 'Maria da Silva', phone: '11999999995', tipo_cliente: 'residencial' },
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
    const finsCol = app.findCollectionByNameOrId('financials')

    const now = new Date()
    const getPastDate = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

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
        tech_idx: 0,
        days_ago: 5,
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
        tech_idx: 1,
        days_ago: 2,
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
        tech_idx: 0,
        days_ago: 1,
      },
      {
        customer_idx: 3,
        service_type: 'Limpeza de Filtros',
        status: 'concluído',
        payment_status: 'pendente',
        final_value: 400,
        planned_margin: 30,
        actual_margin: 30,
        is_recurring: true,
        payment_link: 'https://pay.example.com/4',
        tech_idx: 1,
        days_ago: 10,
      },
      {
        customer_idx: 4,
        service_type: 'Troca de Peças',
        status: 'concluído',
        payment_status: 'vencido',
        final_value: 800,
        planned_margin: 35,
        actual_margin: 10,
        is_recurring: false,
        payment_link: 'https://pay.example.com/5',
        tech_idx: 0,
        days_ago: 15,
      },
      {
        customer_idx: 0,
        service_type: 'Manutenção Preventiva',
        status: 'concluído',
        payment_status: 'pago',
        final_value: 350,
        planned_margin: 40,
        actual_margin: 42,
        is_recurring: true,
        payment_link: 'https://pay.example.com/6',
        tech_idx: 1,
        days_ago: 8,
      },
      {
        customer_idx: 1,
        service_type: 'Instalação Ar-Condicionado',
        status: 'concluído',
        payment_status: 'vencido',
        final_value: 1200,
        planned_margin: 25,
        actual_margin: 20,
        is_recurring: false,
        payment_link: 'https://pay.example.com/7',
        tech_idx: 0,
        days_ago: 20,
      },
      {
        customer_idx: 2,
        service_type: 'Limpeza de Filtros',
        status: 'concluído',
        payment_status: 'pago',
        final_value: 450,
        planned_margin: 30,
        actual_margin: 32,
        is_recurring: true,
        payment_link: 'https://pay.example.com/8',
        tech_idx: 1,
        days_ago: 3,
      },
      {
        customer_idx: 3,
        service_type: 'Reparo de Máquina',
        status: 'concluído',
        payment_status: 'pago',
        final_value: 2800,
        planned_margin: 20,
        actual_margin: 22,
        is_recurring: false,
        payment_link: 'https://pay.example.com/9',
        tech_idx: 0,
        days_ago: 4,
      },
      {
        customer_idx: 4,
        service_type: 'Troca de Peças',
        status: 'concluído',
        payment_status: 'pendente',
        final_value: 900,
        planned_margin: 35,
        actual_margin: 30,
        is_recurring: false,
        payment_link: 'https://pay.example.com/10',
        tech_idx: 1,
        days_ago: 6,
      },
    ]

    const techs = [tech1Id, tech2Id]

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
        so.set('status', 'novo')
        so.set('urgency', 'média')
        so.set('sla_deadline', getPastDate(oData.days_ago))
        so.set('scheduled_date', getPastDate(oData.days_ago))
        so.set('finished_at', getPastDate(oData.days_ago))
        so.set('technician', techs[oData.tech_idx])
        so.set('payment_status', oData.payment_status)
        so.set('final_value', oData.final_value)
        so.set('planned_margin', oData.planned_margin)
        so.set('actual_margin', oData.actual_margin)
        so.set('is_recurring', oData.is_recurring)
        so.set('payment_link', oData.payment_link)
        app.save(so)
        soId = so.id

        app
          .db()
          .newQuery(
            "UPDATE service_orders SET status = {:status}, signature = 'fake.png' WHERE id = {:id}",
          )
          .bind({ status: oData.status, id: soId })
          .execute()

        const quotesCol = app.findCollectionByNameOrId('quotes')
        const quote = new Record(quotesCol)
        quote.set('service_order', soId)
        quote.set('status', 'approved')
        app.save(quote)

        const apptsCol = app.findCollectionByNameOrId('appointments')
        const appt = new Record(apptsCol)
        appt.set('quote', quote.id)
        appt.set('technician', techs[oData.tech_idx])
        appt.set('operation_status', 'pendente')
        app.save(appt)

        app
          .db()
          .newQuery("UPDATE appointments SET operation_status = 'concluido' WHERE id = {:id}")
          .bind({ id: appt.id })
          .execute()

        const execId = $security.randomString(15)
        const dateStr = getPastDate(oData.days_ago).replace('T', ' ')
        app
          .db()
          .newQuery(
            `INSERT INTO executions (id, appointment, signature, materials_used, is_rework, created, updated) VALUES ({:id}, {:appt}, 'fake.png', '', 0, {:now}, {:now})`,
          )
          .bind({
            id: execId,
            appt: appt.id,
            now: dateStr,
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
    const links = []
    for (let i = 1; i <= 10; i++) links.push(`https://pay.example.com/${i}`)

    for (const link of links) {
      try {
        const so = app.findFirstRecordByData('service_orders', 'payment_link', link)
        app.delete(so)
      } catch (_) {}
    }
  },
)
