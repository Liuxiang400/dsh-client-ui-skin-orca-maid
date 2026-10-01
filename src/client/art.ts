import { skinAssetUrl } from './asset-url.ts'

/**
 * Independent ORCA MAID artwork layers generated for this skin. Neither has
 * lettering or fake controls: live DSH content owns the readable layer.
 * Re-embed from a source image with:
 *   node scripts/embed-skin-art orca-maid ORCA_MAID_CHARACTER_ART <imagePath> 0
 *   node scripts/embed-skin-art orca-maid ORCA_MAID_ART <imagePath> 1920
 *   node scripts/embed-skin-art orca-maid ORCA_MAID_DARK_HERO_ART <imagePath> 1920
 *   node scripts/embed-skin-art orca-maid ORCA_MAID_DARK_ACTIVE_ART <imagePath> 1920
 *   node scripts/embed-skin-art orca-maid ORCA_MAID_LIGHT_HERO_ART <imagePath> 1920
 *   node scripts/embed-skin-art orca-maid ORCA_MAID_LIGHT_ACTIVE_ART <imagePath> 1920
 *   node scripts/embed-skin-art orca-maid ORCA_MAID_STATUS_ATLAS <imagePath> 2048
 */

export const ORCA_MAID_STATUS_ATLAS = skinAssetUrl('60a3dbbdea69c3de72cc84f963cea2cb63c50ba24ef01c3da74dac78df5afc8d.webp')

export const ORCA_MAID_LIGHT_HERO_ART = skinAssetUrl('50ed623fceb5242fed25785796b3edc41b789c3a992ad527412729ffe498cc6f.webp')
export const ORCA_MAID_LIGHT_ACTIVE_ART = skinAssetUrl('373e4c4566a5e44840be85db602b17978eafaf9be58db99231c2d3d490fefb2d.webp')

export const ORCA_MAID_DARK_HERO_ART = skinAssetUrl('d56f5ce44daf1dcba4c7f2275303a5338bcb1708d96de28cbb929a329d7aaf4b.webp')
export const ORCA_MAID_DARK_ACTIVE_ART = skinAssetUrl('abf01295bcd677eac0b295092cba9e2d375123d8204276b40d6902a355b2e4f7.webp')
export const ORCA_MAID_CHARACTER_ART = skinAssetUrl('6c4d6705e9fca5ac1f0d7a6b3b113dab157e8123d21cea53a2c399106b4f0239.webp')

export const ORCA_MAID_SIDEBAR_ART = skinAssetUrl('0ba862962a5560db2691e9bfb2a925be549f2c23c88c660769bd9d867189f0f2.webp')

export const ORCA_MAID_ART = skinAssetUrl('8e35ddb65f30bb23fcc7752cf5b92b2a1d958b93779eb607f878e0510e1affd9.webp')
