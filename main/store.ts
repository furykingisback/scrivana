import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface SessionData {
  docs: unknown[];
  activeId: string;
}

interface StoreShape {
  recents: string[];
  session?: SessionData;
}

function storePath(): string {
  return path.join(app.getPath('userData'), 'app-state.json');
}

function read(): StoreShape {
  try {
    const raw = fs.readFileSync(storePath(), 'utf-8');
    const data = JSON.parse(raw) as Partial<StoreShape>;
    return { recents: Array.isArray(data.recents) ? data.recents : [], session: data.session };
  } catch {
    return { recents: [] };
  }
}

function write(shape: StoreShape): void {
  try {
    fs.mkdirSync(path.dirname(storePath()), { recursive: true });
    fs.writeFileSync(storePath(), JSON.stringify(shape, null, 2), 'utf-8');
  } catch {
    /* noop */
  }
}

export function loadSession(): SessionData | null {
  return read().session ?? null;
}

export function saveSession(session: SessionData): void {
  const shape = read();
  shape.session = session;
  write(shape);
}

export function clearSession(): void {
  const shape = read();
  delete shape.session;
  write(shape);
}

export function loadRecents(): string[] {
  return read().recents ?? [];
}

export function addRecent(filePath: string): string[] {
  const shape = read();
  shape.recents = [filePath, ...(shape.recents ?? []).filter((r) => r !== filePath)].slice(0, 12);
  write(shape);
  return shape.recents;
}

export function removeRecent(filePath: string): string[] {
  const shape = read();
  shape.recents = (shape.recents ?? []).filter((r) => r !== filePath);
  write(shape);
  return shape.recents;
}

export function clearRecents(): string[] {
  const shape = read();
  shape.recents = [];
  write(shape);
  return [];
}
