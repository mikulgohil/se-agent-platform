import { MemoryStore } from "./memory-store";
import { buildSeed } from "./seed";
import type { Repository } from "./repository";

/**
 * Single source of the active repository.
 *
 * Today this resolves to a seeded in-memory store (mock mode, zero config).
 * To go to production, construct the Supabase adapter here when its env vars
 * are present — the rest of the app only knows the `Repository` interface:
 *
 *   if (process.env.SUPABASE_URL) return new SupabaseRepository(...)
 *
 * The promise is cached on `globalThis` so it survives dev HMR and is shared
 * across requests within a server process.
 */
const globalRef = globalThis as unknown as {
  __forgeRepository?: Promise<Repository>;
};

export function getRepository(): Promise<Repository> {
  if (!globalRef.__forgeRepository) {
    globalRef.__forgeRepository = buildSeed().then(
      (seed) => new MemoryStore(seed),
    );
  }
  return globalRef.__forgeRepository;
}

export type {
  Repository,
  WorkflowSummary,
  ArtifactSummary,
  DashboardMetrics,
} from "./repository";
