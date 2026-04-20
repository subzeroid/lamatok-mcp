#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  buildTools,
  buildUrl,
  isTrustedUrl,
  type OpenApiSpec,
  type ToolEntry,
} from "./openapi.js";
import { fetchWithLimit, FetchError } from "./http.js";

const API_KEY = process.env.LAMATOK_KEY;
const BASE_URL = (process.env.LAMATOK_URL ?? "https://api.lamatok.com").replace(/\/$/, "");
const SPEC_URL = process.env.LAMATOK_SPEC_URL ?? `${BASE_URL}/openapi.json`;

const SPEC_TIMEOUT_MS = numEnv("LAMATOK_SPEC_TIMEOUT_MS", 60_000);
const API_TIMEOUT_MS = numEnv("LAMATOK_TIMEOUT_MS", 30_000);
const MAX_SPEC_BYTES = numEnv("LAMATOK_MAX_SPEC_BYTES", 8 * 1024 * 1024);
const MAX_RESPONSE_BYTES = numEnv("LAMATOK_MAX_RESPONSE_BYTES", 10 * 1024 * 1024);

const DEFAULT_EXCLUDED_TAGS = ["Legacy", "System", "/sys"];
const includeTags = parseTagList(process.env.LAMATOK_TAGS);
const excludeTags = new Set([
  ...DEFAULT_EXCLUDED_TAGS,
  ...parseTagList(process.env.LAMATOK_EXCLUDE_TAGS),
]);

if (!API_KEY) {
  process.stderr.write(
    "Error: LAMATOK_KEY environment variable is required.\n" +
      "Get your API key at https://lamatok.com/tokens\n",
  );
  process.exit(1);
}

if (!isTrustedUrl(BASE_URL)) {
  process.stderr.write(
    `Warning: LAMATOK_URL points to a non-standard host (${BASE_URL}). ` +
      `Your x-access-key will be sent there. Only use this for self-hosted or proxied LamaTok.\n`,
  );
}

function parseTagList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function numEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function loadSpec(): Promise<OpenApiSpec> {
  process.stderr.write(`Fetching OpenAPI spec from ${SPEC_URL}...\n`);
  const result = await fetchWithLimit(
    SPEC_URL,
    { method: "GET", headers: { accept: "application/json" } },
    MAX_SPEC_BYTES,
    SPEC_TIMEOUT_MS,
  );
  if (!result.ok) {
    throw new Error(`Failed to fetch OpenAPI spec: ${result.status} ${result.statusText}`);
  }
  return JSON.parse(result.text) as OpenApiSpec;
}

async function main(): Promise<void> {
  const spec = await loadSpec();
  const entries = buildTools(spec, { includeTags, excludeTags });
  const byName = new Map<string, ToolEntry>(entries.map((e) => [e.tool.name, e] as const));

  process.stderr.write(
    `Loaded ${entries.length} LamaTok tools` +
      (includeTags.length ? ` (tags: ${includeTags.join(", ")})` : "") +
      `\n`,
  );

  const server = new Server(
    { name: "lamatok-mcp", version: "1.0.1" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: entries.map((e) => e.tool),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const entry = byName.get(request.params.name);
    if (!entry) {
      return {
        isError: true,
        content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
      };
    }

    const args = (request.params.arguments ?? {}) as Record<string, unknown>;
    const url = buildUrl(BASE_URL, entry.path, args, entry.parameters);

    try {
      const resp = await fetchWithLimit(
        url,
        {
          method: entry.method.toUpperCase(),
          headers: {
            "x-access-key": API_KEY!,
            accept: "application/json",
          },
        },
        MAX_RESPONSE_BYTES,
        API_TIMEOUT_MS,
      );

      if (!resp.ok) {
        return {
          isError: true,
          content: [
            { type: "text", text: `HTTP ${resp.status} ${resp.statusText}\n${resp.text}` },
          ],
        };
      }

      return { content: [{ type: "text", text: resp.text }] };
    } catch (err) {
      const message =
        err instanceof FetchError ? `${err.kind}: ${err.message}` :
        err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: "text", text: `Request failed: ${message}` }],
      };
    }
  });

  await server.connect(new StdioServerTransport());
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Failed to start lamatok-mcp: ${message}\n`);
  process.exit(1);
});
