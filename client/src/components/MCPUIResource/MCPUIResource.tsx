import React from 'react';
import { AppRenderer } from '@mcp-ui/client';
import { useOptionalMessagesConversation } from '~/Providers';
import { useConversationUIResources } from '~/hooks/Messages/useConversationUIResources';
import { getMCPSandboxConfig, callMCPAppTool, readMCPResource } from '~/utils/mcpApps';
import { useLocalize } from '~/hooks';

interface MCPUIResourceProps {
  node: {
    properties: {
      resourceId: string;
    };
  };
}

/** Renders an MCP UI resource based on its resource ID. Works in chat, share, and search views. */
export function MCPUIResource(props: MCPUIResourceProps) {
  const { resourceId } = props.node.properties;
  const localize = useLocalize();
  const { conversationId } = useOptionalMessagesConversation();

  const conversationResourceMap = useConversationUIResources(conversationId ?? undefined);

  const uiResource = conversationResourceMap.get(resourceId ?? '');

  if (!uiResource) {
    return (
      <span className="inline-flex items-center rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
        {localize('com_ui_ui_resource_not_found', {
          0: resourceId ?? '',
        })}
      </span>
    );
  }

  try {
    // MCP Apps: tool declares resourceUri, host fetches HTML via resources/read
    if (uiResource.toolName && uiResource.serverName && !uiResource.text) {
      return (
        <span className="mx-1 inline-block w-full align-middle">
          <AppRenderer
            toolName={uiResource.toolName}
            sandbox={getMCPSandboxConfig()}
            toolResourceUri={uiResource.uri}
            onCallTool={async (params) => {
              return callMCPAppTool(
                uiResource.serverName!,
                params.name,
                (params.arguments as Record<string, unknown>) ?? {},
              );
            }}
            onReadResource={async (params) => {
              return readMCPResource(uiResource.serverName!, params.uri);
            }}
            onOpenLink={async ({ url }) => {
              window.open(url, '_blank', 'noopener,noreferrer');
              return {};
            }}
            onError={(err) => console.error('[MCP App] Error:', err)}
          />
        </span>
      );
    }

    // Inline UI resources: HTML is already in text, render directly in iframe
    if (uiResource.text) {
      const mimeType = uiResource.mimeType ?? 'text/html';
      if (mimeType.includes('html')) {
        return (
          <span className="mx-1 inline-block w-full align-middle">
            <iframe
              srcDoc={uiResource.text}
              sandbox="allow-scripts allow-same-origin"
              style={{ width: '100%', minHeight: '200px', border: 'none' }}
              title={uiResource.uri}
            />
          </span>
        );
      }
    }

    return null;
  } catch (error) {
    console.error('Error rendering UI resource:', error);
    return (
      <span className="inline-flex items-center rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
        {localize('com_ui_ui_resource_error', { 0: uiResource.name || resourceId })}
      </span>
    );
  }
}
