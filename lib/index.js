import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
//#region src/vendor/skin-assets.ts
/** Public, immutable artwork only. Paths come from the shipped allowlist, never from disk traversal. */
function installSkinAssets(ctx, id, directory, files) {
	const prefix = `/skin-assets/${id}`;
	const allowed = new Set(files);
	ctx.inject(["webServer"], (webCtx) => {
		const server = webCtx.get("webServer");
		webCtx.effect(() => server.register({
			kind: "prefix",
			path: prefix,
			handler: async (req, res) => {
				if (req.method !== "GET" && req.method !== "HEAD") {
					res.writeHead(405, { Allow: "GET, HEAD" }).end();
					return;
				}
				const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
				const file = pathname.slice(prefix.length + 1);
				if (!pathname.startsWith(`${prefix}/`) || !allowed.has(file) || !/^[a-f0-9]{64}\.(png|webp)$/.test(file)) {
					res.writeHead(404).end();
					return;
				}
				let bytes;
				try {
					bytes = await readFile(new URL(file, directory));
				} catch (error) {
					if (error.code !== "ENOENT") throw error;
					res.writeHead(404).end();
					return;
				}
				const etag = `"${file.split(".")[0]}"`;
				const headers = {
					"Content-Type": file.endsWith(".webp") ? "image/webp" : "image/png",
					"Cache-Control": "public, max-age=31536000, immutable",
					"X-Content-Type-Options": "nosniff",
					ETag: etag
				};
				if (req.headers["if-none-match"]?.split(",").some((value) => value.trim().replace(/^W\//, "") === etag || value.trim() === "*")) {
					res.writeHead(304, headers).end();
					return;
				}
				res.writeHead(200, {
					...headers,
					"Content-Length": bytes.length
				});
				res.end(req.method === "HEAD" ? void 0 : bytes);
			}
		}), `${id}: packaged artwork`);
	});
}
//#endregion
//#region src/index.ts
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
function readSkinAssetManifest(manifest = new URL("../assets/runtime/manifest.json", import.meta.url)) {
	const parsed = JSON.parse(readFileSync(manifest, "utf8"));
	if (!Array.isArray(parsed) || parsed.some((entry) => typeof entry !== "string")) throw new Error("Invalid skin artwork manifest");
	return parsed;
}
/** Serve only this package's immutable presentation assets while the skin is enabled. */
function apply(ctx) {
	installSkinAssets(ctx, "orca-maid", new URL("../assets/runtime/", import.meta.url), readSkinAssetManifest());
}
//#endregion
export { apply, readSkinAssetManifest };
