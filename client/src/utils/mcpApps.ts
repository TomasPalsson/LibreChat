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

export async function readMCPResource(serverName: string, uri: string) {
  return request.post('/api/mcp/resources/read', {
    serverName,
    uri,
  });
}
