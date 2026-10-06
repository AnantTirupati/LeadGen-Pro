import { EmailProvider, SendEmailOptions, SendEmailResult, EmailStatus } from './types';
import { generateEmailHtml } from './templates';

export class ResendEmailProvider implements EmailProvider {
  name = 'resend';

  private getApiKey(): string | undefined {
    return process.env.RESEND_API_KEY?.trim();
  }

  private getDefaultFrom(): string {
    return (
      process.env.EMAIL_FROM?.trim() ||
      'LeadGen Pro <onboarding@resend.dev>'
    );
  }

  private getDefaultReplyTo(): string | undefined {
    return process.env.EMAIL_REPLY_TO?.trim() || undefined;
  }

  isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.length > 5 && !key.includes('your-resend-api-key'));
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'FAILED',
        error: 'Email sending is not configured. Please provide a valid RESEND_API_KEY in environment variables.',
        provider: this.name,
      };
    }

    const apiKey = this.getApiKey()!;
    const fromAddress = options.from || this.getDefaultFrom();
    const replyTo = options.replyTo || this.getDefaultReplyTo();
    const htmlContent = options.html || generateEmailHtml(options.body);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [options.to],
          subject: options.subject,
          text: options.body,
          html: htmlContent,
          reply_to: replyTo,
        }),
        signal: AbortSignal.timeout(12000),
      });

      const data = await response.json();

      if (!response.ok || !data.id) {
        return {
          success: false,
          status: 'FAILED',
          error: data.message || `Resend API returned error code ${response.status}`,
          provider: this.name,
        };
      }

      return {
        success: true,
        messageId: data.id,
        status: 'SENT',
        provider: this.name,
      };
    } catch (err: any) {
      console.error('[Resend Provider Exception]', err);
      return {
        success: false,
        status: 'FAILED',
        error: err?.message || 'Network error while contacting email provider.',
        provider: this.name,
      };
    }
  }

  async getEmailStatus(messageId: string): Promise<EmailStatus | null> {
    if (!this.isConfigured() || !messageId) return null;
    const apiKey = this.getApiKey()!;

    try {
      const response = await fetch(`https://api.resend.com/emails/${messageId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) return null;
      const data = await response.json();

      if (data.last_event === 'delivered') return 'DELIVERED';
      if (data.last_event === 'bounced') return 'BOUNCED';
      if (data.last_event === 'sent') return 'SENT';
      if (data.last_event === 'failed') return 'FAILED';

      return 'SENT';
    } catch {
      return null;
    }
  }
}
