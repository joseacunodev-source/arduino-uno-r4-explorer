export function Icon({ name, size = 18 }: { name: 'arrow' | 'rotate' | 'move' | 'reset' | 'plus' | 'close' | 'chevron' | 'github'; size?: number }) {
  const paths = {
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    rotate: <><path d="M19 8a8 8 0 1 0 1 8M19 3v5h-5" /></>,
    move: <><path d="M12 3v18M3 12h18M8 7l4-4 4 4M8 17l4 4 4-4M7 8l-4 4 4 4M17 8l4 4-4 4" /></>,
    reset: <><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    close: <><path d="m6 6 12 12M6 18 18 6" /></>,
    chevron: <><path d="m6 9 6 6 6-6" /></>,
    github: <><path d="M8 20v-3c-4 1-4-2-6-2m14 5v-4c0-1-.5-2-1-2 4-.5 6-2 6-6 0-2-1-3-2-4 0-1 0-2-.5-3-2 0-3 1-4 1a13 13 0 0 0-5 0C8 1 7 1 5 1c-.5 1-.5 2 0 3-1 1-2 2-2 4 0 4 2 5.5 6 6-.5 0-1 1-1 2" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
