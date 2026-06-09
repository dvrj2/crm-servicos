import { useMemo } from 'react'
import { ServiceOrder, User, ServiceFeedback, ServiceOrderPhoto, Financial } from '@/types'
import { differenceInDays, differenceInHours, parseISO } from 'date-fns'

export function useDashboardMetrics(
  allOrders: ServiceOrder[],
  users: User[],
  allFeedbacks: ServiceFeedback[],
  allPhotos: ServiceOrderPhoto[],
  allFinancials: Financial[],
  filters: any,
) {
  return useMemo(() => {
    const now = new Date()
    const daysLimit = filters.period === 'all' ? 9999 : parseInt(filters.period, 10)

    let orders = allOrders.filter((o) => differenceInDays(now, parseISO(o.created)) <= daysLimit)
    if (filters.technician) orders = orders.filter((o) => o.technician === filters.technician)
    if (filters.serviceType) orders = orders.filter((o) => o.service_type === filters.serviceType)

    const orderIds = new Set(orders.map((o) => o.id))
    const feedbacks = allFeedbacks.filter((f) => orderIds.has(f.service_order))

    // SLA
    const concludedOrders = orders.filter((o) => o.status === 'concluído')
    const validSlaOrders = concludedOrders.filter((o) => o.sla_deadline)
    const slaMet = validSlaOrders.filter((o) => {
      const completion = o.finished_at ? parseISO(o.finished_at) : parseISO(o.updated)
      return completion <= parseISO(o.sla_deadline)
    })
    const slaFulfillment = validSlaOrders.length ? slaMet.length / validSlaOrders.length : 1

    // Capacidade técnica (%)
    const totalOccupancyHours = users.reduce((sum, u) => sum + (u.occupancy_current_hours || 0), 0)
    const totalDailyCapacity = users.reduce((sum, u) => sum + (u.capacity_diaria_hours || 0), 0)
    const technicalCapacity = totalDailyCapacity ? totalOccupancyHours / totalDailyCapacity : 0

    // Retrabalho (%)
    const reworkCount = orders.filter((o) => o.is_rework).length
    const reworkRate = orders.length ? reworkCount / orders.length : 0

    // Financial Metrics
    const filteredFinancials = allFinancials.filter(
      (f) => differenceInDays(now, parseISO(f.created)) <= daysLimit,
    )
    const totalTicket = filteredFinancials.reduce((sum, f) => sum + (f.average_ticket || 0), 0)
    const ticketMedio = filteredFinancials.length ? totalTicket / filteredFinancials.length : 0

    const totalActualMargin = filteredFinancials.reduce((sum, f) => sum + (f.actual_margin || 0), 0)
    const margemReal = filteredFinancials.length ? totalActualMargin / filteredFinancials.length : 0

    // For Financial and Commercial Panel compatibility
    const totalPlannedMargin = orders.reduce((sum, o) => sum + (o.planned_margin || 0), 0)
    const totalActualMarginOrders = orders.reduce((sum, o) => sum + (o.actual_margin || 0), 0)

    const approvedStates = [
      'aprovado',
      'agendado',
      'execucao',
      'concluido',
      'faturado',
      'executando',
      'concluído',
    ]
    const conversionRate = orders.length
      ? orders.filter((o) => approvedStates.includes(o.status)).length / orders.length
      : 0

    const inadimplencia = concludedOrders.length
      ? concludedOrders.filter((o) => o.payment_status === 'vencido').length /
        concludedOrders.length
      : 0

    const latencies = orders
      .filter((o) => o.started_at)
      .map((o) => differenceInHours(parseISO(o.started_at!), parseISO(o.created)))
    const firstContactLatency = latencies.length
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0

    // Pareto Data: service_orders by service_type/category
    const failuresByType: Record<string, number> = {}
    orders
      .filter((o) => o.is_rework)
      .forEach((o) => {
        const type = o.service_type || o.category || 'Outro'
        failuresByType[type] = (failuresByType[type] || 0) + 1
      })

    const sortedFailures = Object.entries(failuresByType).sort((a, b) => b[1] - a[1])
    const totalFailures = sortedFailures.reduce((acc, curr) => acc + curr[1], 0)
    let accum = 0
    const paretoData = sortedFailures.map(([name, count]) => {
      accum += count
      return {
        name,
        count,
        cumulative: totalFailures ? (accum / totalFailures) * 100 : 0,
      }
    })

    // Radar Data - Top 3 Technicians by volume
    const techOrders: Record<string, ServiceOrder[]> = {}
    orders.forEach((o) => {
      if (!o.technician) return
      if (!techOrders[o.technician]) techOrders[o.technician] = []
      techOrders[o.technician].push(o)
    })

    const topTechsIds = Object.keys(techOrders)
      .sort((a, b) => techOrders[b].length - techOrders[a].length)
      .slice(0, 3)
    const topTechs = topTechsIds
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean) as User[]

    const radarData = [
      { subject: 'SLA (%)' },
      { subject: 'Satisfação (NPS)' },
      { subject: 'Qualidade (100 - Retrabalho)' },
      { subject: 'Velocidade' },
    ].map((dim) => {
      const row: any = { subject: dim.subject }
      topTechs.forEach((tech, idx) => {
        const key = `Tech${idx + 1}`
        const techO = techOrders[tech.id] || []
        if (dim.subject === 'SLA (%)') {
          const conc = techO.filter((o) => o.status === 'concluído')
          const vSla = conc.filter((o) => o.sla_deadline)
          const met = vSla.filter((o) => {
            const completion = o.finished_at ? parseISO(o.finished_at) : parseISO(o.updated)
            return completion <= parseISO(o.sla_deadline)
          })
          row[key] = vSla.length ? (met.length / vSla.length) * 100 : 100
        } else if (dim.subject === 'Qualidade (100 - Retrabalho)') {
          const reworks = techO.filter((o) => o.is_rework).length
          row[key] = techO.length ? 100 - (reworks / techO.length) * 100 : 100
        } else if (dim.subject === 'Satisfação (NPS)') {
          const fb = feedbacks.filter((f) => techO.some((o) => o.id === f.service_order))
          const prom = fb.filter((f) => f.nps_score >= 9).length
          const det = fb.filter((f) => f.nps_score <= 6).length
          row[key] = fb.length ? Math.max(0, ((prom - det) / fb.length) * 100) : 100
        } else if (dim.subject === 'Velocidade') {
          const lts = techO
            .filter((o) => o.started_at)
            .map((o) => differenceInHours(parseISO(o.started_at!), parseISO(o.created)))
          const avgLat = lts.length ? lts.reduce((a, b) => a + b, 0) / lts.length : 0
          row[key] = Math.max(0, 100 - avgLat * 2)
        }
      })
      return row
    })

    const promoters = feedbacks.filter((f) => f.nps_score >= 9).length
    const detractors = feedbacks.filter((f) => f.nps_score <= 6).length
    const npsScore = feedbacks.length ? ((promoters - detractors) / feedbacks.length) * 100 : 0
    const complaints = feedbacks.filter(
      (f) => f.complaint_description && f.complaint_description.trim().length > 0,
    ).length

    return {
      slaFulfillment,
      technicalCapacity,
      reworkRate,
      ticketMedio,
      margemReal,
      paretoData,
      radarData,
      topTechs,
      totalOrders: orders.length,
      orders,
      feedbacks,
      financials: filteredFinancials,
      totalPlannedMargin,
      totalActualMargin: totalActualMarginOrders,
      conversionRate,
      inadimplencia,
      npsScore,
      complaints,
      firstContactLatency,
    }
  }, [allOrders, users, allFeedbacks, allPhotos, allFinancials, filters])
}
