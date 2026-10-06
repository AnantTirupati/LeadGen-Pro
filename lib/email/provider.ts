import { EmailProvider, SendEmailOptions, SendEmailResult } from './types';
import { ResendEmailProvider } from './resend';

export class MockEmailProvider implements EmailProvider {
  name = 'mock';

  isConfigured(): boolean {
    return true;
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const isErrorSimulation = options.to.includes('fail-test');
    if (isErrorSimulation) {
      return {
        success: false,
        status: 'FAILED',
        error: 'Simulated mailbox delivery rejection.',
        provider: this.name,
      };
    }

    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      status: 'SENT',
      provider: this.name,
    };
  }
}

let activeProvider: EmailProvider | null = null;

/**
 * Returns the currently active email provider instance
 */
export function getEmailProvider(): EmailProvider {
  if (activeProvider) return activeProvider;

  // Default to Resend
  activeProvider = new ResendEmailProvider();
  return activeProvider;
}

/**
 * Allows swapping provider (e.g. for automated test suites)
 */
export function setEmailProvider(provider: EmailProvider | null): void {
  activeProvider = provider;
}
