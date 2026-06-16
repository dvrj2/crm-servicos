onRecordAfterCreateSuccess(
  (e) => {
    const collectionName = e.record.collection().name
    const urgencyLevels = { baixa: 1, média: 2, crítica: 3 }

    if (collectionName === 'service_orders') {
      const record = e.record
      const desc = record.getString('description') || ''

      if (desc) {
        let isSandbox = false
        try {
          let settings = null
          try {
            settings = $app.findFirstRecordByData('system_settings', 'key', 'modo_sandbox')
          } catch (err) {
            settings = $app.findFirstRecordByData('system_settings', 'key', 'sandbox_mode')
          }
          isSandbox = settings.get('value') === true || settings.get('value')?.enabled === true
        } catch (err) {}

        try {
          let data
          if (isSandbox) {
            data = { urgency: 'média', sla_minutes: 1440, confidence: 0.99, keywords: ['simulado'] }
          } else {
            const reply = $ai.chat({
              model: 'fast',
              messages: [
                {
                  role: 'system',
                  content:
                    "You are a classifier for service orders. Determine urgency ('baixa', 'média', 'crítica') and SLA in minutes (e.g. 120 for crítica, 1440 for média, 2880 for baixa). Keywords like 'cheiro de queimado', 'faíscas', 'luz piscando', 'incêndio', 'curto-circuito', 'choque', 'urgente' MUST imply 'crítica' and 120 minutes. Return JSON: { \"urgency\": \"crítica\", \"sla_minutes\": 120, \"confidence\": 0.95, \"keywords\": [\"faíscas\"] }.",
                },
                { role: 'user', content: desc },
              ],
            })

            const rawContent = reply.choices[0].message.content
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
            data = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent)
          }

          const so = $app.findRecordById('service_orders', record.id)
          const currentLevel = urgencyLevels[so.getString('urgency')] || 0
          const newLevel = urgencyLevels[data.urgency] || 0

          if (newLevel > currentLevel) {
            so.set('urgency', data.urgency)
            if (data.sla_minutes) {
              so.set('sla_deadline_minutes', data.sla_minutes)
              const deadline = new Date(Date.now() + data.sla_minutes * 60000)
              so.set('sla_deadline', deadline.toISOString())
            }
            $app.saveNoValidate(so)
          }

          const logCol = $app.findCollectionByNameOrId('automation_logs')
          const log = new Record(logCol)
          log.set('webhook_type', 'ai_classification')
          log.set('service_order', record.id)
          log.set('action_taken', 'AI Urgency Classification (Text)')
          log.set('result', data.urgency || 'desconhecido')
          log.set('details', {
            confidence: data.confidence,
            keywords: data.keywords,
            source: 'text',
            escalated: newLevel > currentLevel,
            simulated: isSandbox,
          })
          $app.saveNoValidate(log)

          if (isSandbox) {
            try {
              const simLog = new Record($app.findCollectionByNameOrId('simulation_logs'))
              simLog.set('action_type', 'ai_mock')
              simLog.set('content', {
                service_order: record.id,
                mocked_result: data,
              })
              simLog.set('status', 'simulado')
              simLog.set('event_source', 'on_so_classification_text')
              $app.saveNoValidate(simLog)
            } catch (err) {}
          }
        } catch (err) {
          console.log('AI Classification failed', err)
        }
      }
    } else if (collectionName === 'service_order_photos') {
      const record = e.record
      const stage = record.getString('stage')
      if (stage !== 'before') {
        return e.next()
      }

      const soId = record.getString('service_order')
      const fileUrl =
        $secrets.get('PB_INSTANCE_URL') +
        '/api/files/' +
        record.collection().id +
        '/' +
        record.id +
        '/' +
        record.getString('file')

      let isSandbox = false
      try {
        let settings = null
        try {
          settings = $app.findFirstRecordByData('system_settings', 'key', 'modo_sandbox')
        } catch (err) {
          settings = $app.findFirstRecordByData('system_settings', 'key', 'sandbox_mode')
        }
        isSandbox = settings.get('value') === true || settings.get('value')?.enabled === true
      } catch (err) {}

      try {
        let data
        if (isSandbox) {
          data = { urgency: 'crítica', sla_minutes: 120, confidence: 0.99, features: ['simulado'] }
        } else {
          const reply = $ai.chat({
            model: 'fast',
            messages: [
              {
                role: 'system',
                content:
                  'You are a visual classifier for service orders. Determine urgency (\'baixa\', \'média\', \'crítica\') based on the image. A \'burnt electrical panel\' (quadro elétrico queimado), exposed wires, melting, or fire MUST imply \'crítica\' and 120 minutes SLA. Return JSON: { "urgency": "crítica", "sla_minutes": 120, "confidence": 0.98, "features": ["burnt panel"] }.',
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Analyze this image for electrical hazards and determine the urgency.',
                  },
                  { type: 'image_url', image_url: { url: fileUrl } },
                ],
              },
            ],
          })

          const rawContent = reply.choices[0].message.content
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
          data = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent)
        }

        if (data.urgency === 'crítica' || data.urgency === 'média' || data.urgency === 'baixa') {
          const so = $app.findRecordById('service_orders', soId)
          const currentLevel = urgencyLevels[so.getString('urgency')] || 0
          const newLevel = urgencyLevels[data.urgency] || 0

          if (newLevel > currentLevel) {
            so.set('urgency', data.urgency)
            if (data.sla_minutes) {
              so.set('sla_deadline_minutes', data.sla_minutes)
              const deadline = new Date(Date.now() + data.sla_minutes * 60000)
              so.set('sla_deadline', deadline.toISOString())
            }
            $app.saveNoValidate(so)
          }

          const logCol = $app.findCollectionByNameOrId('automation_logs')
          const log = new Record(logCol)
          log.set('webhook_type', 'ai_classification')
          log.set('service_order', soId)
          log.set('action_taken', 'AI Urgency Classification (Image)')
          log.set('result', data.urgency)
          log.set('details', {
            confidence: data.confidence,
            features: data.features,
            source: 'image',
            photo_id: record.id,
            escalated: newLevel > currentLevel,
            simulated: isSandbox,
          })
          $app.saveNoValidate(log)

          if (isSandbox) {
            try {
              const simLog = new Record($app.findCollectionByNameOrId('simulation_logs'))
              simLog.set('action_type', 'ai_mock')
              simLog.set('content', {
                service_order: soId,
                mocked_result: data,
              })
              simLog.set('status', 'simulado')
              simLog.set('event_source', 'on_so_classification_image')
              $app.saveNoValidate(simLog)
            } catch (err) {}
          }
        }
      } catch (err) {
        console.log('AI Image Classification failed', err)
      }
    }
    e.next()
  },
  'service_orders',
  'service_order_photos',
)
