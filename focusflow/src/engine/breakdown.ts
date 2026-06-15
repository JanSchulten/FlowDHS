import type { Project, Subtask, Tag } from '../types';

/**
 * ADHD-informed task breakdown.
 *
 * Two evidence-based ideas drive this:
 *  1. Lower the activation energy: always start with a tiny, almost-trivial
 *     "starter" step so beginning feels safe.
 *  2. Chunking: split the estimated work into focus-sized blocks (~25 min)
 *     so each step is concrete and finishable in one sitting.
 */

const TAG_SCAFFOLD: Record<Tag, string[]> = {
  focus: ['Quellen/Notizen sammeln', 'Rohfassung schreiben', 'Überarbeiten & kürzen'],
  creative: ['Referenzen & Ideen sammeln', 'Grobentwurf bauen', 'Verfeinern & polieren'],
  energy: ['Aufwärmen / Setup', 'Hauptdurchgang', 'Abschluss & aufräumen'],
  admin: ['Unterlagen zusammensuchen', 'Durcharbeiten', 'Abschicken / ablegen'],
};

export function suggestSteps(project: Pick<Project, 'name' | 'estimateMins' | 'tag'>): Omit<Subtask, 'id'>[] {
  const steps: Omit<Subtask, 'id'>[] = [];

  // 1. Tiny starter — the hardest part is starting.
  steps.push({ name: '🐣 Nur anfangen: Material/Tab öffnen (2 Min)', dur: 2, done: false });

  // 2. Tag-specific scaffold gives semantic structure.
  const scaffold = TAG_SCAFFOLD[project.tag] ?? TAG_SCAFFOLD.focus;

  // 3. Chunk the remaining estimate into ~25 min blocks, distributed over the scaffold.
  const remaining = Math.max(0, (project.estimateMins || 60) - 2);
  const blockCount = Math.max(scaffold.length, Math.min(8, Math.ceil(remaining / 25)));
  const perBlock = Math.max(15, Math.round(remaining / blockCount / 5) * 5);

  for (let i = 0; i < blockCount; i++) {
    const label = scaffold[Math.min(i, scaffold.length - 1)];
    const suffix = blockCount > scaffold.length ? ` (${i + 1}/${blockCount})` : '';
    steps.push({ name: `${label}${suffix}`, dur: perBlock, done: false });
  }

  return steps;
}
