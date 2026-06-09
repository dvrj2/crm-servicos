onRecordCreate((e) => {
  const record = e.record
  const desc = record.getString('description') || ''

  if (desc) {
    try {
      const reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              "You are a classifier for service orders. Determine urgency ('baixa', 'media', 'alta', 'critica') and SLA in minutes (e.g. 120 for critica, 1440 for media, 2880 for baixa). Return JSON: { \"urgency\": \"...\", \"sla_minutes\": 120 }. Keywords like 'incêndio', 'curto-circuito', 'sem energia', 'choque', 'urgente' imply 'critica' and 120 minutes.",
          },
          { role: 'user', content: desc },
        ],
      })
      const data = JSON.parse(reply.choices[0].message.content)
      if (data.urgency) record.set('urgency', data.urgency)
      if (data.sla_minutes) {
        record.set('sla_deadline_minutes', data.sla_minutes)
        const deadline = new Date(Date.now() + data.sla_minutes * 60000)
        record.set('sla_deadline', deadline.toISOString())
      }
    } catch (err) {
      console.log('AI Classification failed', err)
    }
  }
  e.next()
}, 'service_orders')
