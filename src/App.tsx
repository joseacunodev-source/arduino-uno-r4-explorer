import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { PARTS, type PartConfig } from './data/parts'
import { useReducedMotion } from './hooks/useReducedMotion'
import { useAssembly } from './hooks/useAssembly'
import { Icon } from './components/Icon'
const ArduinoScene = lazy(() => import('./three/ArduinoScene'))

const specs = [
  ['Microcontroller', 'Renesas RA4M1'], ['Architecture', '32-bit Arm Cortex-M4'],
  ['Clock', '48 MHz'], ['Memory', '256 kB flash / 32 kB SRAM'],
  ['Wireless', 'ESP32-S3 · Wi-Fi + Bluetooth LE'], ['Display', '12 × 8 LED matrix'],
  ['I/O', '14 digital / 6 analog inputs'], ['Dimensions', '68.85 × 53.34 mm'],
]

export default function App() {
  const reducedMotion = useReducedMotion()
  const { section, progress, percent, goTo } = useAssembly(reducedMotion)
  const [selected, setSelected] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const [focusToken, setFocusToken] = useState(0)
  const [resetToken, setResetToken] = useState(0)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [entered, setEntered] = useState(false)
  const [help, setHelp] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [configs, setConfigs] = useState<readonly PartConfig[]>(PARTS)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'components' | 'specs'>('components')
  const [detail, setDetail] = useState<string | null>(null)
  const detailsButton = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const helpClose = useRef<HTMLButtonElement>(null)
  const activePart = configs.find(part => part.id === focused)
  const onReady = useCallback((parts: readonly PartConfig[]) => { setConfigs(parts); setReady(true) }, [])
  const onError = useCallback(() => { setFailed(true); setReady(true) }, [])
  const onHover = useCallback(() => {}, [])
  const visibleParts = configs.filter(part => `${part.name} ${part.category} ${part.spec}`.toLowerCase().includes(query.toLowerCase()))
  const reset = () => { setFocused(null); setResetToken(v => v + 1); setSelected(null); goTo(0) }
  const findPart = (id: string) => {
    setSelected(id); setFocused(id); setFocusToken(v => v + 1); goTo(0, true)
  }
  const closeDetails = () => { setDetailsOpen(false); detailsButton.current?.focus() }
  useEffect(() => {
    if (!ready) return
    const timer = window.setTimeout(() => { setEntered(true); if (failed) setDetailsOpen(true) }, reducedMotion ? 0 : 600)
    return () => window.clearTimeout(timer)
  }, [ready, failed, reducedMotion])
  useEffect(() => { if (percent > 15) setFocused(null) }, [percent])
  useEffect(() => {
    document.body.style.overflow = entered ? '' : 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [entered])
  useEffect(() => { if (detailsOpen) closeButton.current?.focus() }, [detailsOpen])
  useEffect(() => { if (help) helpClose.current?.focus() }, [help])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setHelp(false); setFocused(null); setDetailsOpen(false); detailsButton.current?.focus() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  return <>
    <main className={`${entered ? 'is-entered' : 'is-preparing'} ${detailsOpen ? 'has-inspector' : ''}`} inert={!entered}>
      <section ref={section} className="assembly-scroll" id="experience" aria-label="Interactive board assembly">
        <div className="experience-sticky">
          <div className="scene-area" data-testid="scene-area">
            <Suspense fallback={null}><ArduinoScene progress={progress} selected={selected} focused={focused} focusToken={focusToken} onSelect={setSelected} onHover={onHover} onReady={onReady} onError={onError} mode="move" resetToken={resetToken} reducedMotion={reducedMotion} /></Suspense>
            {activePart && <div className="focus-caption" role="status"><div><span className="focus-dot" /><strong>{activePart.name}</strong><p>{activePart.spec}</p></div><button onClick={() => setFocused(null)}>Show all <Icon name="close" size={14} /></button></div>}
          </div>
          <div className="corner-tools" role="group" aria-label="Experience controls">
            <button onClick={reset} aria-label="Reset parts and view" title="Reset"><Icon name="reset" /></button>
            <button onClick={() => setHelp(v => !v)} aria-label="Show controls" aria-expanded={help} title="Controls">?</button>
            <button ref={detailsButton} className="details-toggle" onClick={() => setDetailsOpen(v => !v)} aria-expanded={detailsOpen} aria-controls="inspector"><span className="accent-square" /> Details</button>
          </div>
          {help && <section className="help-popover" role="dialog" aria-label="Controls"><header><h2>Controls</h2><button ref={helpClose} onClick={() => setHelp(false)} aria-label="Close controls"><Icon name="close" /></button></header><dl><div><dt>Move a part</dt><dd>Left-drag a component</dd></div><div><dt>Orbit</dt><dd>Left-drag empty space</dd></div><div><dt>Zoom</dt><dd>Right-drag up / down</dd></div><div><dt>Pan</dt><dd>Middle-drag</dd></div><div><dt>Assemble</dt><dd>Scroll down</dd></div><div><dt>Disassemble</dt><dd>Scroll up</dd></div></dl><p>Touch: drag to move or orbit. Use Details for assembly and camera controls.</p></section>}
          <span className="sr-only" aria-live="polite">{percent}% assembled.</span>
        </div>
      </section>
    </main>
    {!entered && <div className={`loading-screen ${ready ? 'is-ready' : ''}`} role="status" aria-live="polite"><h1>Arduino <span>UNO R4</span><sup>WiFi</sup></h1><div className="loading-track" /></div>}
    {detailsOpen && entered && <aside id="inspector" className="inspector" aria-label="Board details">
      <header className="inspector-header"><h2>UNO R4 <span>WiFi</span></h2><button ref={closeButton} onClick={closeDetails} aria-label="Close details"><Icon name="close" /></button></header>
      <div className="inspector-tabs"><button aria-pressed={tab === 'components'} onClick={() => setTab('components')}>Components <span>{configs.length}</span></button><button aria-pressed={tab === 'specs'} onClick={() => setTab('specs')}>Specifications</button></div>
      <div className="inspector-body">
        <div className="assembly-control"><div><label htmlFor="assembly">Assembly</label><output>{percent}%</output></div><input id="assembly" type="range" min="0" max="100" value={percent} onChange={e => { setFocused(null); goTo(Number(e.target.value) / 100, true) }} aria-label="Assembly progress" /><div className="assembly-actions"><button onClick={() => { setFocused(null); goTo(0, true) }}>Explode</button><button onClick={() => { setFocused(null); goTo(1, true) }}>Assemble</button></div></div>
        {tab === 'components' ? <>
          <label className="search-label"><span className="sr-only">Search components</span><input type="search" placeholder="Search components" value={query} onChange={e => setQuery(e.target.value)} /></label>
          <div className="component-list">{visibleParts.map((part, index) => <article className={`component-row ${detail === part.id ? 'is-open' : ''} ${focused === part.id ? 'is-focused' : ''}`} key={part.id}>
            <button className="component-trigger" onClick={() => setDetail(detail === part.id ? null : part.id)} aria-expanded={detail === part.id} aria-controls={`detail-${part.id}`}><span className="component-index">{String(index + 1).padStart(2, '0')}</span><span>{part.name}<small>{part.category}</small></span><Icon name={detail === part.id ? 'close' : 'plus'} size={15} /></button>
            {detail === part.id && <div className="component-detail" id={`detail-${part.id}`}><p>{part.description}</p><p className="component-spec">{part.spec}</p><button className="find-button" onClick={() => findPart(part.id)}>Find on board <Icon name="arrow" size={16} /></button></div>}
          </article>)}</div>
          {visibleParts.length === 0 && <p className="empty-results">No matching components.</p>}
        </> : <><dl className="spec-table">{specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><a className="documentation-link" href="https://docs.arduino.cc/hardware/uno-r4-wifi/" target="_blank" rel="noreferrer">Arduino documentation ↗</a></>}
        <details className="camera-controls"><summary>Camera controls</summary><div>{[['Orbit left','left'],['Orbit right','right'],['Tilt up','up'],['Tilt down','down'],['View underside','bottom'],['Zoom in','in'],['Zoom out','out']].map(([label, action]) => <button key={action} onClick={() => window.dispatchEvent(new CustomEvent('board-camera', { detail: action }))}>{label}</button>)}<button onClick={reset}>Reset view</button></div></details>
        <footer className="details-credit">Original hardware design: Arduino.<br />Independent interactive visualization.</footer>
      </div>
    </aside>}
  </>
}
