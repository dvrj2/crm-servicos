routerAdd(
  'DELETE',
  '/backend/v1/simulation-logs/clear',
  (e) => {
    $app.db().newQuery('DELETE FROM simulation_logs').execute()
    return e.noContent(204)
  },
  $apis.requireAuth(),
)
