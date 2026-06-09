routerAdd(
  'GET',
  '/backend/v1/service-orders/{id}/suggest-technician',
  (e) => {
    const osId = e.request.pathValue('id')
    const os = $app.findRecordById('service_orders', osId)

    const techs = $app.findRecordsByFilter('users', "status != 'inactive'", '', 100, 0)

    if (techs.length === 0) return e.json(200, { suggested_id: null })

    // Logic to suggest technicians based on: Lowest occupancy + Shortest distance + Required certification.
    // For this mock, we just pick the first one matching region
    let best = techs[0]
    for (const t of techs) {
      if (t.getString('region') === os.getString('region')) {
        best = t
        break
      }
    }

    return e.json(200, { suggested_id: best.id, name: best.getString('name') })
  },
  $apis.requireAuth(),
)
