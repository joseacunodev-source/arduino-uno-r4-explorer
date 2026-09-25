import { lazy, Suspense, useCallback, useState } from 'react'
import { PARTS } from './data/parts'
import type { PartConfig } from './data/parts'
import { useReducedMotion } from './hooks/useReducedMotion'
import { useAssembly } from './hooks/useAssembly'
import { Icon } from './components/Icon'
import type { InteractionMode } from './three/ArduinoScene'

const ArduinoScene = lazy(() => import('./three/ArduinoScene'))
const GITHUB_URL = 'https://github.com/joseacunodev-source/arduino-uno-r4-explorer'

function ArduinoMark() {
  return <svg className="brand-mark" width="46" height="29" viewBox="0 0 64 40" fill="none" aria-hidden="true"><path d="M32 20C9-8-3 20 12 29c8 5 14-2 20-9S44 6 52 11c15 9 3 37-20 9Z" stroke="currentColor" strokeWidth="3.4"/><path d="M11 20h11m20 0h11m-5.5-5.5v11" stroke="currentColor" strokeWidth="2"/></svg>
}

const stages = [
  { name: 'Explore', title: <>Inside<br />the board<span className="accent-period">.</span></>, description: 'Big ideas start with small parts.\nGet a little closer to the UNO R4 WiFi.' },
  { name: 'Assemble', title: <>Every part.<br />A purpose<span className="accent-period">.</span></>, description: 'From a single connection to a complete system.\nKeep scrolling. Watch it come together.' },
  { name: 'Create', title: <>Ready for<br />your next idea<span className="accent-period">.</span></>, description: 'One board. A world of possibilities.\nNow you know what’s inside.' },
]

