routerAdd(
  'GET',
  '/backend/v1/service-orders/{id}/suggest-technician',
  (e) => {
    try {
      const osId = e.request.pathValue('id')
      const os = $app.findRecordById('service_orders', osId)

      const techs = $app.findRecordsByFilter('users', "status != 'ocupado'", '', 100, 0)

      if (techs.length === 0) return e.json(200, { suggested_id: null })

      let best = null
      let bestScore = -9999

      for (const t of techs) {
        let score = 0

        if (t.getString('region') === os.getString('region')) score += 50

        let loadHours = 0
        try {
          const activeOrders = $app.findRecordsByFilter(
            'service_orders',
            `technician = '${t.id}' && status != 'concluído' && status != 'faturado'`,
            '',
            100,
            0,
          )
          loadHours = activeOrders.reduce(
            (sum, o) => sum + (o.getFloat('predicted_duration_hours') || 0),
            0,
          )
        } catch (_) {}

        const capacity = t.getFloat('capacity_diaria_hours') || 8
        score -= (loadHours / capacity) * 30

        if (t.getFloat('current_lat') && os.getFloat('lat')) {
          const dLat = t.getFloat('current_lat') - os.getFloat('lat')
          const dLng = t.getFloat('current_lng') - os.getFloat('lng')
          const dist = Math.sqrt(dLat * dLat + dLng * dLng)
          score -= dist * 10
        }

        if (score > bestScore) {
          bestScore = score
          best = t
        }
      }

      return e.json(200, {
        suggested_id: best ? best.id : null,
        name: best ? best.getString('name') : null,
      })
    } catch (err) {
      return e.badRequestError(err.message)
    }
  },
  $apis.requireAuth(),
)
