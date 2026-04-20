const path = require('path');
const { logger } = require('@librechat/data-schemas');
const { getMCPManager } = require('~/config');

/**
 * Read a UI resource from an MCP server.
 * Restricted to ui:// scheme for security.
 * @route POST /api/mcp/resources/read
 */
const readMCPResource = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { serverName, uri } = req.body;
    if (!serverName || !uri) {
      return res.status(400).json({ error: 'serverName and uri are required' });
    }
    if (typeof uri !== 'string' || !uri.startsWith('ui://')) {
      return res.status(400).json({ error: 'uri must use the ui:// scheme' });
    }

    const mcpManager = getMCPManager();
    const result = await mcpManager.readResource({ userId, serverName, uri, user: req.user });
    return res.json(result);
  } catch (error) {
    logger.error('[readMCPResource] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to read resource' });
  }
};

/**
 * Proxy tool calls from MCP App iframe to MCP server.
 * @route POST /api/mcp/app-tool-call
 */
const appToolCall = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { serverName, toolName, arguments: toolArgs } = req.body;
    if (!serverName || !toolName) {
      return res.status(400).json({ error: 'serverName and toolName are required' });
    }

    const mcpManager = getMCPManager();
    const result = await mcpManager.appToolCall({
      userId,
      serverName,
      toolName,
      toolArguments: toolArgs || {},
      user: req.user,
    });
    return res.json(result);
  } catch (error) {
    logger.error('[appToolCall] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to execute tool' });
  }
};

/**
 * Serve the sandbox proxy HTML for MCP Apps.
 * @route GET /api/mcp/sandbox
 */
const serveMCPSandbox = async (_req, res) => {
  try {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    const sandboxPath = path.resolve(__dirname, '..', '..', '..', 'client', 'public', 'mcp-sandbox.html');
    return res.sendFile(sandboxPath, (error) => {
      if (error) {
        logger.error('[serveMCPSandbox] Error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to load MCP sandbox' });
        }
      }
    });
  } catch (error) {
    logger.error('[serveMCPSandbox] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to load MCP sandbox' });
  }
};

module.exports = { readMCPResource, appToolCall, serveMCPSandbox };
