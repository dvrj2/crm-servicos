routerAdd('POST', '/backend/v1/webhook/nps-feedback-received', (e) => {
  const body = e.requestInfo().body || {}
  const soId = body.service_order
  const score = body.score
  const description = body.description || ''

  if (!soId || typeof score !== 'number') return e.badRequestError('Missing service_order or score')

  try {
    const feedback = new Record($app.findCollectionByNameOrId('service_feedback'))
    feedback.set('service_order', soId)
    feedback.set('nps_score', score)
    feedback.set('complaint_description', description)
    $app.save(feedback)

    const log = new Record($app.findCollectionByNameOrId('automation_logs'))
    log.set('webhook_type', 'NPS_FEEDBACK_RECEIVED')
    log.set('service_order', soId)
    log.set('action_taken', 'Created feedback record')
    log.set('result', 'Success')
    $app.save(log)

    return e.json(200, { success: true })
  } catch (err) {
    return e.internalServerError(err.message)
  }
})
