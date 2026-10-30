import api from '@/services/api'
import type { ApiSuccess, OccupancyReport } from '@/types'

export async function getOccupancy(
  projectId: string,
  params: { buildingId?: string; saturday?: boolean } = {},
): Promise<OccupancyReport> {
  const { data } = await api.get<ApiSuccess<OccupancyReport>>(`/projects/${projectId}/reports/occupancy`, {
    params: {
      ...(params.buildingId ? { buildingId: params.buildingId } : {}),
      ...(params.saturday ? { saturday: 'true' } : {}),
    },
  })
  return data.data
}
