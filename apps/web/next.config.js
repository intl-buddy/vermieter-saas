import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained server bundle for the Docker runtime image.
  output: "standalone",
  // In a monorepo the file tracing root must point at the repo root so the
  // standalone output includes the workspace packages and their node_modules.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // @react-pdf/renderer nutzt Node-interne Module und wird zur Laufzeit aus
  // node_modules aufgelöst statt in den Server-Bundle gepackt.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
