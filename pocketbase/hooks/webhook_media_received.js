routerAdd('POST', '/backend/v1/webhook/media-received', (e) => {
  const body = e.requestInfo().body || {}
  const soId = body.service_order
  const fileUrl = body.file_url

  if (!soId || !fileUrl) return e.badRequestError('Missing service_order or file_url')

  let actionTaken = ''
  try {
    const photo = new Record($app.findCollectionByNameOrId('service_order_photos'))
    photo.set('service_order', soId)
    photo.set('stage', 'before')

    const file = $filesystem.fileFromURL(fileUrl, 15)
    photo.set('file', file)
    $app.save(photo)

    const instanceUrl = $secrets.get('PB_INSTANCE_URL') || 'http://127.0.0.1:8090'
    const imageUrl = `${instanceUrl}/api/files/${photo.collection().id}/${photo.id}/${photo.getString('file')}`

    const reply = $ai.chat({
      model: 'fast',
      messages: [
        {
          role: 'system',
          content:
            'Classifique a foto identificando "urgency" (baixa, média, crítica) e "service_type". Retorne APENAS JSON. Exemplo: {"urgency": "média", "service_type": "Manutenção"}',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Qualifique esta foto.' },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    })

    let parsed = { urgency: 'média', service_type: 'Não identificado' }
    const match = reply.choices[0].message.content.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        parsed = JSON.parse(match[0])
      } catch (_) {}
    }

    const so = $app.findRecordById('service_orders', soId)
    so.set(
      'urgency',
      ['baixa', 'média', 'crítica'].includes(parsed.urgency) ? parsed.urgency : 'média',
    )
    if (parsed.service_type) so.set('service_type', parsed.service_type)
    if (so.getString('status') === 'novo') {
      so.set('status', 'qualificado')
    }
    $app.save(so)

    actionTaken = `Processed media, classified as ${parsed.urgency}`

    const log = new Record($app.findCollectionByNameOrId('automation_logs'))
    log.set('webhook_type', 'MEDIA_RECEIVED')
    log.set('service_order', soId)
    log.set('action_taken', actionTaken)
    log.set('result', 'Success')
    $app.save(log)

    return e.json(200, { success: true, urgency: parsed.urgency })
  } catch (err) {
    try {
      const log = new Record($app.findCollectionByNameOrId('automation_logs'))
      log.set('webhook_type', 'MEDIA_RECEIVED')
      log.set('service_order', soId)
      log.set('action_taken', 'Failed to process media')
      log.set('result', 'Error: ' + err.message)
      $app.save(log)
    } catch (_) {}
    return e.internalServerError(err.message)
  }
})
