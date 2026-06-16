// This hook manages automated billing and external communications to the customer.
onRecordAfterUpdateSuccess((e) => {
  try {
    const isSandboxActive = () => {
      try {
        const settings = $app.findFirstRecordByData('system_settings', 'key', 'sandbox_mode')
        return settings.get('value')?.enabled === true
      } catch (err) {
        return false
      }
    }

    if (
      e.record.get('operation_status') === 'concluido' &&
      e.record.original().get('operation_status') !== 'concluido'
    ) {
      // Sandbox Webhook Blocking Guard
      if (isSandboxActive()) {
        const log = new Record($app.findCollectionByNameOrId('automation_logs'))
        log.set('webhook_type', 'SANDBOX_BLOCKED')
        log.set('action_taken', 'Email/WhatsApp Billing Trigger')
        log.set('result', 'Bypassed external webhook due to Sandbox Mode')
        $app.saveNoValidate(log)
        return e.next()
      }

      // Normal external trigger logic would go here if not in sandbox
      // Example: $http.send({ url: "https://api.gateway.com/send", ... })
    }
  } catch (err) {}

  e.next()
}, 'appointments')
