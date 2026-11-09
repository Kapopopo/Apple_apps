/**
 * Rendu d'un item du registre : /registry-previews/?id=<source/slug>&theme=light|dark
 * Chargé dans un iframe sandboxé (allow-scripts) : pas d'accès au stockage ni à la page parente.
 */
import { Component, StrictMode, isValidElement, type ComponentType, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { ITEMS } from './generated/registry';
import './base.css';

const params = new URLSearchParams(location.search);
const id = params.get('id') ?? '';
const dark = params.get('theme') === 'dark';
document.documentElement.classList.toggle('dark', dark);
document.documentElement.dataset.theme = dark ? 'dark' : 'light';
document.documentElement.classList.toggle('card', params.get('card') === '1');

const notify = (status: 'ready' | 'error', message?: string) => parent.postMessage({ type: 'atlas-preview', id, status, message }, '*');

function Failure({ message }: { message: string }) {
  return <div className="atlas-failure"><strong>Aperçu indisponible</strong><p>{message}</p><small>Le code reste disponible dans le registre et via get_component.</small></div>;
}

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { notify('error', error.message); console.error(error, info.componentStack); }
  render() { return this.state.error ? <Failure message={this.state.error.message} /> : this.props.children; }
}

const isComponent = (v: unknown): v is ComponentType => typeof v === 'function' || (typeof v === 'object' && v !== null && '$$typeof' in v && !isValidElement(v));

function pick(mod: Record<string, unknown>, exportName: string | null): ComponentType | undefined {
  if (exportName && isComponent(mod[exportName])) return mod[exportName] as ComponentType;
  if (isComponent(mod.default)) return mod.default as ComponentType;
  const named = Object.entries(mod).filter(([k, v]) => /^[A-Z]/.test(k) && isComponent(v));
  return (named.find(([k]) => !/(Provider|Context|Root|Item|Trigger|Content)$/.test(k)) ?? named[0])?.[1] as ComponentType | undefined;
}

const root = createRoot(document.getElementById('root')!);

async function boot() {
  const entry = ITEMS[id];
  if (!entry) { root.render(<Failure message={`Item sans aperçu live : ${id || '(aucun id)'}`} />); notify('error', 'unknown item'); return; }
  document.title = `${entry.name} — aperçu`;
  try {
    await entry.css();
    for (const style of entry.styles) await style();
    const mod = await entry.load();
    const Preview = pick(mod, entry.exportName);
    if (!Preview) throw new Error('Aucun composant exporté à afficher sans props.');
    root.render(<StrictMode><Boundary><main className="atlas-stage"><Preview /></main></Boundary></StrictMode>);
    requestAnimationFrame(() => notify('ready'));
  } catch (error) {
    root.render(<Failure message={(error as Error).message} />);
    notify('error', (error as Error).message);
  }
}

window.addEventListener('error', (e) => notify('error', e.message));
boot();
