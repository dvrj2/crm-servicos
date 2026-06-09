onRecordValidate((e) => {
  const record = e.record

  if (record.getString('status') === 'faturado') {
    if (
      !record.getString('diagnosis') ||
      !record.getString('activities_performed') ||
      !record.getString('signature') ||
      record.getBool('has_pending_checklist')
    ) {
      throw new BadRequestError(
        'Não é possível faturar: relatório técnico incompleto ou há pendências no checklist.',
      )
    }
  }

  if (record.getString('payment_proof') && !record.original().getString('payment_proof')) {
    record.set('payment_status', 'pago')
  }

  e.next()
}, 'service_orders')
