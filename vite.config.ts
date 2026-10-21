import { defineConfig } from "vitest/config";
import { loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Serves api/rpc.ts at /api/rpc during `vite dev`, mirroring the Vercel function in production.
 * RPC_URL is read from .env (no VITE_ prefix, so it is never bundled into client code).
 */
function rpcProxyDev(): Plugin {
  return {
    name: "rpc-proxy-dev",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      for (const key of ["RPC_URL", "ALLOWED_ORIGINS"]) process.env[key] ??= env[key];

      server.middlewares.use("/api/rpc", async (req, res) => {
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);

          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
          const path = (req as { originalUrl?: string }).originalUrl ?? req.url ?? "/api/rpc";
          const hasBody = req.method !== "GET" && req.method !== "HEAD";
          const request = new Request(`http://${req.headers.host}${path}`, {
            method: req.method,
            headers,
            body: hasBody ? Buffer.concat(chunks) : undefined,
          });

          const handler = (await server.ssrLoadModule("/api/rpc.ts")).default as {
            fetch: (r: Request) => Promise<Response>;
          };
          const response = await handler.fetch(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch {
          res.statusCode = 500;
          res.end("RPC proxy failed");
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), rpcProxyDev()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
