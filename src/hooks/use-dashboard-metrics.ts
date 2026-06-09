import { useMemo } from 'react'
import { ServiceOrder, User, ServiceFeedback, ServiceOrderPhoto } from '@/types'
import { differenceInDays, differenceInHours, parseISO } from 'date-fns'

export function useDashboardMetrics(
  allOrders: ServiceOrder[],
  users: User[],
  allFeedbacks: ServiceFeedback[],
  allPhotos: ServiceOrderPhoto[],
  filters: any,
) {
  return useMemo(() => {
    const now = new Date()
    const daysLimit = filters.period === 'all' ? 9999 : parseInt(filters.period, 10)

    let orders = allOrders.filter((o) => differenceInDays(now, parseISO(o.created)) <= daysLimit)
    if (filters.technician) orders = orders.filter((o) => o.technician === filters.technician)
    if (filters.region) orders = orders.filter((o) => o.region === filters.region)
    if (filters.category) orders = orders.filter((o) => o.service_type === filters.category)
    if (filters.urgency) orders = orders.filter((o) => o.urgency === filters.urgency)
    if (filters.customer) orders = orders.filter((o) => o.customer_name === filters.customer)

    const orderIds = new Set(orders.map((o) => o.id))
    const feedbacks = allFeedbacks.filter((f) => orderIds.has(f.service_order))

    const validSlaOrders = orders.filter((o) => o.sla_deadline)
    const slaMet = validSlaOrders.filter((o) => {
      const completion = o.finished_at
        ? parseISO(o.finished_at)
        : ['concluido', 'faturado'].includes(o.status)
          ? parseISO(o.updated)
          : now
      return completion <= parseISO(o.sla_deadline)
    })
    const slaFulfillment = validSlaOrders.length ? slaMet.length / validSlaOrders.length : 1

    const latencies = orders
      .filter((o) => o.started_at)
      .map((o) => differenceInHours(parseISO(o.started_at!), parseISO(o.created)))
    const firstContactLatency = latencies.length
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0

    const reworkCount = orders.filter((o) => o.is_rework).length
    const reworkRate = orders.length ? reworkCount / orders.length : 0

    const totalActualHours = orders.reduce((sum, o) => sum + (o.actual_duration_hours || 0), 0)
    const totalCapacity =
      users.reduce((sum, u) => sum + (u.capacity_diaria_hours || 8), 0) *
      (daysLimit > 365 ? 30 : daysLimit)
    const occupancy = totalCapacity ? totalActualHours / totalCapacity : 0

    const approvedStates = ['aprovado', 'agendado', 'execucao', 'concluido', 'faturado']
    const conversionRate = orders.length
      ? orders.filter((o) => approvedStates.includes(o.status)).length / orders.length
      : 0

    const totalPlannedMargin = orders.reduce((sum, o) => sum + (o.planned_margin || 0), 0)
    const totalActualMargin = orders.reduce((sum, o) => sum + (o.actual_margin || 0), 0)
    const negativeMarginOrders = orders.filter(
      (o) => typeof o.actual_margin === 'number' && o.actual_margin < 0,
    )
    const negativeMarginRate = orders.length ? negativeMarginOrders.length / orders.length : 0

    const concludedOrders = orders.filter((o) => ['concluido', 'faturado'].includes(o.status))
    const inadimplencia = concludedOrders.length
      ? concludedOrders.filter((o) => o.payment_status === 'vencido').length /
        concludedOrders.length
      : 0

    const promoters = feedbacks.filter((f) => f.nps_score >= 9).length
    const detractors = feedbacks.filter((f) => f.nps_score <= 6).length
    const npsScore = feedbacks.length ? ((promoters - detractors) / feedbacks.length) * 100 : 0
    const complaints = feedbacks.filter(
      (f) => f.complaint_description && f.complaint_description.trim().length > 0,
    ).length

    const reworkByTech = users
      .map((u) => ({
        name: u.name,
        reworks: orders.filter((o) => o.technician === u.id && o.is_rework).length,
      }))
      .filter((x) => x.reworks > 0)

    return {
      slaFulfillment,
      firstContactLatency,
      reworkRate,
      occupancy,
      conversionRate,
      totalPlannedMargin,
      totalActualMargin,
      negativeMarginRate,
      inadimplencia,
      npsScore,
      complaints,
      reworkByTech,
      totalOrders: orders.length,
      orders,
      feedbacks,
    }
  }, [allOrders, users, allFeedbacks, allPhotos, filters])
}
