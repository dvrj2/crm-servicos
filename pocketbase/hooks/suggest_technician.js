routerAdd(
  'POST',
  '/backend/v1/service-orders/{id}/assign',
  (e) => {
    try {
      const osId = e.request.pathValue('id')

      let resultData = null

      $app.runInTransaction((txApp) => {
        const os = txApp.findRecordById('service_orders', osId)

        let isSandbox = false
        try {
          try {
            const s = txApp.findFirstRecordByData('system_settings', 'key', 'modo_sandbox')
            if (s.get('value') === true || s.get('value')?.enabled === true) isSandbox = true
          } catch (_) {}
          if (!isSandbox) {
            try {
              const s = txApp.findFirstRecordByData('system_settings', 'key', 'sandbox_mode')
              if (s.get('value') === true || s.get('value')?.enabled === true) isSandbox = true
            } catch (_) {}
          }
        } catch (_) {}

        if (os.getString('technician')) {
          resultData = { assigned: false, reason: 'Already assigned' }
          return
        }

        const duration = os.getFloat('predicted_duration_hours') || 1.0

        // Find available techs
        const techs = txApp.findRecordsByFilter('users', "status != 'ocupado'", '', 100, 0)

        let bestTech = null
        let shortestDist = 999999

        for (const t of techs) {
          const capacity = t.getFloat('capacity_diaria_hours') || 8.0
          const currentOccupancy = t.getFloat('occupancy_current_hours') || 0.0

          if (currentOccupancy + duration > capacity) {
            continue
          }

          let dist = 0
          if (t.getFloat('current_lat') && os.getFloat('lat')) {
            const dLat = t.getFloat('current_lat') - os.getFloat('lat')
            const dLng = t.getFloat('current_lng') - os.getFloat('lng')
            dist = Math.sqrt(dLat * dLat + dLng * dLng)
          }

          if (dist < shortestDist) {
            shortestDist = dist
            bestTech = t
          }
        }

        const logsCollection = txApp.findCollectionByNameOrId('automation_logs')
        const simLogsCollection = txApp.findCollectionByNameOrId('simulation_logs')

        if (isSandbox) {
          try {
            const simLog = new Record(simLogsCollection)
            simLog.set('action_type', 'location_mock')
            simLog.set('content', {
              service_order: os.id,
              technician_found: bestTech ? bestTech.id : null,
              distance: shortestDist,
              mocked_routing: true,
            })
            simLog.set('status', 'simulado')
            simLog.set('event_source', 'suggest_technician')
            txApp.save(simLog)
          } catch (eLog) {}
        }

        if (!bestTech) {
          const log = new Record(logsCollection)
          log.set('webhook_type', 'auto_assignment')
          log.set('service_order', os.id)
          log.set('action_taken', 'Assign Technician')
          log.set('result', 'Failed')
          log.set(
            'details',
            JSON.stringify({
              reason: 'All qualified technicians are at full capacity or unavailable.',
            }),
          )
          txApp.save(log)

          resultData = { assigned: false, reason: 'No capacity' }
          return
        }

        os.set('technician', bestTech.id)
        os.set('status', 'agendado')
        txApp.save(os)

        bestTech.set(
          'occupancy_current_hours',
          (bestTech.getFloat('occupancy_current_hours') || 0) + duration,
        )
        txApp.save(bestTech)

        const log = new Record(logsCollection)
        log.set('webhook_type', 'auto_assignment')
        log.set('service_order', os.id)
        log.set('action_taken', 'Assign Technician')
        log.set('result', 'Success')
        log.set(
          'details',
          JSON.stringify({
            technician: bestTech.id,
            technician_name: bestTech.getString('name'),
            distance: shortestDist,
          }),
        )
        txApp.save(log)

        resultData = { assigned: true, technician: bestTech.id, name: bestTech.getString('name') }
      })

      return e.json(200, resultData)
    } catch (err) {
      return e.badRequestError(err.message)
    }
  },
  $apis.requireAuth(),
)
