onRecordValidate((e) => {
  const record = e.record

  if (record.getString('status') === 'concluído' || record.getString('status') === 'faturado') {
    if (!record.getString('signature')) {
      throw new BadRequestError('Não é possível concluir: falta assinatura do cliente.')
    }
    if (record.getBool('has_pending_checklist')) {
      throw new BadRequestError('Não é possível concluir: checklist possui pendências.')
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
