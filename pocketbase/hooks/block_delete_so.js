onRecordDeleteRequest((e) => {
  const quotes = $app.findRecordsByFilter('quotes', `service_order = '${e.record.id}'`, '', 1, 0)
  if (quotes.length > 0) {
    throw new BadRequestError('Bloqueado: Não é possível excluir OS com orçamentos associados.')
  }
  const fins = $app.findRecordsByFilter('financials', `service_order = '${e.record.id}'`, '', 1, 0)
  if (fins.length > 0) {
    throw new BadRequestError(
      'Bloqueado: Não é possível excluir OS com registros financeiros associados.',
    )
  }
  e.next()
}, 'service_orders')
