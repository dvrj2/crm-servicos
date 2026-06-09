onRecordDeleteRequest((e) => {
  const records = $app.findRecordsByFilter('executions', `appointment = '${e.record.id}'`, '', 1, 0)
  if (records.length > 0) {
    throw new BadRequestError(
      'Bloqueado: Não é possível excluir agendamento com execuções associadas.',
    )
  }
  e.next()
}, 'appointments')
