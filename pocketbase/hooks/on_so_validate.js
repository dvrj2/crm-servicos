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
    if (!record.getString('signature')) {
      throw new BadRequestError('Não é possível concluir: falta assinatura do cliente.')
    }

    if (record.getBool('has_pending_checklist')) {
      if (!record.getString('technical_observations')) {
        throw new BadRequestError(
          'Não é possível concluir: checklist possui pendências. Preencha as Observações Técnicas para justificar.',
        )
      } else {
        try {
          const log = new Record($app.findCollectionByNameOrId('automation_logs'))
          log.set('webhook_type', 'EXCEPTION')
          log.set('service_order', record.id)
          log.set(
            'action_taken',
            'Bypassed pending checklist using technical observations fallback',
          )
          log.set('result', 'Fallback applied')
          $app.save(log)
        } catch (err) {}
      }
    }

    try {
      const photos = $app.findRecordsByFilter(
        'service_order_photos',
        `service_order = '${record.id}'`,
        '',
        100,
        0,
      )
      const hasBefore = photos.some((p) => p.getString('stage') === 'before')
      const hasAfter = photos.some((p) => p.getString('stage') === 'after')
      if (!hasBefore || !hasAfter) {
        throw new BadRequestError(
          'Não é possível concluir: exigido ao menos uma foto de Antes e Depois.',
        )
      }
    } catch (err) {
      if (err.message && err.message.includes('exigido ao menos uma foto')) {
        throw err
      }
      throw new BadRequestError('Não é possível concluir: nenhuma foto encontrada.')
    }

    if (!record.getString('diagnosis') || !record.getString('activities_performed')) {
      throw new BadRequestError(
        'Não é possível concluir: relatório técnico incompleto (diagnóstico e atividades obrigatórios).',
      )
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
