import { skinAssetUrl } from './asset-url.ts'

/**
 * Generated web app manifest icons. The artwork is an OpenAI ImageGen
 * portrait of the user-provided adult whale-girl reference, scaled to
 * 192 and 512 px and served from the package. Absolute same-origin URLs remain valid when the
 * manifest itself travels as a data: URL.
 *
 * Raster copies exist because Windows builds the installed app, taskbar and
 * start-menu icons from bitmap manifest icons. A manifest that declares only
 * `sizes: "any"` SVG leaves Edge with nothing to rasterise, and the installed
 * app falls back to the site's initial letter.
 *
 * Regenerate: scale the square portrait source to 192 and 512 px and replace the two
 * content-hashed PNG files and references below, then run the skin build.
 */

export const PAGE_ICON_192 = skinAssetUrl('f3491219cf98e1b3b6e7ebb985f16bec2eda5b451f5d7b9289bbba1d061dffec.png')

export const PAGE_ICON_512 = skinAssetUrl('3690e0592fc6ec73c837990eae3d6f12e833ece354900aca34841f9e89639133.png')
