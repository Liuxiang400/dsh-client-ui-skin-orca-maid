import { skinAssetUrl } from './asset-url.ts'

/**
 * ORCA MAID artwork layers. None of them carries lettering or fake controls:
 * live DSH content owns the readable layer.
 *
 * Every entry must point at a content-hashed file inside `assets/runtime/`.
 * `scripts/prepare-skin-assets.mjs` builds the served allowlist from these
 * calls and fails the build when a filename does not match its own bytes, so a
 * layer can only be swapped by writing the new bytes under their SHA-256 name
 * and updating the reference here. The workspace helper does both:
 *
 *   python3 scripts/swap-art.py <role> <image> [--webp [quality]]
 *
 * Roles: status-atlas, light-hero, light-active, dark-hero, dark-active,
 * boot-repair, page-icon-192, page-icon-512.
 */

export const ORCA_MAID_STATUS_ATLAS = skinAssetUrl('60a3dbbdea69c3de72cc84f963cea2cb63c50ba24ef01c3da74dac78df5afc8d.webp')

export const ORCA_MAID_LIGHT_HERO_ART = skinAssetUrl('50ed623fceb5242fed25785796b3edc41b789c3a992ad527412729ffe498cc6f.webp')
export const ORCA_MAID_LIGHT_ACTIVE_ART = skinAssetUrl('373e4c4566a5e44840be85db602b17978eafaf9be58db99231c2d3d490fefb2d.webp')

export const ORCA_MAID_DARK_HERO_ART = skinAssetUrl('d56f5ce44daf1dcba4c7f2275303a5338bcb1708d96de28cbb929a329d7aaf4b.webp')
export const ORCA_MAID_DARK_ACTIVE_ART = skinAssetUrl('abf01295bcd677eac0b295092cba9e2d375123d8204276b40d6902a355b2e4f7.webp')
