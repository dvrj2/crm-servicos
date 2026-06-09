onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const original = record.original()

  if (record.getString('status') === 'concluído' && original.getString('status') !== 'concluído') {
    if (
      record.getBool('is_recurring') ||
      record.getString('service_type').toLowerCase().includes('preventiva')
    ) {
      const config = record.getString('recurrence_config') || '30'
      const days = parseInt(config, 10) || 30

      const newRecord = new Record($app.findCollectionByNameOrId('service_orders'))
      newRecord.set('customer_name', record.getString('customer_name'))
      newRecord.set('service_type', record.getString('service_type'))
      newRecord.set('urgency', 'média')

      const nextDate = new Date(Date.now() + days * 24 * 3600 * 1000)
      newRecord.set('sla_deadline', nextDate.toISOString())
      newRecord.set('region', record.getString('region'))
      newRecord.set('status', 'novo')
      newRecord.set('has_pending_checklist', true)
      newRecord.set(
        'description',
        'Manutenção preventiva gerada automaticamente. OS original: ' + record.id,
      )
      newRecord.set('is_recurring', true)
      newRecord.set('recurrence_config', config)
      newRecord.set('category', record.getString('category'))

      $app.save(newRecord)
    }
  }
  e.next()
}, 'service_orders')
