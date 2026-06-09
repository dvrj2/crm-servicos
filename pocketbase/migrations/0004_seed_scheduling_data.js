migrate(
  (app) => {
    const users = app.findRecordsByFilter('users', '1=1', '', 100, 0)
    for (const user of users) {
      user.set('capacity_diaria_hours', 8)
      user.set('current_lat', -23.5505 + (Math.random() * 0.1 - 0.05))
      user.set('current_lng', -46.6333 + (Math.random() * 0.1 - 0.05))
      app.save(user)
    }

    const osList = app.findRecordsByFilter('service_orders', '1=1', '', 100, 0)
    for (const os of osList) {
      os.set('predicted_duration_hours', Math.floor(Math.random() * 3) + 1)
      os.set('estimated_travel_hours', Math.random() * 1.5 + 0.1)
      os.set('lat', -23.5505 + (Math.random() * 0.2 - 0.1))
      os.set('lng', -46.6333 + (Math.random() * 0.2 - 0.1))

      if (!os.get('scheduled_date')) {
        const d = new Date()
        d.setDate(d.getDate() + Math.floor(Math.random() * 5))
        d.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0)
        os.set('scheduled_date', d.toISOString().replace('T', ' ').substring(0, 19) + 'Z')
      }
      app.save(os)
    }
  },
  (app) => {},
)
