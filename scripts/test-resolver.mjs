/**
 * Resolve hook for the test runner.
 *
 * The app's source uses extensionless relative imports ("./prisma") and the
 * "@/..." alias, both of which Next resolves for us at build time. Node's ESM
 * resolver does neither, so tests that import a real lib module would fail on
 * the first internal import. This hook adds those two rules and nothing else,
 * so tests exercise the same files the app ships rather than copies.
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);

function hookSource() {
  return `
    import { existsSync } from "node:fs";
    import { fileURLToPath, pathToFileURL } from "node:url";

    const ROOT = ${JSON.stringify(ROOT.href)};

    export async function resolve(specifier, context, next) {
      let spec = specifier;

      // "@/lib/x" -> "<root>/lib/x"
      if (spec.startsWith("@/")) {
        spec = new URL(spec.slice(2), ROOT).href;
      }

      // Extensionless relative or root-resolved import -> add .ts / .tsx,
      // or fall back to the directory index.
      if (spec.startsWith(".") || spec.startsWith("file:")) {
        const base = spec.startsWith("file:")
          ? new URL(spec)
          : new URL(spec, context.parentURL);
        if (!/\\.[a-zA-Z0-9]+$/.test(base.pathname)) {
          for (const candidate of [".ts", ".tsx", "/index.ts", "/index.tsx"]) {
            const url = new URL(base.href + candidate);
            if (existsSync(fileURLToPath(url))) return next(url.href, context);
          }
        }
        return next(base.href, context);
      }

      // Bare subpath imports of packages that ship for bundlers rather than
      // for Node's resolver, e.g. "next/server" -> "next/server.js".
      if (spec.includes("/") && !spec.startsWith("@/") && !/\\.[a-zA-Z0-9]+$/.test(spec)) {
        try {
          return await next(spec, context);
        } catch (err) {
          if (err?.code !== "ERR_MODULE_NOT_FOUND") throw err;
          return next(spec + ".js", context);
        }
      }

      return next(spec, context);
    }
  `;
}

register(`data:text/javascript,${encodeURIComponent(hookSource())}`, pathToFileURL("./"));
