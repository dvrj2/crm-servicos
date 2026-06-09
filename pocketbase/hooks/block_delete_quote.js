onRecordDeleteRequest((e) => {
  const records = $app.findRecordsByFilter('appointments', `quote = '${e.record.id}'`, '', 1, 0)
  if (records.length > 0) {
    throw new BadRequestError(
      'Bloqueado: Não é possível excluir orçamento com agendamentos associados.',
    )
  }
  e.next()
}, 'quotes')
