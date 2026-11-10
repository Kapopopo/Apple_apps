/**
 * Rendu d'un item du registre : /registry-previews/?id=<source/slug>&theme=light|dark
 *   &card=1          vignette de galerie (réduite, sans défilement)
 *   &page=1          aperçu composé du builder : hauteur naturelle transmise au parent (atlas-height)
 *   &skin=<thème>    tokens d'un thème du registre appliqués par-dessus ceux de la source (/api/skin.css)
 * Message accepté du parent : { type: 'atlas-skin', light, dark, radius } (éditeur de thème, en direct).
 * Chargé dans un iframe sandboxé (allow-scripts) : pas d'accès au stockage ni à la page parente.
 */
import { Component, StrictMode, isValidElement, useState, type ComponentType, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { ITEMS } from './generated/registry';
import './base.css';

const params = new URLSearchParams(location.search);
const id = params.get('id') ?? '';
const dark = params.get('theme') === 'dark';
const pageMode = params.get('page') === '1';
const skin = params.get('skin') ?? '';
document.documentElement.classList.toggle('dark', dark);
document.documentElement.dataset.theme = dark ? 'dark' : 'light';
document.documentElement.classList.toggle('card', params.get('card') === '1');
document.documentElement.classList.toggle('page', pageMode);

const notify = (status: 'ready' | 'error', message?: string) => parent.postMessage({ type: 'atlas-preview', id, status, message }, '*');

/* ---------- Skin : custom properties uniquement, valeurs simples (même règle que le serveur) ---------- */

const VAR_NAME = /^--[a-z0-9-]{1,40}$/;
const SAFE_VALUE = /^[#(),.%\w\s\-/]{1,100}$/;
type Vars = Record<string, unknown>;
const declarations = (vars: Vars) =>
  Object.entries(vars ?? {})
    .filter(([k, v]) => VAR_NAME.test(k) && typeof v === 'string' && SAFE_VALUE.test(v) && !v.includes('/*'))
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');

function applySkin(light: Vars, darkVars: Vars, radius?: unknown) {
  const rootVars = { ...light, ...(typeof radius === 'string' ? { '--radius': radius } : {}) };
  let style = document.getElementById('atlas-skin') as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = 'atlas-skin';
  }
  style.textContent = `:root {\n${declarations(rootVars)}\n}\n.dark, [data-theme="dark"] {\n${declarations(darkVars)}\n}\n`;
  document.head.append(style); // toujours en dernier : l'emporte sur les feuilles de la source
}

window.addEventListener('message', (e) => {
  if (e.source !== parent || e.data?.type !== 'atlas-skin') return;
  applySkin(e.data.light, e.data.dark, e.data.radius);
});

function loadSkinSheet(): Promise<void> {
  if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(skin)) return Promise.resolve();
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `/api/skin.css?id=${encodeURIComponent(skin)}`;
    link.onload = link.onerror = () => resolve();
    document.head.append(link);
  });
}

/* ---------- Mode page : hauteur transmise au builder ---------- */

if (pageMode) {
  let last = 0;
  const report = () => {
    const height = Math.ceil(document.documentElement.scrollHeight);
    if (Math.abs(height - last) < 2) return;
    last = height;
    parent.postMessage({ type: 'atlas-height', id, height }, '*');
  };
  new ResizeObserver(report).observe(document.documentElement);
  window.addEventListener('load', report);
}

/* ---------- Rendu ---------- */

function Failure({ message }: { message: string }) {
  return (
    <div className="atlas-failure">
      <strong>Aperçu indisponible</strong>
      <p>{message}</p>
      <small>Le code reste disponible dans le registre et via get_component.</small>
    </div>
  );
}

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    notify('error', error.message);
    console.error(error, info.componentStack);
  }
  render() {
    return this.state.error ? <Failure message={this.state.error.message} /> : this.props.children;
  }
}

const isComponent = (v: unknown): v is ComponentType =>
  typeof v === 'function' || (typeof v === 'object' && v !== null && '$$typeof' in v && !isValidElement(v));

function pick(mod: Record<string, unknown>, exportName: string | null): ComponentType | undefined {
  if (exportName && isComponent(mod[exportName])) return mod[exportName] as ComponentType;
  if (isComponent(mod.default)) return mod.default as ComponentType;
  const named = Object.entries(mod).filter(([k, v]) => /^[A-Z]/.test(k) && isComponent(v));
  return (named.find(([k]) => !/(Provider|Context|Root|Item|Trigger|Content)$/.test(k)) ?? named[0])?.[1] as ComponentType | undefined;
}

/** Sons d'interface : un bouton par son ; la lecture démarre au clic (règle des navigateurs). */
function SoundPad({ names, play }: { names: string[]; play: (name: string) => unknown }) {
  const [last, setLast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <main className="atlas-stage">
      <div className="atlas-sound">
        {names.map((n) => (
          <button
            key={n}
            type="button"
            onClick={async () => {
              setLast(n);
              setError(null);
              try {
                await play(n);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <span aria-hidden="true">▶</span>
            {n}
          </button>
        ))}
        <p>
          {error
            ? `Lecture impossible : ${error}`
            : last
              ? `Joué : ${last}`
              : 'Cliquer pour écouter · son synthétisé (Web Audio), sans fichier audio'}
        </p>
      </div>
    </main>
  );
}

const root = createRoot(document.getElementById('root')!);

async function boot() {
  const entry = ITEMS[id];
  if (!entry) {
    root.render(<Failure message={`Item sans aperçu live : ${id || '(aucun id)'}`} />);
    notify('error', 'unknown item');
    return;
  }
  document.title = `${entry.name} — aperçu`;
  try {
    await entry.css();
    for (const style of entry.styles) await style();
    await loadSkinSheet();
    const mod = await entry.load();
    if (entry.sound) {
      const engine = entry.engine ? await entry.engine() : null;
      const play =
        entry.sound.engine === 'bencho'
          ? (name: string) => (mod.play as (n: string) => unknown)(name)
          : () => (engine?.playSound as (recipe: unknown) => unknown)(mod.default);
      root.render(
        <StrictMode>
          <Boundary>
            <SoundPad names={entry.sound.names} play={play} />
          </Boundary>
        </StrictMode>,
      );
      requestAnimationFrame(() => notify('ready'));
      return;
    }
    const Preview = pick(mod, entry.exportName);
    if (!Preview) throw new Error('Aucun composant exporté à afficher sans props.');
    root.render(
      <StrictMode>
        <Boundary>
          <main className="atlas-stage">
            <Preview />
          </main>
        </Boundary>
      </StrictMode>,
    );
    requestAnimationFrame(() => notify('ready'));
  } catch (error) {
    root.render(<Failure message={(error as Error).message} />);
    notify('error', (error as Error).message);
  }
}

window.addEventListener('error', (e) => notify('error', e.message));
boot();
