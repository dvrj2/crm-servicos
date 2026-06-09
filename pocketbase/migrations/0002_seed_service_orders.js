migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let admin
    try {
      admin = app.findAuthRecordByEmail('_pb_users_auth_', 'valimreis@gmail.com')
    } catch (_) {
      admin = new Record(users)
      admin.setEmail('valimreis@gmail.com')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('name', 'Admin Técnico')
      app.save(admin)
    }

    const soCol = app.findCollectionByNameOrId('service_orders')
    if (app.countRecords('service_orders') > 0) return

    const orders = [
      {
        customer: 'Construtora Alfa',
        type: 'Instalação Elétrica',
        urgency: 'media',
        status: 'novo',
        region: 'Zona Sul',
        checklist: false,
      },
      {
        customer: 'João Silva',
        type: 'Manutenção de AC',
        urgency: 'alta',
        status: 'qualificado',
        region: 'Centro',
        checklist: true,
      },
      {
        customer: 'Condomínio Flores',
        type: "Limpeza de Caixa D'água",
        urgency: 'baixa',
        status: 'orcamento',
        region: 'Zona Norte',
        checklist: false,
      },
      {
        customer: 'Padaria Pão Quente',
        type: 'Reparo de Forno',
        urgency: 'alta',
        status: 'aprovado',
        region: 'Zona Leste',
        checklist: true,
      },
      {
        customer: 'Empresa Beta',
        type: 'Cabeamento de Rede',
        urgency: 'media',
        status: 'agendado',
        region: 'Centro',
        checklist: true,
      },
      {
        customer: 'Clínica Saúde',
        type: 'Manutenção Preventiva',
        urgency: 'alta',
        status: 'execucao',
        region: 'Zona Sul',
        checklist: true,
      },
      {
        customer: 'Restaurante Sabor',
        type: 'Manutenção Exaustor',
        urgency: 'alta',
        status: 'execucao',
        region: 'Zona Sul',
        checklist: true,
      },
      {
        customer: 'Supermercado XYZ',
        type: 'Troca de Lâmpadas',
        urgency: 'baixa',
        status: 'concluido',
        region: 'Zona Oeste',
        checklist: false,
      },
      {
        customer: 'Escola Aprender',
        type: 'Instalação de Projetor',
        urgency: 'media',
        status: 'faturado',
        region: 'Centro',
        checklist: false,
      },
      {
        customer: 'Hotel Estrela',
        type: 'Reparo Hidráulico',
        urgency: 'alta',
        status: 'novo',
        region: 'Zona Leste',
        checklist: true,
      },
    ]

    const now = new Date()

    orders.forEach((o, i) => {
      const record = new Record(soCol)
      record.set('customer_name', o.customer)
      record.set('service_type', o.type)
      record.set('urgency', o.urgency)

      const deadline = new Date(now.getTime() + (i - 4) * 2 * 60 * 60 * 1000)
      record.set('sla_deadline', deadline.toISOString().replace('T', ' '))

      if (o.status !== 'novo' && o.status !== 'qualificado' && o.status !== 'orcamento') {
        record.set('technician', admin.id)
        record.set(
          'scheduled_date',
          new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' '),
        )
      }

      record.set('region', o.region)
      record.set('status', o.status)
      record.set('has_pending_checklist', o.checklist)
      record.set(
        'description',
        'Descrição detalhada do serviço para ' +
          o.customer +
          '. Favor verificar todos os requisitos de segurança antes de iniciar.',
      )

      app.save(record)
    })
  },
  (app) => {
    app.truncateCollection(app.findCollectionByNameOrId('service_orders'))
  },
)
