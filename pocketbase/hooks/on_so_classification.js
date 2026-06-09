onRecordValidate((e) => {
  const record = e.record
  const desc = (record.getString('description') || '').toLowerCase()
  if (
    desc.includes('urgente') ||
    desc.includes('emergência') ||
    desc.includes('curto-circuito') ||
    desc.includes('fogo') ||
    desc.includes('choque')
  ) {
    if (record.getString('urgency') !== 'alta') {
      record.set('urgency', 'alta')
    }
  }
  e.next()
}, 'service_orders')
