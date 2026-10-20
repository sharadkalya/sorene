import { Resend } from 'resend';
import { getEmailDomain, getResendApiKey } from '@/common/env';
import { getStayTunedEmailTemplate } from './stay-tuned-template';

/**
 * Resend email integration. The client is initialized lazily so importing this
 * module never fails when `RESEND_API_KEY` is missing at build time.
 */

let resendClient: Resend | null = null;

function getClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(getResendApiKey());
  }
  return resendClient;
}

export interface SendStayTunedEmailParams {
  name: string;
  email: string;
  discountCode: string;
}

export async function sendStayTunedEmail({
  name,
  email,
  discountCode,
}: SendStayTunedEmailParams): Promise<void> {
  const emailDomain = getEmailDomain();

  const { error } = await getClient().emails.send({
    from: `SORvÈNE <hello@${emailDomain}>`,
    to: [email],
    subject: 'Welcome to SORvÈNE - Your Exclusive Discount Inside',
    html: getStayTunedEmailTemplate(name, discountCode, emailDomain),
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`, { cause: error });
  }
}
