import { InventoryService } from '@/lib/services/inventoryService'
import { handle, json } from '@/lib/api/handler'
import { requireAdminUser } from '@/lib/api/guards'

export const dynamic = 'force-dynamic'

// GET /api/admin/low-stock - books at or below LOW_STOCK_THRESHOLD copies (default 5), emptiest first
export const GET = handle(async () => {
  await requireAdminUser()
  return json(await InventoryService.lowStock())
})
