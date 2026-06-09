onRecordAfterCreateSuccess((e) => {
  const photo = e.record
  const soId = photo.get('service_order')
  if (!soId) return e.next()

  try {
    const so = $app.findRecordById('service_orders', soId)
    const instanceUrl = $secrets.get('PB_INSTANCE_URL') || 'http://127.0.0.1:8090'
    const imageUrl = `${instanceUrl}/api/files/${photo.collection().id}/${photo.id}/${photo.getString('file')}`

    const reply = $ai.chat({
      model: 'fast',
      messages: [
        {
          role: 'system',
          content:
            'Você é um classificador técnico especializado. Verifique a clareza da foto. Se a foto estiver totalmente ilegível, muito borrada, escura ou for irrelevante ao serviço técnico, retorne {"readable": false}. Caso contrário, analise a urgência (baixa, média, crítica) e descreva as necessidades. Retorne APENAS um JSON válido. Exemplo: {"readable": true, "urgency": "média", "needs": "Reparo e manutenção na peça X"}',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analise esta foto.' },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    })

    let parsed = { readable: true, urgency: 'média', needs: 'Qualificação via análise de imagem' }
    const match = reply.choices[0].message.content.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        parsed = JSON.parse(match[0])
      } catch (_) {}
    }

    if (parsed.readable === false) {
      const msg = new Record($app.findCollectionByNameOrId('service_order_messages'))
      msg.set('service_order', soId)
      msg.set(
        'message',
        'Sistema: A foto enviada está ilegível ou irrelevante. Por favor, envie uma nova foto nítida do problema (Exceção detectada).',
      )
      $app.save(msg)

      const log = new Record($app.findCollectionByNameOrId('automation_logs'))
      log.set('webhook_type', 'EXCEPTION')
      log.set('service_order', soId)
      log.set('action_taken', 'Unreadable Photo - Rejected upload and notified technician')
      log.set('result', 'Success')
      $app.save(log)

      $app.delete(photo)
      return e.next()
    }

    if (so.get('status') === 'novo') {
      const validUrgency = ['baixa', 'média', 'crítica'].includes(parsed.urgency)
        ? parsed.urgency
        : 'média'

      so.set('urgency', validUrgency)
      so.set('status', 'qualificado')
      so.set('diagnosis', parsed.needs || 'Analisado')
      $app.save(so)
    }
  } catch (err) {
    console.log('Photo classification failed:', err.message)
  }
  e.next()
}, 'service_order_photos')
