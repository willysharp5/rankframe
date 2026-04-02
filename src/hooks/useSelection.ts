import { useEffect, useState } from "react"
import { framer, type CanvasNode } from "framer-plugin"

export function useSelection() {
  const [selection, setSelection] = useState<CanvasNode[]>([])

  useEffect(() => {
    let cancelled = false

    void framer
      .getSelection()
      .then((nodes) => {
        if (!cancelled) setSelection(nodes)
      })
      .catch(() => {
        if (!cancelled) setSelection([])
      })

    const unsubscribe = framer.subscribeToSelection((nodes) => {
      if (!cancelled) setSelection(nodes)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return selection
}
