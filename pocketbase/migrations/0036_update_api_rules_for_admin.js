migrate(
  (app) => {
    const collectionsToUpdate = [
      'service_orders',
      'users',
      'empresarios',
      'financials',
      'appointments',
      'executions',
      'quotes',
    ]

    for (const name of collectionsToUpdate) {
      try {
        const col = app.findCollectionByNameOrId(name)
        if (col) {
          const appendAdminRule = (rule) => {
            if (rule === '' || rule === null) return rule
            if (rule.includes("@request.auth.tipo_role = 'admin'")) return rule
            return `(${rule}) || @request.auth.tipo_role = 'admin'`
          }

          col.listRule = appendAdminRule(col.listRule)
          col.viewRule = appendAdminRule(col.viewRule)
          col.createRule = appendAdminRule(col.createRule)
          col.updateRule = appendAdminRule(col.updateRule)
          col.deleteRule = appendAdminRule(col.deleteRule)

          app.save(col)
        }
      } catch (e) {
        console.log('Could not update rules for collection:', name, e.message)
      }
    }
  },
  (app) => {},
)
