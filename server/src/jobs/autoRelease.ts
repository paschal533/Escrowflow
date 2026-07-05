import cron from 'node-cron'
import { Milestone } from '../models/Milestone.js'
import { releaseMilestonePayout } from '../services/transfer.js'

export function startAutoReleaseJob(): void {
  cron.schedule('0 * * * *', async () => {
    try {
      const overdue = await Milestone.find({
        status: 'PROVIDER_MARKED_COMPLETE',
        autoReleaseAt: { $lte: new Date() },
      })

      console.log(`[AutoRelease] Found ${overdue.length} overdue milestones`)

      for (const milestone of overdue) {
        try {
          await releaseMilestonePayout(String(milestone._id))
          console.log(`[AutoRelease] Released milestone ${milestone._id}`)
        } catch (err) {
          console.error(`[AutoRelease] Failed to release milestone ${milestone._id}:`, err)
        }
      }
    } catch (err) {
      console.error('[AutoRelease] Cron job failed:', err)
    }
  })
}
