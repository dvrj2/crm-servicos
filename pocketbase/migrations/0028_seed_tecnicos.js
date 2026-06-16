migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('tecnicos')

    const seeds = [
      {
        nome: 'Carlos Silva',
        cpf: '111.111.111-11',
        telefone: '11999999999',
        email: 'carlos@example.com',
        regiao: 'São Paulo',
        certificacoes: 'NR10, NR35',
        capacidade_diaria_hours: 8,
        ocupacao_atual_horas: 4,
        status: 'em serviço',
        habilidades: 'Elétrica, Manutenção de Ar Condicionado',
        custo_hora: 50,
      },
      {
        nome: 'Roberto Mendes',
        cpf: '222.222.222-22',
        telefone: '11988888888',
        email: 'roberto@example.com',
        regiao: 'Campinas',
        certificacoes: 'NR10',
        capacidade_diaria_hours: 8,
        ocupacao_atual_horas: 0,
        status: 'disponível',
        habilidades: 'Instalação de Redes',
        custo_hora: 45,
      },
      {
        nome: 'Juliano Costa',
        cpf: '333.333.333-33',
        telefone: '11977777777',
        email: 'juliano@example.com',
        regiao: 'Santos',
        certificacoes: 'NR35',
        capacidade_diaria_hours: 8,
        ocupacao_atual_horas: 2,
        status: 'a caminho',
        habilidades: 'Reparo Hidráulico',
        custo_hora: 55,
      },
    ]

    for (const s of seeds) {
      try {
        app.findFirstRecordByData('tecnicos', 'cpf', s.cpf)
      } catch (_) {
        const record = new Record(col)
        for (const [key, value] of Object.entries(s)) {
          record.set(key, value)
        }
        app.save(record)
      }
    }
  },
  (app) => {
    const cpfs = ['111.111.111-11', '222.222.222-22', '333.333.333-33']
    for (const cpf of cpfs) {
      try {
        const r = app.findFirstRecordByData('tecnicos', 'cpf', cpf)
        app.delete(r)
      } catch (_) {}
    }
  },
)
