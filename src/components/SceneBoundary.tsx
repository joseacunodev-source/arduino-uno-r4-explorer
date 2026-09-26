import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react'

export function SceneFallback({ onError }: { onError: () => void }) {
  useEffect(() => { onError() }, [onError])
  return <div className="scene-fallback" role="status"><h2>3D view unavailable</h2><p>This browser could not start the 3D view. Open Details to explore every component and specification.</p><button className="retry-view" onClick={() => window.location.reload()}>Try again</button></div>
}

export class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Arduino scene unavailable', error.message, info.componentStack) }
  render() { return this.state.failed ? <SceneFallback onError={this.props.onError} /> : this.props.children }
}
