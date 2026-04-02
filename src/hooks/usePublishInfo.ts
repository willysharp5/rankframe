import { useEffect, useState } from "react"
import { framer } from "framer-plugin"

export function usePublishInfo() {
  const [publishInfo, setPublishInfo] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    let cancelled = false

    void framer
      .getPublishInfo()
      .then((info) => {
        if (!cancelled) setPublishInfo(info as Record<string, unknown>)
      })
      .catch(() => {
        if (!cancelled) setPublishInfo(null)
      })

    const unsubscribe = framer.subscribeToPublishInfo((info) => {
      if (!cancelled) setPublishInfo((info ?? null) as Record<string, unknown> | null)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return publishInfo
}
