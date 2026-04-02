import { useEffect, useState } from "react"
import { getCollectionsSafe } from "../services/framer-helpers"

export function useCollections() {
  const [collections, setCollections] = useState<Array<{ id: string; name: string; managedBy?: string }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      const next = (await getCollectionsSafe()).map((collection) => ({
        id: collection.id,
        name: collection.name,
        managedBy: "managedBy" in collection ? String(collection.managedBy ?? "") : undefined,
      }))

      if (!cancelled) {
        setCollections(next)
        setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { collections, isLoading }
}
