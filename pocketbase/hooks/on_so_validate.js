onRecordValidate((e) => {
  const record = e.record

  if (!record.id) {
    const customer = record.getString('customer')
    const serviceType = record.getString('service_type')
    if (customer && serviceType) {
      const fourHoursAgo = new Date(Date.now() - 4 * 3600000).toISOString()
      try {
        const duplicates = $app.findRecordsByFilter(
          'service_orders',
          `customer = '${customer}' && service_type = '${serviceType}' && created >= '${fourHoursAgo}'`,
          '',
          1,
          0,
        )
        if (duplicates.length > 0) {
          record.set('status', 'duplicado')
          record.set('parent_order', duplicates[0].id)
        }
      } catch (_) {}
    }
  }

  if (record.getString('status') === 'concluído' || record.getString('status') === 'faturado') {
    let checklists = []
    try {
      checklists = $app.findRecordsByFilter(
        'service_order_checklist_items',
        `service_order = '${record.id}'`,
        '',
        100,
        0,
      )
    } catch (_) {}

    if (checklists.length === 0) {
      throw new BadRequestError('Erro: O checklist não foi iniciado ou não existe para esta ordem')
    }

    const incomplete = checklists.some((c) => !c.getBool('is_completed'))
    if (incomplete) {
      throw new BadRequestError('Erro: Existem itens pendentes no checklist')
    }

    let photos = []
    try {
      photos = $app.findRecordsByFilter(
        'service_order_photos',
        `service_order = '${record.id}'`,
        '',
        100,
        0,
      )
    } catch (_) {}

    const hasBefore = photos.some((p) => p.getString('stage') === 'before')
    if (!hasBefore) {
      throw new BadRequestError("Erro: É obrigatório anexar fotos do estágio 'Antes'")
    }

    let hasSignature = !!record.getString('signature')
    if (!hasSignature) {
      try {
        const quotes = $app.findRecordsByFilter(
          'quotes',
          `service_order = '${record.id}'`,
          '',
          1,
          0,
        )
        if (quotes.length > 0) {
          const appts = $app.findRecordsByFilter(
            'appointments',
            `quote = '${quotes[0].id}'`,
            '',
            1,
            0,
          )
          if (appts.length > 0) {
            const execs = $app.findRecordsByFilter(
              'executions',
              `appointment = '${appts[0].id}'`,
              '',
              1,
              0,
            )
            if (execs.length > 0 && execs[0].getString('signature')) {
              hasSignature = true
            }
          }
        }
      } catch (_) {}
    }

    if (!hasSignature) {
      throw new BadRequestError('Erro: A assinatura do cliente/técnico é obrigatória')
    }
  }

  if (
    record.getString('status') === 'concluído' &&
    record.original().getString('status') !== 'concluído'
  ) {
    if (!record.getString('payment_link')) {
      record.set('payment_link', `https://pay.mock.com/${record.id}`)
    }
    if (!record.getFloat('actual_margin')) {
      const cost = (record.getFloat('actual_duration_hours') || 1) * 100
      const revenue = record.getFloat('final_value') || cost * 1.3
      if (revenue > 0) {
        record.set('actual_margin', ((revenue - cost) / revenue) * 100)
      }
    }
  }

  if (record.getString('payment_proof') && !record.original().getString('payment_proof')) {
    record.set('payment_status', 'pago')
  }

  e.next()
}, 'service_orders')
