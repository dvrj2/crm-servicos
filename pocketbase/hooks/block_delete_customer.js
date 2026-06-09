onRecordDeleteRequest((e) => {
  const records = $app.findRecordsByFilter(
    'service_orders',
    `customer = '${e.record.id}'`,
    '',
    1,
    0,
  )
  if (records.length > 0) {
    throw new BadRequestError(
      'Bloqueado: Não é possível excluir cliente com ordens de serviço associadas. A exclusão deve ser feita na ordem reversa.',
    )
  }
  e.next()
}, 'customers')
