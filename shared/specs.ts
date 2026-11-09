/**
 * Stockage des specs (specs/<nom>.json) et des presets (specs/presets/<nom>.json), partagé par
 * le serveur web et le serveur MCP. Chaque remplacement ou suppression garde une copie dans
 * specs/.history/ : une spec n'est jamais perdue par une fausse manœuvre.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PRESETS, ROOT, SPECS, SPEC_HISTORY, toPosix } from './paths.js';
import { BLOCK_TYPES, Spec, SpecInput, SPEC_NAME, type IndexEntry } from './schema.js';

export interface StoredSpec { spec: Spec; file: string; preset: boolean }
export interface SpecVersion { stamp: string; at: string; title: string; blocks: number; deleted: boolean }
export type SaveResult = { ok: true; spec: Spec; file: string } | { ok: false; status: number; error: string; exists?: boolean };

const HISTORY_LIMIT = 30;
const folder = (preset: boolean) => (preset ? PRESETS : SPECS);
const fileOf = (name: string, preset: boolean) => path.join(folder(preset), `${name}.json`);
const historyDir = (name: string, preset: boolean) => path.join(SPEC_HISTORY, preset ? 'presets' : 'specs', name);
const rel = (file: string) => toPosix(path.relative(ROOT, file));

function readSpec(file: string): Spec | null {
  try { return Spec.parse(JSON.parse(fs.readFileSync(file, 'utf8'))); } catch { return null; }
}

export function listSpecs(): StoredSpec[] {
  const out: StoredSpec[] = [];
  for (const preset of [false, true]) {
    const dir = folder(preset);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
      const spec = readSpec(path.join(dir, f));
      if (spec) out.push({ spec, file: rel(path.join(dir, f)), preset });
    }
  }
  return out;
}

/** Sans précision, une spec personnelle prime sur un preset du même nom. */
export function getSpec(name: string, preset?: boolean): StoredSpec | undefined {
  const clean = name.replace(/\.json$/, '');
  if (!SPEC_NAME.test(clean)) return undefined;
  for (const p of preset === undefined ? [false, true] : [preset]) {
    const file = fileOf(clean, p);
    const spec = fs.existsSync(file) ? readSpec(file) : null;
    if (spec) return { spec, file: rel(file), preset: p };
  }
  return undefined;
}

/** Vérifie que chaque id existe dans le registre et a le bon type. */
export function checkReferences(spec: Spec, items: Pick<IndexEntry, 'id' | 'type'>[]): string[] {
  const types = new Map(items.map((i) => [i.id, i.type]));
  const errors: string[] = [];
  const expect = (id: string, allowed: readonly string[], label: string) => {
    const type = types.get(id);
    if (!type) errors.push(`${label} inconnu : ${id}`);
    else if (!allowed.includes(type)) errors.push(`${label} invalide : ${id} est de type ${type}`);
  };
  if (spec.theme) expect(spec.theme, ['theme'], 'Thème');
  for (const id of spec.fonts) expect(id, ['font'], 'Police');
  for (const id of spec.easings) expect(id, ['easing'], 'Easing');
  for (const id of spec.sounds) expect(id, ['sound'], 'Son');
  for (const b of spec.blocks) expect(b.id, BLOCK_TYPES, 'Bloc');
  return errors;
}

function archive(name: string, preset: boolean, deleted = false) {
  const file = fileOf(name, preset);
  if (!fs.existsSync(file)) return;
  const dir = historyDir(name, preset);
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.copyFileSync(file, path.join(dir, `${stamp}${deleted ? '.deleted' : ''}.json`));
  const versions = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  for (const old of versions.slice(0, Math.max(0, versions.length - HISTORY_LIMIT))) fs.rmSync(path.join(dir, old));
}

function writeAtomic(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(tmp, file);
}

/** Enregistre une spec validée ; refuse d'écraser sans `overwrite` (409), archive la version remplacée. */
export function saveSpec(raw: unknown, items: Pick<IndexEntry, 'id' | 'type'>[], options: { overwrite?: boolean } = {}): SaveResult {
  const parsed = SpecInput.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, status: 400, error: `Spec invalide (${issue.path.join('.') || 'racine'}) : ${issue.message}` };
  }
  const input = parsed.data;
  const errors = checkReferences({ ...input } as Spec, items);
  if (errors.length) return { ok: false, status: 400, error: errors.join(' · ') };
  const file = fileOf(input.name, input.preset);
  const previous = fs.existsSync(file) ? readSpec(file) : null;
  if (previous && !options.overwrite) return { ok: false, status: 409, error: `${input.preset ? 'Le preset' : 'La spec'} « ${input.name} » existe déjà`, exists: true };
  if (previous) archive(input.name, input.preset);
  const now = new Date().toISOString();
  const spec: Spec = { ...input, createdAt: previous?.createdAt ?? now, updatedAt: now };
  writeAtomic(file, spec);
  return { ok: true, spec, file: rel(file) };
}

export function deleteSpec(name: string, preset: boolean): boolean {
  const file = fileOf(name, preset);
  if (!SPEC_NAME.test(name) || !fs.existsSync(file)) return false;
  archive(name, preset, true);
  fs.rmSync(file);
  return true;
}

export function renameSpec(name: string, to: string, preset: boolean): SaveResult {
  if (!SPEC_NAME.test(name) || !SPEC_NAME.test(to)) return { ok: false, status: 400, error: 'Nom invalide : minuscules, chiffres et tirets' };
  const from = fileOf(name, preset), target = fileOf(to, preset);
  const spec = fs.existsSync(from) ? readSpec(from) : null;
  if (!spec) return { ok: false, status: 404, error: 'Spec introuvable' };
  if (fs.existsSync(target)) return { ok: false, status: 409, error: `« ${to} » existe déjà`, exists: true };
  const renamed: Spec = { ...spec, name: to, updatedAt: new Date().toISOString() };
  writeAtomic(target, renamed);
  fs.rmSync(from);
  // L'historique suit la spec (fusionné avec celui d'une ancienne spec du même nom, s'il existe).
  const oldHistory = historyDir(name, preset), newHistory = historyDir(to, preset);
  if (fs.existsSync(oldHistory)) {
    fs.mkdirSync(newHistory, { recursive: true });
    for (const f of fs.readdirSync(oldHistory)) fs.renameSync(path.join(oldHistory, f), path.join(newHistory, f));
    fs.rmSync(oldHistory, { recursive: true, force: true });
  }
  return { ok: true, spec: renamed, file: rel(target) };
}

export function specHistory(name: string, preset: boolean): SpecVersion[] {
  const dir = historyDir(name, preset);
  if (!SPEC_NAME.test(name) || !fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().reverse().map((f) => {
    const spec = readSpec(path.join(dir, f));
    const stamp = f.replace(/\.json$/, '');
    return { stamp, at: spec?.updatedAt ?? stamp, title: spec?.title ?? '', blocks: spec?.blocks.length ?? 0, deleted: stamp.endsWith('.deleted') };
  });
}

export function specVersion(name: string, stamp: string, preset: boolean): Spec | null {
  if (!SPEC_NAME.test(name) || !/^[\w.-]+$/.test(stamp)) return null;
  const file = path.join(historyDir(name, preset), `${stamp}.json`);
  return fs.existsSync(file) ? readSpec(file) : null;
}
