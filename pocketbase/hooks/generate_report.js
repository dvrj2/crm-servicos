routerAdd(
  'POST',
  '/backend/v1/generate-report',
  (e) => {
    const body = e.requestInfo().body || {}
    const { order_id, materials_used } = body

    if (!order_id) {
      return e.badRequestError('ID da Ordem de Serviço não informado.')
    }

    const order = $app.findRecordById('service_orders', order_id)

    // Fetch checklist
    const checklists = $app.findRecordsByFilter(
      'service_order_checklist_items',
      `service_order = '${order_id}'`,
      '',
      100,
      0,
    )
    const checklistStr = checklists
      .map(
        (c) =>
          `- ${c.getString('task_description')}: ${c.getBool('is_completed') ? 'OK' : 'Pendente'}`,
      )
      .join('\n')

    // Fetch photos to count them
    const photos = $app.findRecordsByFilter(
      'service_order_photos',
      `service_order = '${order_id}'`,
      '',
      100,
      0,
    )
    const beforeCount = photos.filter((p) => p.getString('stage') === 'before').length
    const afterCount = photos.filter((p) => p.getString('stage') === 'after').length

    let materialsUsed = materials_used || order.getString('materials_used')

    const prompt = `Você é um assistente técnico especializado. Transforme as seguintes anotações brutas de serviço em um laudo técnico profissional, formal e pronto para o cliente.
O laudo deve ser conciso, claro, objetivo e conter seções definidas.

Anotações brutas:
Descrição Inicial (Cliente): ${order.getString('description') || 'Não informada'}
Diagnóstico Técnico: ${order.getString('diagnosis') || 'Não informado'}
Atividades Realizadas: ${order.getString('activities_performed') || 'Não informadas'}
Checklist realizado: ${checklistStr || 'Não informado'}
Materiais Utilizados: ${materialsUsed || 'Não informados'}
Evidências: ${beforeCount} fotos do 'antes' e ${afterCount} fotos do 'depois' registradas no sistema.

Por favor, responda APENAS com o texto do laudo, sem saudações ou explicações extras. Estruture o laudo em seções como:
- Diagnóstico
- Atividades Realizadas
- Checklists e Validações
- Materiais Utilizados
- Conclusão / Recomendações`

    const reply = $ai.chat({
      model: 'fast',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente técnico escrevendo laudos formais para clientes.',
        },
        { role: 'user', content: prompt },
      ],
    })

    const reportText = reply.choices[0].message.content
    order.set('technical_report', reportText)
    $app.save(order)

    return e.json(200, { report: reportText })
  },
  $apis.requireAuth(),
)