export default function App() {
  const reducedMotion = useReducedMotion()
  const { section, progress, percent, goTo } = useAssembly(reducedMotion)
  const [mode, setMode] = useState<InteractionMode>('move')
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [resetToken, setResetToken] = useState(0)
  const [ready, setReady] = useState(false)
  const [configs, setConfigs] = useState<readonly PartConfig[]>(PARTS)
  const [activeFilter, setActiveFilter] = useState('All components')
  const [detail, setDetail] = useState<string | null>(null)
  const currentStage = percent < 20 ? 0 : percent < 96 ? 1 : 2
  const stage = stages[currentStage]
  const activePart = configs.find((part) => part.id === (hovered ?? selected))
  const highlightedPart = configs.find((part) => part.id === detail)
  const onReady = useCallback((parts: readonly PartConfig[]) => { setConfigs(parts); setReady(true) }, [])
  const categories = ['All components', ...new Set(configs.filter((part) => part.id !== 'pcb').map((part) => part.category))]
  const visibleParts = configs.filter((part) => part.id !== 'pcb' && (activeFilter === 'All components' || part.category === activeFilter))

  const reset = () => {
    setResetToken((value) => value + 1)
    setSelected(null)
    setHovered(null)
    goTo(0)
  }

  return <>
    <a className="skip-link" href="#architecture">Skip to component information</a>
    <main>
      <section ref={section} className="assembly-scroll" id="experience" aria-label="Interactive board assembly">
        <div className="experience-sticky">
          <header className="site-header">
            <a href="#experience" className="brand" aria-label="UNO R4 explorer home" onClick={(event) => { event.preventDefault(); goTo(0) }}><ArduinoMark /><span className="brand-divider" /><span>UNO <strong>R4</strong><small>WIFI</small></span></a>
            <nav aria-label="Main navigation"><a className="nav-current" href="#experience">Experience</a><a href="#architecture">The components</a><a href="#specifications">Specifications</a></nav>
            <a className="source-link" href={GITHUB_URL} target="_blank" rel="noreferrer">View project <span aria-hidden="true">↗</span></a>
          </header>

          <div className="hero-copy">
            <div className="eyebrow"><span className="tiny-square" /> ARDUINO UNO R4 WIFI</div>
            <h1>{stage.title}</h1>
            <p className="hero-description">{stage.description}</p>
            <button className="text-action" onClick={() => goTo(currentStage === 2 ? 0 : 1)}>{currentStage === 2 ? 'Take it apart again' : 'Bring it all together'} <Icon name={currentStage === 2 ? 'reset' : 'arrow'} /></button>
            <div className="hero-caption"><span className="caption-rule" /><span>AN INTERACTIVE EXPLORATION<br /><span className="muted">Designed to be taken apart.</span></span></div>
          </div>

          <div className="scene-area" data-testid="scene-area">
            <div className="scene-corner scene-corner-tl" /><div className="scene-corner scene-corner-tr" />
            <div className="scene-label"><span className="status-dot" /> {percent >= 96 ? 'ASSEMBLED VIEW' : 'EXPLODED VIEW'}<span className="scene-edition">UNO / R4 — 001</span></div>
            <Suspense fallback={null}><ArduinoScene progress={progress} selected={selected} onSelect={setSelected} onHover={setHovered} onReady={onReady} mode={mode} resetToken={resetToken} reducedMotion={reducedMotion} /></Suspense>
            {!ready && <div className="model-loading" role="status"><span>PREPARING THE BOARD</span><div className="loading-line" /></div>}
            <div className={`part-tooltip ${activePart ? 'is-visible' : ''}`} aria-live="polite"><span className="eyebrow">{activePart?.category ?? 'COMPONENT'}</span><strong>{activePart?.name ?? 'Explore the board'}</strong><span>{activePart?.spec ?? 'Select a part to inspect'}</span></div>
            <div className="scene-controls" role="group" aria-label="3D scene controls">
              <div className="interaction-modes"><button aria-pressed={mode === 'move'} onClick={() => setMode('move')} title="Move individual parts while exploded"><Icon name="move" /><span>Move parts</span></button><button aria-pressed={mode === 'rotate'} onClick={() => setMode('rotate')}><Icon name="rotate" /><span>Rotate</span></button></div>
              <button className="reset-button" onClick={reset} aria-label="Reset parts and view" title="Reset parts and view"><Icon name="reset" /></button>
            </div>
            <div className="canvas-hint">{percent < 15 && mode === 'move' ? 'Drag a part to explore. Drag the space to rotate.' : 'Drag to rotate. Scroll up to take it apart.'}</div>
          </div>

          <div className="assembly-footer">
            <button className="scroll-prompt" onClick={() => goTo(percent >= 96 ? 0 : Math.min(1, progress.current + 0.25))}><span className="scroll-icon"><Icon name="chevron" size={16} /></span><span>{percent >= 96 ? 'SCROLL UP TO EXPLODE' : 'SCROLL TO ASSEMBLE'}</span></button>
            <div className="assembly-timeline">
              <div className="timeline-labels">{stages.map((item, index) => <button key={item.name} onClick={() => goTo([0, 0.5, 1][index])} aria-current={currentStage === index ? 'step' : undefined}><span>0{index + 1}</span> {item.name}</button>)}</div>
              <input className="assembly-slider" type="range" min="0" max="100" value={percent} onChange={(event) => goTo(Number(event.target.value) / 100, true)} aria-label="Assembly progress" aria-valuetext={`${percent}% assembled`} style={{ '--progress': `${percent}%` } as React.CSSProperties} />
            </div>
            <div className="progress-number"><span>{String(percent).padStart(2, '0')}</span><span className="percent-symbol">%</span><small>ASSEMBLED</small></div>
          </div>
          <div className="stage-status" aria-live="polite" aria-atomic="true">{stage.name}: {currentStage === 0 ? 'Board exploded. Individual parts can be moved.' : currentStage === 1 ? 'Components are coming together.' : 'The board is fully assembled.'}</div>
        </div>
      </section>

      <section className="architecture-section content-section" id="architecture">
        <div className="section-topline"><span className="eyebrow">01 / THE ANATOMY</span><span className="eyebrow muted">A CLOSER LOOK</span></div>
        <div className="section-heading"><h2>Small details.<br />Remarkable potential.</h2><p>Meet the components that turn a spark of curiosity into something you can build.</p></div>
        <div className="component-filters" role="group" aria-label="Filter components">{categories.map((category) => <button key={category} aria-pressed={activeFilter === category} onClick={() => setActiveFilter(category)}>{category}</button>)}</div>
        <div className="component-list">{visibleParts.map((part, index) => <div className={`component-row ${detail === part.id ? 'is-open' : ''}`} key={part.id}>
          <button onClick={() => { setDetail(detail === part.id ? null : part.id); setSelected(part.id) }} aria-expanded={detail === part.id} aria-controls={`detail-${part.id}`}><span className="component-index">{String(index + 1).padStart(2, '0')}</span><strong>{part.name}</strong><span className="component-spec">{part.spec}</span><span className="component-category">{part.category}</span><Icon name={detail === part.id ? 'close' : 'plus'} /></button>
          <div className="component-detail" id={`detail-${part.id}`} hidden={detail !== part.id}><p>{part.description}</p><button className="text-action" onClick={() => { setSelected(part.id); goTo(0) }}>Find on the board <Icon name="arrow" /></button></div>
        </div>)}</div>
        <p className="component-note">Select a component to discover its role. {highlightedPart ? `Currently exploring: ${highlightedPart.name}.` : 'All component information is available without the 3D view.'}</p>
      </section>

      <section className="specifications-section content-section" id="specifications">
        <div className="section-topline"><span className="eyebrow">02 / BUILT TO BUILD</span><a className="eyebrow spec-source" href="https://docs.arduino.cc/hardware/uno-r4-wifi/" target="_blank" rel="noreferrer">OFFICIAL DOCUMENTATION ↗</a></div>
        <div className="spec-layout"><div><h2>A familiar form.<br />A new foundation.</h2><p className="spec-intro">The UNO R4 WiFi pairs a 32-bit microcontroller with wireless connectivity, in the classic UNO footprint.</p><button className="text-action" onClick={reset}>Back to the playground <Icon name="arrow" /></button></div><dl className="spec-table">
          <div><dt>Microcontroller</dt><dd>Renesas RA4M1</dd></div><div><dt>Architecture</dt><dd>32-bit Arm Cortex-M4</dd></div><div><dt>Clock speed</dt><dd>48 MHz</dd></div><div><dt>Memory</dt><dd>256 kB flash / 32 kB SRAM</dd></div><div><dt>Connectivity</dt><dd>ESP32-S3 · Wi-Fi + Bluetooth LE</dd></div><div><dt>Display</dt><dd>12 × 8 LED matrix</dd></div><div><dt>Input / output</dt><dd>14 digital / 6 analog inputs</dd></div><div><dt>Board dimensions</dt><dd>68.85 × 53.34 mm</dd></div>
        </dl></div>
      </section>
      <footer className="site-footer"><div className="footer-brand"><ArduinoMark /><span>Made for the curious.</span></div><p>An independent interactive study.<br />Arduino is a trademark of Arduino SA.</p><a href={GITHUB_URL} target="_blank" rel="noreferrer">Explore the source <span aria-hidden="true">↗</span></a><button onClick={reset} aria-label="Back to top">↑</button></footer>
    </main>
  </>
}
