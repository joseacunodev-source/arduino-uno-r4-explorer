import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { clamp01 } from '../lib/assembly'

gsap.registerPlugin(ScrollTrigger)

export function useAssembly(reducedMotion: boolean) {
  const section = useRef<HTMLElement>(null)
  const progress = useRef(0)
  const trigger = useRef<ScrollTrigger | null>(null)
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    const update = (self: ScrollTrigger) => {
      progress.current = self.progress
      setPercent(Math.round(self.progress * 100))
    }
    const scroll = ScrollTrigger.create({
      trigger: section.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: update,
      onRefresh: update,
      invalidateOnRefresh: true,
    })
    trigger.current = scroll
    return () => { scroll.kill(); trigger.current = null }
  }, [])

  const goTo = useCallback((value: number, immediate = false) => {
    const scroll = trigger.current
    if (!scroll) return
    window.scrollTo({
      top: scroll.start + clamp01(value) * (scroll.end - scroll.start),
      behavior: reducedMotion || immediate ? 'instant' : 'smooth',
    })
  }, [reducedMotion])

  return { section, progress, percent, goTo }
}
