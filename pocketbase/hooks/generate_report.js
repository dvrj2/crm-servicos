routerAdd(
  'POST',
  '/backend/v1/generate-report',
  (e) => {
    const body = e.requestInfo().body || {}
    const { description, technical_notes, checklist } = body

    if (!description && !technical_notes) {
      return e.badRequestError('Dados insuficientes para gerar o laudo.')
    }

    const prompt = `Você é um assistente técnico especializado. Transforme as seguintes anotações brutas de serviço em um laudo técnico profissional, formal e pronto para o cliente.
O laudo deve ser conciso, claro e objetivo.

Anotações brutas:
Descrição do Problema: ${description || 'Não informada'}
Notas do Técnico: ${technical_notes || 'Não informadas'}
Checklist realizado: ${checklist || 'Não informado'}

Por favor, responda APENAS com o texto do laudo, sem saudações ou explicações extras. Formate em parágrafos ou tópicos curtos adequados para um documento formal.`

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

    return e.json(200, { report: reply.choices[0].message.content })
  },
  $apis.requireAuth(),
)
