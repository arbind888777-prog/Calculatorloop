// Hook to track and sync user data with cloud

import { useSession } from 'next-auth/react'
import { useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'

interface SyncOptions {
  syncHistory?: boolean
  syncFavorites?: boolean
  syncSaved?: boolean
  autoSync?: boolean
  syncInterval?: number // milliseconds
}

export function useCloudSync(options: SyncOptions = {}) {
  const { data: session } = useSession()
  const {
    syncHistory = true,
    syncFavorites = true,
    syncSaved = true,
    autoSync = true,
    syncInterval = 5 * 60 * 1000 // 5 minutes
  } = options

  // Sync calculation history
  const syncHistoryToCloud = useCallback(async () => {
    if (!session?.user || !syncHistory) return

    try {
      const localHistory = JSON.parse(localStorage.getItem('calculationHistory') || '[]')
      
      // Upload to cloud
      for (const calc of localHistory) {
        await fetch('/api/user/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            calculatorType: calc.calculatorType,
            calculatorName: calc.calculatorName,
            category: calc.category || 'General',
            inputs: calc.inputs,
            result: calc.result
          })
        })
      }
      
      // Clear local storage after successful sync
      localStorage.removeItem('calculationHistory')
      
    } catch (error) {
      console.error('History sync failed:', error)
    }
  }, [session, syncHistory])

  // Sync favorites
  const syncFavoritesToCloud = useCallback(async () => {
    if (!session?.user || !syncFavorites) return

    try {
      const localFavorites = JSON.parse(localStorage.getItem('favoriteCalculators') || '[]')
      
      for (const fav of localFavorites) {
        await fetch('/api/user/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            calculatorId: fav.id,
            calculatorName: fav.name,
            category: fav.category,
            description: fav.description
          })
        })
      }
      
      localStorage.removeItem('favoriteCalculators')
      
    } catch (error) {
      console.error('Favorites sync failed:', error)
    }
  }, [session, syncFavorites])

  // Sync saved calculations
  const syncSavedToCloud = useCallback(async () => {
    if (!session?.user || !syncSaved) return

    try {
      const localSaved = JSON.parse(localStorage.getItem('savedCalculations') || '[]')
      
      for (const saved of localSaved) {
        await fetch('/api/user/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            calculatorType: saved.calculatorType,
            calculatorName: saved.calculatorName,
            inputs: saved.inputs,
            result: saved.result,
            notes: saved.notes,
            tags: saved.tags
          })
        })
      }
      
      localStorage.removeItem('savedCalculations')
      
    } catch (error) {
      console.error('Saved calculations sync failed:', error)
    }
  }, [session, syncSaved])

  // Download from cloud to local
  const downloadFromCloud = useCallback(async () => {
    if (!session?.user) return

    const safeSetItem = (key: string, data: any[], limit: number = 100) => {
      try {
        localStorage.setItem(key, JSON.stringify(data.slice(0, limit)))
      } catch (e) {
        console.warn(`Local storage quota exceeded for ${key}. Truncating to 20 items.`)
        try {
          localStorage.setItem(key, JSON.stringify(data.slice(0, 20)))
        } catch (err) {
          console.error(`Could not save to local storage for ${key}`)
        }
      }
    }

    try {
      // Download history
      if (syncHistory) {
        const historyRes = await fetch('/api/user/history')
        if (historyRes.ok) {
          const { calculations } = await historyRes.json()
          safeSetItem('calculationHistory', calculations, 100)
        }
      }

      // Download favorites
      if (syncFavorites) {
        const favRes = await fetch('/api/user/favorites')
        if (favRes.ok) {
          const { favorites } = await favRes.json()
          safeSetItem('favoriteCalculators', favorites, 100)
        }
      }

      // Download saved
      if (syncSaved) {
        const savedRes = await fetch('/api/user/saved')
        if (savedRes.ok) {
          const { savedResults } = await savedRes.json()
          safeSetItem('savedCalculations', savedResults, 100)
        }
      }

      toast.success('Data synced from cloud')
    } catch (error) {
      console.error('Download from cloud failed:', error)
      toast.error('Sync failed')
    }
  }, [session, syncHistory, syncFavorites, syncSaved])

  // Full sync (upload + download)
  const performFullSync = useCallback(async () => {
    if (!session?.user) return

    toast.loading('Syncing...', { id: 'cloud-sync' })

    try {
      await syncHistoryToCloud()
      await syncFavoritesToCloud()
      await syncSavedToCloud()
      await downloadFromCloud()
      
      toast.success('Cloud sync complete', { id: 'cloud-sync' })
    } catch (error) {
      console.error('Full sync failed:', error)
      toast.error('Sync failed', { id: 'cloud-sync' })
    }
  }, [session, syncHistoryToCloud, syncFavoritesToCloud, syncSavedToCloud, downloadFromCloud])

  // Auto-sync on login
  useEffect(() => {
    if (session?.user && autoSync) {
      performFullSync()
    }
  }, [session?.user, autoSync])

  // Periodic sync
  useEffect(() => {
    if (!session?.user || !autoSync) return

    const interval = setInterval(() => {
      performFullSync()
    }, syncInterval)

    return () => clearInterval(interval)
  }, [session?.user, autoSync, syncInterval, performFullSync])

  return {
    syncHistoryToCloud,
    syncFavoritesToCloud,
    syncSavedToCloud,
    downloadFromCloud,
    performFullSync
  }
}
