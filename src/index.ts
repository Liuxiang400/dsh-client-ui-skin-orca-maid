import { readFileSync } from 'node:fs'
import type { Context } from '@deepseek-ai/cordis'
import { installSkinAssets } from './vendor/skin-assets.ts'

/**
 * Read the packaged artwork allowlist from disk.
 *
 * This is deliberately a function called at apply time instead of a module-level
 * JSON import. The host keeps loaded plugin modules cached for the lifetime of
 * the process, so a module-level import would freeze the artwork allowlist at
 * process start and every artwork swap would need a full DSH restart. Reading
 * inside `apply()` means re-enabling the skin is enough to pick up a rebuilt
 * manifest. `scripts/prepare-skin-assets.mjs` still validates every entry and
 * every filename still has to match its content hash before a build succeeds.
 */
export function readSkinAssetManifest(
  manifest = new URL('../assets/runtime/manifest.json', import.meta.url),
): string[] {
  const parsed: unknown = JSON.parse(readFileSync(manifest, 'utf8'))
  if (!Array.isArray(parsed) || parsed.some(entry => typeof entry !== 'string')) {
    throw new Error('Invalid skin artwork manifest')
  }
  return parsed as string[]
}

/** Serve only this package's immutable presentation assets while the skin is enabled. */
export function apply(ctx: Context): void {
  installSkinAssets(ctx, 'orca-maid', new URL('../assets/runtime/', import.meta.url), readSkinAssetManifest())
}
