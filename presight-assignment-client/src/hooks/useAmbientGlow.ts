import { useEffect, useRef } from 'react'

export function useAmbientGlow<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 100
      const y = ((event.clientY - rect.top) / rect.height) * 100

      element.style.setProperty('--mx', `${x}%`)
      element.style.setProperty('--my', `${y}%`)
    }

    element.addEventListener('pointermove', onPointerMove, { passive: true })

    return () => {
      element.removeEventListener('pointermove', onPointerMove)
    }
  }, [])

  return ref
}
