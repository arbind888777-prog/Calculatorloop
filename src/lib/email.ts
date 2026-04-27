// Email service using Resend
import { Resend } from 'resend';

// Initialize with a dummy key if missing to prevent build failures
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  tags?: Array<{ name: string; value: string }>;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions) {
  const {
    to,
    subject,
    html,
    from = process.env.EMAIL_FROM || 'Calculator Pro <noreply@calculatorloop.com>',
    replyTo,
    cc,
    bcc,
    tags,
  } = options;

  try {
    const data = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
      tags,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

/**
 * Send calculation results email
 */
export async function sendCalculationEmail(
  to: string,
  calculatorName: string,
  inputs: Record<string, any>,
  results: Record<string, any>
) {
  const html = generateCalculationEmailHTML(calculatorName, inputs, results);

  return sendEmail({
    to,
    subject: `Your ${calculatorName} Results - Calculator Pro`,
    html,
    tags: [
      { name: 'category', value: 'calculation' },
      { name: 'calculator', value: calculatorName.toLowerCase().replace(/\s+/g, '-') },
    ],
  });
}

/**
 * Send newsletter subscription confirmation
 */
export async function sendNewsletterConfirmation(to: string, name?: string) {
  const html = generateNewsletterConfirmationHTML(name);

  return sendEmail({
    to,
    subject: 'Welcome to Calculator Pro Newsletter! 🎉',
    html,
    tags: [{ name: 'category', value: 'newsletter' }],
  });
}

/**
 * Send welcome email for new users
 */
export async function sendWelcomeEmail(to: string, name: string) {
  const html = generateWelcomeEmailHTML(name);

  return sendEmail({
    to,
    subject: 'Welcome to Calculator Pro! 🚀',
    html,
    tags: [{ name: 'category', value: 'welcome' }],
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const html = generatePasswordResetEmailHTML(resetLink);

  return sendEmail({
    to,
    subject: 'Reset your password - Calculator Pro',
    html,
    tags: [{ name: 'category', value: 'reset-password' }],
  });
}

/**
 * Generate HTML for password reset email
 */
function generatePasswordResetEmailHTML(resetLink: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://calculatorloop.com';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          h1 {
            color: #1a1a1a;
            text-align: center;
          }
          .button {
            display: inline-block;
            padding: 14px 36px;
            background: linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Password Reset Request</h1>
          <p>We received a request to reset the password for your account associated with this email address.</p>
          <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="\${resetLink}" class="button">Reset Password</a>
          </div>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML for calculation results email
 */
function generateCalculationEmailHTML(
  calculatorName: string,
  inputs: Record<string, any>,
  results: Record<string, any>
): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://calculatorloop.com';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${calculatorName} Results</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 32px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            background: linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          h1 {
            color: #1a1a1a;
            font-size: 24px;
            margin: 16px 0;
          }
          .section {
            margin: 24px 0;
            padding: 16px;
            background-color: #f8f9fa;
            border-radius: 6px;
          }
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #666;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .result-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
          }
          .result-item:last-child {
            border-bottom: none;
          }
          .result-label {
            color: #666;
            font-weight: 500;
          }
          .result-value {
            color: #1a1a1a;
            font-weight: 600;
          }
          .highlight {
            background: linear-gradient(135deg, #00D4FF15 0%, #8B5CF615 100%);
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 24px 0;
          }
          .highlight-value {
            font-size: 32px;
            font-weight: bold;
            color: #8B5CF6;
            margin: 8px 0;
          }
          .button {
            display: inline-block;
            padding: 12px 32px;
            background: linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 16px 0;
          }
          .footer {
            text-align: center;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e0e0e0;
            color: #999;
            font-size: 14px;
          }
          .footer a {
            color: #8B5CF6;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🧮 Calculator Pro</div>
            <h1>${calculatorName} Results</h1>
          </div>

          <div class="section">
            <div class="section-title">📊 Your Inputs</div>
            ${Object.entries(inputs)
              .map(
                ([key, value]) => `
              <div class="result-item">
                <span class="result-label">${formatLabel(key)}</span>
                <span class="result-value">${formatValue(value)}</span>
              </div>
            `
              )
              .join('')}
          </div>

          <div class="highlight">
            <div style="color: #666; font-size: 14px; margin-bottom: 8px;">CALCULATED RESULTS</div>
            ${Object.entries(results)
              .slice(0, 1)
              .map(
                ([key, value]) => `
              <div>
                <div style="color: #666; font-size: 12px; text-transform: uppercase;">${formatLabel(key)}</div>
                <div class="highlight-value">${formatValue(value)}</div>
              </div>
            `
              )
              .join('')}
          </div>

          <div class="section">
            <div class="section-title">✨ Detailed Results</div>
            ${Object.entries(results)
              .map(
                ([key, value]) => `
              <div class="result-item">
                <span class="result-label">${formatLabel(key)}</span>
                <span class="result-value">${formatValue(value)}</span>
              </div>
            `
              )
              .join('')}
          </div>

          <div style="text-align: center;">
            <a href="${baseUrl}" class="button">Calculate Again</a>
          </div>

          <div class="footer">
            <p>Thanks for using Calculator Pro!</p>
            <p>
              <a href="${baseUrl}">Visit Website</a> • 
              <a href="${baseUrl}/blog">Read Blog</a> • 
              <a href="${baseUrl}/about">About Us</a>
            </p>
            <p style="font-size: 12px; margin-top: 16px;">
              This email was sent because you requested calculation results.<br>
              © ${new Date().getFullYear()} Calculator Pro. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML for newsletter confirmation
 */
function generateNewsletterConfirmationHTML(name?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://calculatorloop.com';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Calculator Pro Newsletter</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .logo {
            font-size: 40px;
            text-align: center;
            margin-bottom: 16px;
          }
          h1 {
            text-align: center;
            color: #1a1a1a;
            margin-bottom: 24px;
          }
          .content {
            margin: 24px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 36px;
            background: linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #e0e0e0;
            color: #999;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🎉</div>
          <h1>Welcome to Calculator Pro!</h1>
          
          <div class="content">
            <p>${name ? `Hi ${name},` : 'Hello!'}</p>
            
            <p>Thank you for subscribing to Calculator Pro newsletter! You're now part of our community of smart calculators users.</p>
            
            <p><strong>Here's what you'll get:</strong></p>
            <ul>
              <li>📊 New calculator releases and updates</li>
              <li>💡 Tips and tricks for better calculations</li>
              <li>📈 Financial planning guides</li>
              <li>🎯 Exclusive features and early access</li>
            </ul>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${baseUrl}" class="button">Explore Calculators</a>
            </div>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} Calculator Pro. All rights reserved.</p>
            <p style="font-size: 12px; margin-top: 8px;">
              <a href="${baseUrl}/unsubscribe" style="color: #999;">Unsubscribe</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML for welcome email
 */
function generateWelcomeEmailHTML(name: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://calculatorloop.com';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Calculator Pro</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          h1 {
            color: #1a1a1a;
            text-align: center;
          }
          .button {
            display: inline-block;
            padding: 14px 36px;
            background: linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome, ${name}! 🚀</h1>
          <p>Your Calculator Pro account is ready! Start exploring our powerful calculators.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${baseUrl}/profile" class="button">Go to Dashboard</a>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Format label for display
 */
function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format value for display
 */
function formatValue(value: any): string {
  if (typeof value === 'number') {
    if (value >= 1000) {
      return `₹${value.toLocaleString('en-IN')}`;
    }
    return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
  return String(value);
}
