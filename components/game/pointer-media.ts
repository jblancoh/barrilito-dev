const COARSE_POINTER_QUERY = "(pointer: coarse)"

type Listener = () => void

interface MediaQueryLike {
  matches: boolean
  addEventListener?: (type: "change", listener: Listener) => void
  removeEventListener?: (type: "change", listener: Listener) => void
  /** Safari < 14 only exposes the deprecated listener API. */
  addListener?: (listener: Listener) => void
  removeListener?: (listener: Listener) => void
}

interface MediaHost {
  matchMedia?: (query: string) => MediaQueryLike
}

/**
 * Reports whether the primary pointer is coarse (touch) now and on every change.
 * Works on legacy Safari and degrades to `false` where matchMedia is missing.
 */
export function subscribeCoarsePointer(host: MediaHost, onChange: (coarse: boolean) => void): () => void {
  if (typeof host.matchMedia !== "function") {
    onChange(false)
    return () => {}
  }
  const query = host.matchMedia(COARSE_POINTER_QUERY)
  const update = () => onChange(query.matches)
  update()
  if (query.addEventListener && query.removeEventListener) {
    query.addEventListener("change", update)
    return () => query.removeEventListener?.("change", update)
  }
  query.addListener?.(update)
  return () => query.removeListener?.(update)
}
