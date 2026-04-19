import React from 'react';
import { render, screen } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { MCPUIResource } from '../MCPUIResource';
import {
  useMessageContext,
  useOptionalMessagesConversation,
} from '~/Providers';
import { useLocalize } from '~/hooks';

// Mock dependencies
jest.mock('~/Providers');
jest.mock('~/hooks');

jest.mock('@mcp-ui/client', () => ({
  AppRenderer: ({ toolName, toolResourceUri }: any) => (
    <div
      data-testid="ui-resource-renderer"
      data-resource-uri={toolResourceUri}
      data-tool-name={toolName}
    />
  ),
}));

jest.mock('~/utils/mcpApps', () => ({
  getMCPSandboxConfig: () => ({ url: new URL('http://localhost/sandbox') }),
  callMCPAppTool: jest.fn(),
  readMCPResource: jest.fn(),
}));

const mockUseMessageContext = useMessageContext as jest.MockedFunction<typeof useMessageContext>;
const mockUseMessagesConversation = useOptionalMessagesConversation as jest.MockedFunction<
  typeof useOptionalMessagesConversation
>;
const mockUseLocalize = useLocalize as jest.MockedFunction<typeof useLocalize>;

describe('MCPUIResource', () => {
  const mockLocalize = (key: string, values?: any) => {
    const translations: Record<string, string> = {
      com_ui_ui_resource_not_found: `UI resource ${values?.[0]} not found`,
      com_ui_ui_resource_error: `Error rendering UI resource: ${values?.[0]}`,
    };
    return translations[key] || key;
  };

  const renderWithRecoil = (ui: React.ReactNode) => render(<RecoilRoot>{ui}</RecoilRoot>);

  // Store the current test's messages so getMessages can return them
  let currentTestMessages: any[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    currentTestMessages = [];
    mockUseMessageContext.mockReturnValue({ messageId: 'msg123' } as any);
    mockUseMessagesConversation.mockReturnValue({
      conversation: { conversationId: 'conv123' },
      conversationId: 'conv123',
    } as any);
    mockUseLocalize.mockReturnValue(mockLocalize as any);
  });

  describe('resource fetching', () => {
    it('should fetch and render UI resource from message attachments', () => {
      currentTestMessages = [
        {
          messageId: 'msg123',
          attachments: [
            {
              type: 'ui_resources',
              ui_resources: [
                {
                  resourceId: 'resource-1',
                  uri: 'ui://test/resource',
                  mimeType: 'text/html',
                  text: '<p>Test Resource</p>',
                },
              ],
            },
          ],
        },
      ];

      renderWithRecoil(<MCPUIResource node={{ properties: { resourceId: 'resource-1' } }} />);

      const renderer = screen.getByTestId('ui-resource-renderer');
      expect(renderer).toBeInTheDocument();
      expect(renderer).toHaveAttribute('data-resource-uri', 'ui://test/resource');
    });

    it('should show not found message when resourceId does not exist', () => {
      currentTestMessages = [
        {
          messageId: 'msg123',
          attachments: [
            {
              type: 'ui_resources',
              ui_resources: [
                {
                  resourceId: 'resource-1',
                  uri: 'ui://test/resource',
                  mimeType: 'text/html',
                  text: '<p>Test Resource</p>',
                },
              ],
            },
          ],
        },
      ];

      renderWithRecoil(<MCPUIResource node={{ properties: { resourceId: 'nonexistent-id' } }} />);

      expect(screen.getByText('UI resource nonexistent-id not found')).toBeInTheDocument();
      expect(screen.queryByTestId('ui-resource-renderer')).not.toBeInTheDocument();
    });

    it('should show not found when no ui_resources attachments', () => {
      currentTestMessages = [
        {
          messageId: 'msg123',
          attachments: [
            {
              type: 'web_search',
              web_search: { results: [] },
            },
          ],
        },
      ];

      renderWithRecoil(<MCPUIResource node={{ properties: { resourceId: 'resource-1' } }} />);

      expect(screen.getByText('UI resource resource-1 not found')).toBeInTheDocument();
    });

    it('should resolve resources by resourceId across conversation messages', () => {
      mockUseMessageContext.mockReturnValue({ messageId: 'msg-current' } as any);
      currentTestMessages = [
        {
          messageId: 'msg-previous',
          attachments: [
            {
              type: 'ui_resources',
              ui_resources: [
                {
                  resourceId: 'abc123',
                  uri: 'ui://test/resource-id',
                  mimeType: 'text/html',
                  text: '<p>Resource via ID</p>',
                },
              ],
            },
          ],
        },
        {
          messageId: 'msg-current',
          attachments: [],
        },
      ];

      renderWithRecoil(<MCPUIResource node={{ properties: { resourceId: 'abc123' } }} />);

      const renderer = screen.getByTestId('ui-resource-renderer');
      expect(renderer).toBeInTheDocument();
      expect(renderer).toHaveAttribute('data-resource-uri', 'ui://test/resource-id');
    });
  });

  describe('edge cases', () => {
    it('should handle empty messages array', () => {
      currentTestMessages = [];

      renderWithRecoil(<MCPUIResource node={{ properties: { resourceId: 'resource-1' } }} />);

      expect(screen.getByText('UI resource resource-1 not found')).toBeInTheDocument();
    });

    it('should handle null messages data', () => {
      currentTestMessages = [];

      renderWithRecoil(<MCPUIResource node={{ properties: { resourceId: 'resource-1' } }} />);

      expect(screen.getByText('UI resource resource-1 not found')).toBeInTheDocument();
    });

    it('should handle missing conversation', () => {
      currentTestMessages = [];
      mockUseMessagesConversation.mockReturnValue({
        conversation: null,
        conversationId: null,
      } as any);

      renderWithRecoil(<MCPUIResource node={{ properties: { resourceId: 'resource-1' } }} />);

      expect(screen.getByText('UI resource resource-1 not found')).toBeInTheDocument();
    });

    it('should handle multiple attachments of ui_resources type', () => {
      currentTestMessages = [
        {
          messageId: 'msg123',
          attachments: [
            {
              type: 'ui_resources',
              ui_resources: [
                {
                  resourceId: 'resource-1',
                  uri: 'ui://test/resource1',
                  mimeType: 'text/html',
                  text: '<p>Resource 1</p>',
                },
              ],
            },
            {
              type: 'ui_resources',
              ui_resources: [
                {
                  resourceId: 'resource-2',
                  uri: 'ui://test/resource2',
                  mimeType: 'text/html',
                  text: '<p>Resource 2</p>',
                },
                {
                  resourceId: 'resource-3',
                  uri: 'ui://test/resource3',
                  mimeType: 'text/html',
                  text: '<p>Resource 3</p>',
                },
              ],
            },
          ],
        },
      ];

      renderWithRecoil(<MCPUIResource node={{ properties: { resourceId: 'resource-2' } }} />);

      const renderer = screen.getByTestId('ui-resource-renderer');
      expect(renderer).toBeInTheDocument();
      expect(renderer).toHaveAttribute('data-resource-uri', 'ui://test/resource2');
    });
  });
});
