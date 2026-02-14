/**
 * Actionable Error Messages
 * 
 * Provides user-friendly error messages with:
 * - Clear explanation of what went wrong
 * - Why it happened
 * - How to fix it
 * - Action buttons/links when applicable
 * 
 * Based on LobeChat error patterns and best practices
 */

export interface ActionableError {
  title: string;
  message: string;
  explanation?: string;
  actions?: ErrorAction[];
  errorCode?: string;
  requestId?: string;
  timestamp?: string;
}

export interface ErrorAction {
  label: string;
  action: 'retry' | 'link' | 'command' | 'dismiss';
  url?: string;
  command?: string;
}

export class ActionableErrorBuilder {
  private error: Partial<ActionableError> = {};

  title(title: string): this {
    this.error.title = title;
    return this;
  }

  message(message: string): this {
    this.error.message = message;
    return this;
  }

  explanation(explanation: string): this {
    this.error.explanation = explanation;
    return this;
  }

  errorCode(code: string): this {
    this.error.errorCode = code;
    return this;
  }

  requestId(id: string): this {
    this.error.requestId = id;
    return this;
  }

  addAction(action: ErrorAction): this {
    if (!this.error.actions) {
      this.error.actions = [];
    }
    this.error.actions.push(action);
    return this;
  }

  build(): ActionableError {
    return {
      ...this.error,
      timestamp: new Date().toISOString(),
    } as ActionableError;
  }
}

/**
 * Create actionable error from common error types
 */
export function createActionableError(error: Error | string, context?: {
  userId?: string;
  requestId?: string;
  action?: 'retry' | 'link';
  linkUrl?: string;
}): ActionableError {
  const builder = new ActionableErrorBuilder();
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorObj = typeof error === 'string' ? new Error(error) : error;

  // Session lock errors
  if (errorMessage.includes('session file locked') || errorMessage.includes('timeout')) {
    return builder
      .title('Session Busy')
      .message('The AI is currently processing another request. Please try again in a moment.')
      .explanation('OpenClaw uses file locks to prevent concurrent access to session files. This ensures your conversation history stays consistent.')
      .errorCode('SESSION_LOCKED')
      .requestId(context?.requestId)
      .addAction({
        label: 'Retry Now',
        action: 'retry',
      })
      .addAction({
        label: 'Wait 10 seconds',
        action: 'dismiss',
      })
      .build();
  }

  // Connection errors
  if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed') || errorMessage.includes('Container is starting')) {
    return builder
      .title('AI Instance Starting')
      .message('Your personal AI instance is still starting up. This usually takes 30-40 seconds.')
      .explanation('Each user gets their own isolated OpenClaw instance. The first time it starts, it needs to initialize the gateway and load models.')
      .errorCode('INSTANCE_STARTING')
      .requestId(context?.requestId)
      .addAction({
        label: 'Wait and Retry',
        action: 'retry',
      })
      .addAction({
        label: 'Check Status',
        action: 'link',
        url: context?.linkUrl || '/status',
      })
      .build();
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return builder
      .title('Request Timed Out')
      .message('The AI took too long to respond. This can happen if the model is processing a complex request.')
      .explanation('AI responses can take time, especially for complex tasks. The system has a 60-second timeout to prevent hanging requests.')
      .errorCode('TIMEOUT')
      .requestId(context?.requestId)
      .addAction({
        label: 'Retry',
        action: 'retry',
      })
      .addAction({
        label: 'Simplify Request',
        action: 'dismiss',
      })
      .build();
  }

  // API key errors
  if (errorMessage.includes('API key') || errorMessage.includes('authentication') || errorMessage.includes('401') || errorMessage.includes('403')) {
    return builder
      .title('API Key Issue')
      .message('There\'s a problem with your API key configuration. Please check your settings.')
      .explanation('OpenClaw needs valid API keys to access AI models. If you\'re using shared keys, they may have expired or hit rate limits.')
      .errorCode('API_KEY_ERROR')
      .requestId(context?.requestId)
      .addAction({
        label: 'Update API Keys',
        action: 'link',
        url: context?.linkUrl || '/settings',
      })
      .addAction({
        label: 'Use Shared Keys',
        action: 'link',
        url: context?.linkUrl || '/settings',
      })
      .build();
  }

  // Bot token errors
  if (errorMessage.includes('bot token') || errorMessage.includes('Telegram') || errorMessage.includes('bot')) {
    return builder
      .title('Bot Configuration Issue')
      .message('There\'s a problem with your Telegram bot configuration.')
      .explanation('Your bot token may be invalid, expired, or the bot may not be properly connected to your instance.')
      .errorCode('BOT_TOKEN_ERROR')
      .requestId(context?.requestId)
      .addAction({
        label: 'Reconfigure Bot',
        action: 'link',
        url: context?.linkUrl || '/setup',
      })
      .addAction({
        label: 'Get Help',
        action: 'link',
        url: 'https://t.me/BotFather',
      })
      .build();
  }

  // Generic errors
  return builder
    .title('Something Went Wrong')
    .message(errorMessage)
    .explanation('An unexpected error occurred. This has been logged for investigation.')
    .errorCode('UNKNOWN_ERROR')
    .requestId(context?.requestId)
    .addAction({
      label: 'Retry',
      action: 'retry',
    })
    .addAction({
      label: 'Report Issue',
      action: 'link',
      url: context?.linkUrl || '/support',
    })
    .build();
}

/**
 * Format error for Telegram message
 */
export function formatErrorForTelegram(error: ActionableError): string {
  let message = `❌ **${error.title}**\n\n${error.message}`;
  
  if (error.explanation) {
    message += `\n\n_${error.explanation}_`;
  }

  if (error.errorCode) {
    message += `\n\n🔍 Error Code: \`${error.errorCode}\``;
  }

  if (error.requestId) {
    message += `\n📋 Request ID: \`${error.requestId}\``;
  }

  return message;
}

/**
 * Format error for JSON API response
 */
export function formatErrorForJSON(error: ActionableError): Record<string, unknown> {
  return {
    error: {
      title: error.title,
      message: error.message,
      explanation: error.explanation,
      code: error.errorCode,
      requestId: error.requestId,
      timestamp: error.timestamp,
      actions: error.actions,
    },
  };
}
