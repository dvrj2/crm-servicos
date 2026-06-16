onRecordUpdate((e) => {
  const so = e.record
  const oldStatus = so.original().getString('status')
  const newStatus = so.getString('status')

  if (oldStatus !== newStatus) {
    if ((newStatus === 'executando' || newStatus === 'in_progress') && !so.get('started_at')) {
      so.set('started_at', new Date().toISOString())
    }

    if ((newStatus === 'concluído' || newStatus === 'completed') && !so.get('technical_report')) {
      let isSandbox = false
      try {
        let lock = null
        try {
          lock = $app.findFirstRecordByData('system_settings', 'key', 'bloqueio_total')
        } catch (e) {}
        if (lock && (lock.get('value') === true || lock.get('value')?.enabled === true)) {
          isSandbox = true
        } else {
          let settings = null
          try {
            settings = $app.findFirstRecordByData('system_settings', 'key', 'modo_sandbox')
          } catch (err) {
            try {
              settings = $app.findFirstRecordByData('system_settings', 'key', 'sandbox_mode')
            } catch (e) {}
          }
          if (
            settings &&
            (settings.get('value') === true || settings.get('value')?.enabled === true)
          ) {
            isSandbox = true
          }
        }
      } catch (err) {}

      if (isSandbox) {
        so.set(
          'technical_report',
          'LAUDO TÉCNICO (SIMULADO)\nServiço concluído conforme o padrão da empresa. [Modo Sandbox Ativo]',
        )
        try {
          const simLog = new Record($app.findCollectionByNameOrId('simulation_logs'))
          simLog.set('action_type', 'ai_mock')
          simLog.set('content', { service_order: so.id, mock: 'technical_report' })
          simLog.set('status', 'simulado')
          simLog.set('event_source', 'on_so_workflow_automation_report')
          $app.saveNoValidate(simLog)
        } catch (err) {}
      } else {
        const prompt = `Você é um assistente técnico especializado. Transforme as anotações do serviço em um laudo técnico profissional, formal e pronto para o cliente.
Descrição do Problema: ${so.getString('description') || 'Não informada'}
Notas Técnicas: ${so.getString('technical_observations') || 'Não informadas'}`
        try {
          const reply = $ai.chat({
            model: 'fast',
            messages: [
              {
                role: 'system',
                content: 'Escreva um laudo técnico direto, claro e formal em português.',
              },
              { role: 'user', content: prompt },
            ],
          })
          so.set('technical_report', reply.choices[0].message.content)
        } catch (err) {
          console.log('Report generation failed', err.message)
        }
      }
    }
  }
  e.next()
}, 'service_orders')

onRecordAfterUpdateSuccess((e) => {
  const so = e.record
  const oldStatus = so.original().getString('status')
  const newStatus = so.getString('status')

  if (oldStatus !== newStatus) {
    if (newStatus === 'qualificado') {
      try {
        $app.findFirstRecordByData('quotes', 'service_order', so.id)
      } catch (_) {
        let isSandbox = false
        try {
          let lock = null
          try {
            lock = $app.findFirstRecordByData('system_settings', 'key', 'bloqueio_total')
          } catch (e) {}
          if (lock && (lock.get('value') === true || lock.get('value')?.enabled === true)) {
            isSandbox = true
          } else {
            let settings = null
            try {
              settings = $app.findFirstRecordByData('system_settings', 'key', 'modo_sandbox')
            } catch (err) {
              try {
                settings = $app.findFirstRecordByData('system_settings', 'key', 'sandbox_mode')
              } catch (e) {}
            }
            if (
              settings &&
              (settings.get('value') === true || settings.get('value')?.enabled === true)
            ) {
              isSandbox = true
            }
          }
        } catch (err) {}

        try {
          let parsed = { estimated_cost: 0, suggested_price: 0, estimated_hours: 1 }
          if (isSandbox) {
            parsed = { estimated_cost: 50, suggested_price: 150, estimated_hours: 2 }
            try {
              const simLog = new Record($app.findCollectionByNameOrId('simulation_logs'))
              simLog.set('action_type', 'ai_mock')
              simLog.set('content', { service_order: so.id, mock: 'quote' })
              simLog.set('status', 'simulado')
              simLog.set('event_source', 'on_so_workflow_automation_quote')
              $app.saveNoValidate(simLog)
            } catch (err) {}
          } else {
            const reply = $ai.chat({
              model: 'fast',
              messages: [
                {
                  role: 'system',
                  content:
                    'Estime o custo, preço sugerido e horas do serviço. Retorne APENAS um JSON. Exemplo: {"estimated_cost": 100, "suggested_price": 150, "estimated_hours": 2}',
                },
                {
                  role: 'user',
                  content: `Tipo de Serviço: ${so.getString('service_type')}. Diagnóstico: ${so.getString('diagnosis')}`,
                },
              ],
            })
            const match = reply.choices[0].message.content.match(/\{[\s\S]*\}/)
            if (match) {
              try {
                parsed = JSON.parse(match[0])
              } catch (_) {}
            }
          }

          const quote = new Record($app.findCollectionByNameOrId('quotes'))
          quote.set('service_order', so.id)
          quote.set('estimated_cost', parsed.estimated_cost || 0)
          quote.set('suggested_price', parsed.suggested_price || 0)
          quote.set('estimated_hours', parsed.estimated_hours || 1)
          quote.set('status', 'novo')
          $app.save(quote)
        } catch (err) {
          console.log('Quote automation failed', err.message)
        }
      }
    }
    if (newStatus === 'concluído' || newStatus === 'completed') {
      try {
        $app.findFirstRecordByData('financials', 'service_order', so.id)
      } catch (_) {
        try {
          const fin = new Record($app.findCollectionByNameOrId('financials'))
          fin.set('service_order', so.id)
          fin.set('payment_status', 'pendente')
          fin.set('final_value', so.get('final_value') || so.get('suggested_price') || 0)
          $app.save(fin)
        } catch (err) {
          console.log('Financials automation failed', err.message)
        }
      }
    }
  }

  const oldOpStatus = so.original().getString('operational_status')
  const newOpStatus = so.getString('operational_status')
  if (oldOpStatus !== newOpStatus && newOpStatus === 'en_route') {
    try {
      const msg = new Record($app.findCollectionByNameOrId('service_order_messages'))
      msg.set('service_order', so.id)
      msg.set('message', 'Aviso: Nosso técnico já está a caminho do local para o atendimento!')
      $app.save(msg)
    } catch (err) {}
  }

  e.next()
}, 'service_orders')
