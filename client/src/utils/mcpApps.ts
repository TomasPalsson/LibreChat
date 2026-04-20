import { request } from 'librechat-data-provider';

const MCP_SANDBOX_URL = new URL('/api/mcp/sandbox', window.location.origin);

export function getMCPSandboxConfig() {
  return { url: MCP_SANDBOX_URL };
}

export async function callMCPAppTool(
  serverName: string,
  toolName: string,
  args: Record<string, unknown>,
) {
  return request.post('/api/mcp/app-tool-call', {
    serverName,
    toolName,
    arguments: args,
  });
}

// Cache fetched HTML by uri to avoid re-fetching 3.6MB on every render
const htmlCache = new Map<string, Promise<unknown>>();

export async function readMCPResource(serverName: string, uri: string) {
  const key = `${serverName}:${uri}`;
  const cached = htmlCache.get(key);
  if (cached) {
    return cached;
  }
  const promise = request.post('/api/mcp/resources/read', {
    serverName,
    uri,
  });
  htmlCache.set(key, promise);
  // Clear from cache if the request fails so it can be retried
  promise.catch(() => htmlCache.delete(key));
  return promise;
}
