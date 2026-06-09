onRecordDeleteRequest((e) => {
  const records = $app.findRecordsByFilter('financials', `execution = '${e.record.id}'`, '', 1, 0)
  if (records.length > 0) {
    throw new BadRequestError(
      'Bloqueado: Não é possível excluir execução com registros financeiros associados.',
    )
  }
  e.next()
}, 'executions')
