migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('system_settings')
    try {
      app.findFirstRecordByData('system_settings', 'key', 'bloqueio_total')
    } catch (_) {
      const record = new Record(collection)
      record.set('key', 'bloqueio_total')
      record.set('value', { enabled: true })
      app.saveNoValidate(record)
    }
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData('system_settings', 'key', 'bloqueio_total')
      app.delete(record)
    } catch (_) {}
  },
)
