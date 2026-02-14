/**
 * Container Registry - Track all user instances
 * Adapted from openclaw-core/src/agents/sandbox/registry.ts
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { USER_DATA_BASE } from '../config';

const REGISTRY_DIR = join(USER_DATA_BASE, '..', 'registry');
const REGISTRY_PATH = join(REGISTRY_DIR, 'containers.json');

export type InstanceRegistryEntry = {
  containerName: string;
  userId: string;
  instanceId: string;
  createdAtMs: number;
  lastUsedAtMs: number;
  port: number;
  image: string;
  configHash?: string;
};

type InstanceRegistry = {
  entries: InstanceRegistryEntry[];
};

export async function readRegistry(): Promise<InstanceRegistry> {
  try {
    if (!existsSync(REGISTRY_PATH)) {
      return { entries: [] };
    }
    const raw = await readFile(REGISTRY_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as InstanceRegistry;
    if (parsed && Array.isArray(parsed.entries)) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return { entries: [] };
}

async function writeRegistry(registry: InstanceRegistry): Promise<void> {
  await mkdir(REGISTRY_DIR, { recursive: true });
  await writeFile(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, 'utf-8');
}

export async function updateRegistry(entry: InstanceRegistryEntry): Promise<void> {
  const registry = await readRegistry();
  const existing = registry.entries.find((item) => item.containerName === entry.containerName);
  const next = registry.entries.filter((item) => item.containerName !== entry.containerName);
  next.push({
    ...entry,
    createdAtMs: existing?.createdAtMs ?? entry.createdAtMs,
    image: existing?.image ?? entry.image,
    configHash: entry.configHash ?? existing?.configHash,
  });
  await writeRegistry({ entries: next });
}

export async function removeRegistryEntry(containerName: string): Promise<void> {
  const registry = await readRegistry();
  const next = registry.entries.filter((item) => item.containerName !== containerName);
  if (next.length === registry.entries.length) {
    return;
  }
  await writeRegistry({ entries: next });
}

export async function getRegistryEntryByUserId(userId: string): Promise<InstanceRegistryEntry | null> {
  const registry = await readRegistry();
  return registry.entries.find((entry) => entry.userId === userId) || null;
}
