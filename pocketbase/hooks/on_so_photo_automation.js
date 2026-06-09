onRecordAfterCreateSuccess((e) => {
  const photo = e.record
  const soId = photo.get('service_order')
  if (!soId) return e.next()

  try {
    const so = $app.findRecordById('service_orders', soId)
    if (so.get('status') === 'novo') {
      const instanceUrl = $secrets.get('PB_INSTANCE_URL') || 'http://127.0.0.1:8090'
      const imageUrl = `${instanceUrl}/api/files/${photo.collection().id}/${photo.id}/${photo.getString('file')}`

      const reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é um classificador técnico especializado. Analise a foto e identifique a urgência (baixa, média, crítica) e descreva as necessidades técnicas ou diagnóstico visual breve. Retorne APENAS um JSON válido. Exemplo: {"urgency": "média", "needs": "Reparo e manutenção na peça X"}',
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

      let parsed = { urgency: 'média', needs: 'Qualificação via análise de imagem' }
      const match = reply.choices[0].message.content.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          parsed = JSON.parse(match[0])
        } catch (_) {}
      }

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
