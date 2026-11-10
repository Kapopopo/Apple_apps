import { appendLog, existingIds, writeItem, type Draft, type FileMap, type RunLog } from '../../shared/registry.js';

/** Suit un passage d'import : ajoutés, mis à jour, inchangés, sautés (avec raison), disparus en amont. */
export class Collector {
  readonly run: RunLog & { warnings: string[] };
  private seen = new Set<string>();

  constructor(importer: string, source: string, extra: Partial<RunLog> = {}) {
    this.run = {
      importer,
      source,
      at: new Date().toISOString(),
      added: [],
      updated: [],
      unchanged: 0,
      missingUpstream: [],
      skipped: [],
      warnings: [],
      ...extra,
    };
  }

  write(draft: Draft, files: FileMap, extraFiles?: FileMap) {
    if (this.seen.has(draft.id)) {
      this.skip(draft.id, 'Identifiant déjà produit par ce passage (doublon ignoré)');
      return;
    }
    this.seen.add(draft.id);
    const result = writeItem(draft, files, extraFiles);
    if (result === 'added') this.run.added.push(draft.id);
    else if (result === 'updated') this.run.updated.push(draft.id);
    else this.run.unchanged++;
  }

  skip(item: string, reason: string) {
    this.run.skipped.push({ item, reason });
  }
  /** Item volontairement laissé à un autre importer : ni réécrit, ni signalé absent en amont. */
  keep(id: string) {
    this.seen.add(id);
    this.run.unchanged++;
  }
  warn(message: string) {
    this.run.warnings.push(message);
  }

  finish(sourceIds: string[]): RunLog {
    for (const sourceId of sourceIds) for (const id of existingIds(sourceId)) if (!this.seen.has(id)) this.run.missingUpstream.push(id);
    appendLog(this.run);
    const r = this.run;
    console.log(
      `[${r.importer}:${r.source}] +${r.added.length} ajoutés · ${r.updated.length} mis à jour · ${r.unchanged} inchangés · ${r.skipped.length} sautés${r.missingUpstream.length ? ` · ${r.missingUpstream.length} absents en amont (conservés)` : ''}${r.warnings.length ? ` · ${r.warnings.length} avertissements` : ''}`,
    );
    for (const s of r.skipped) console.log(`  ↷ ${s.item} : ${s.reason}`);
    return r;
  }
}
