/**
 * Static HTML template for the stay-tuned confirmation email.
 *
 * Email clients do not support DaisyUI/CSS variables, so the brand colors here
 * are intentionally hardcoded. This is an explicit, deliberate exception to the
 * no-hardcoded-colors rule (which applies to theme-aware UI, not email).
 */

export function getStayTunedEmailTemplate(
  name: string,
  discountCode: string,
  emailDomain: string,
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Exclusive Code Awaits — SORvÈNE</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Jost', 'Segoe UI', sans-serif;
                background: #faf6ee;
                color: #1a1510;
                line-height: 1.6;
            }

            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: #faf6ee;
            }

            /* ── HEADER ── */
            .header {
                padding: 40px 20px;
                background: linear-gradient(135deg, #faf6ee 0%, #f5efe0 100%);
                border-bottom: 1px solid #e0d8cc;
                text-align: center;
            }

            .logo {
                font-family: 'Cormorant Garamond', serif;
                font-size: 28px;
                letter-spacing: 0.15em;
                color: #1a1510;
                font-weight: 400;
                margin-bottom: 16px;
            }

            .tagline {
                font-size: 11px;
                letter-spacing: 0.3em;
                text-transform: uppercase;
                color: #b89020;
            }

            /* ── HERO SECTION ── */
            .hero {
                padding: 60px 40px;
                background: #faf6ee;
                text-align: center;
                border-bottom: 1px solid #e0d8cc;
            }

            .hero-eyebrow {
                font-size: 10px;
                letter-spacing: 0.45em;
                text-transform: uppercase;
                color: #b89020;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
            }

            .hero-eyebrow::before,
            .hero-eyebrow::after {
                content: '';
                width: 24px;
                height: 1px;
                background: rgba(184, 144, 32, 0.35);
            }

            .hero-title {
                font-family: 'Cormorant Garamond', serif;
                font-size: 42px;
                font-weight: 300;
                letter-spacing: 0.05em;
                color: #1a1510;
                margin-bottom: 16px;
                line-height: 1.2;
            }

            .hero-title em {
                font-style: italic;
                color: #6b3518;
            }

            .hero-subtitle {
                font-size: 15px;
                color: #9a8e82;
                margin-bottom: 40px;
                max-width: 450px;
                margin-left: auto;
                margin-right: auto;
                line-height: 1.8;
            }

            /* ── CODE BOX ── */
            .code-section {
                padding: 50px 40px;
                background: #f5efe0;
                text-align: center;
                border: 2px solid #6b3518;
                margin: 40px 20px;
                position: relative;
            }

            .code-label {
                font-size: 10px;
                letter-spacing: 0.38em;
                text-transform: uppercase;
                color: #9a8e82;
                margin-bottom: 16px;
            }

            .code-text {
                font-family: 'Cormorant Garamond', serif;
                font-size: 28px;
                font-weight: 300;
                color: #1a1510;
                margin-bottom: 8px;
            }

            .code-value {
                font-family: 'Jost', sans-serif;
                font-size: 36px;
                font-weight: 400;
                letter-spacing: 0.15em;
                color: #b89020;
                margin: 20px 0;
                padding: 16px;
                background: rgba(184, 144, 32, 0.08);
                border-radius: 2px;
            }

            .code-terms {
                font-size: 12px;
                color: #9a8e82;
                letter-spacing: 0.15em;
                text-transform: uppercase;
                margin-top: 16px;
                line-height: 1.6;
            }

            /* ── CONTENT SECTION ── */
            .content-section {
                padding: 50px 40px;
                background: #faf6ee;
                border-bottom: 1px solid #e0d8cc;
            }

            .section-label {
                font-size: 10px;
                letter-spacing: 0.38em;
                text-transform: uppercase;
                color: #b89020;
                margin-bottom: 16px;
            }

            .section-title {
                font-family: 'Cormorant Garamond', serif;
                font-size: 28px;
                font-weight: 300;
                color: #1a1510;
                margin-bottom: 20px;
                line-height: 1.3;
            }

            .section-title em {
                font-style: italic;
                color: #6b3518;
            }

            .section-text {
                font-size: 14px;
                color: #9a8e82;
                line-height: 1.8;
                margin-bottom: 20px;
            }

            .highlight {
                color: #6b3518;
                font-weight: 400;
            }

            /* ── FEATURE BOX ── */
            .feature-box {
                background: #f5efe0;
                padding: 32px;
                margin: 32px 0;
                border-left: 3px solid #6b3518;
            }

            .feature-title {
                font-family: 'Cormorant Garamond', serif;
                font-size: 20px;
                font-weight: 300;
                color: #1a1510;
                margin-bottom: 12px;
            }

            .feature-text {
                font-size: 13px;
                color: #9a8e82;
                line-height: 1.7;
            }

            /* ── CTA BUTTON ── */
            .cta-section {
                padding: 40px;
                text-align: center;
                background: #faf6ee;
                border-bottom: 1px solid #e0d8cc;
            }

            .cta-button {
                display: inline-block;
                padding: 14px 48px;
                background: #1a1510;
                color: #faf6ee;
                text-decoration: none;
                font-size: 11px;
                letter-spacing: 0.38em;
                text-transform: uppercase;
                font-family: 'Jost', sans-serif;
                font-weight: 300;
                border: 1px solid #1a1510;
                transition: all 0.4s;
                cursor: pointer;
            }

            .cta-button:hover {
                background: #6b3518;
                border-color: #6b3518;
            }

            /* ── FOOTER ── */
            .footer {
                padding: 40px;
                background: #ede5d0;
                text-align: center;
                border-top: 1px solid #e0d8cc;
            }

            .footer-text {
                font-size: 12px;
                color: #9a8e82;
                line-height: 1.8;
                margin-bottom: 16px;
            }

            .footer-links {
                font-size: 11px;
                letter-spacing: 0.2em;
            }

            .footer-links a {
                color: #6b3518;
                text-decoration: none;
                margin: 0 8px;
                transition: color 0.3s;
            }

            .footer-links a:hover {
                color: #1a1510;
            }

            .footer-divider {
                width: 40px;
                height: 1px;
                background: #9a8e82;
                margin: 24px auto;
                opacity: 0.35;
            }

            .footer-logo {
                font-family: 'Cormorant Garamond', serif;
                font-size: 18px;
                letter-spacing: 0.15em;
                color: #1a1510;
                margin: 16px 0;
                font-weight: 400;
            }

            /* ── DIVIDER ── */
            .divider {
                height: 1px;
                background: #e0d8cc;
                margin: 32px 40px;
            }

            /* ── RESPONSIVE ── */
            @media (max-width: 600px) {
                .header {
                    padding: 32px 20px;
                }

                .hero {
                    padding: 40px 20px;
                }

                .hero-title {
                    font-size: 32px;
                }

                .code-section {
                    margin: 32px 20px;
                    padding: 40px 20px;
                }

                .code-value {
                    font-size: 28px;
                }

                .content-section {
                    padding: 40px 20px;
                }

                .section-title {
                    font-size: 24px;
                }

                .cta-section {
                    padding: 32px 20px;
                }

                .footer {
                    padding: 32px 20px;
                }
            }
        </style>
    </head>

    <body>
        <div class="email-container">

            <!-- HEADER -->
            <div class="header">
                <div class="logo" style="color: #1a1510 !important;">SORvÈNE</div>
                <div class="tagline" style="color: #b89020 !important;">Structured Intentionality</div>
            </div>

            <!-- HERO -->
            <div class="hero">
                <div class="hero-eyebrow">You're In</div>
                <h1 class="hero-title">Welcome, <em>${name}</em></h1>
                <p class="hero-subtitle">Thank you for your interest in SORvÈNE. You're among those who understand that true luxury doesn't announce itself. Your exclusive code is below.</p>
            </div>

            <!-- CODE BOX -->
            <div class="code-section">
                <div class="code-label">Your Exclusive Code</div>
                <div class="code-text">Special Discount</div>
                <div class="code-value">${discountCode}</div>
                <div class="code-terms">Valid on your first bag.<br>Limited to one use per customer.</div>
            </div>

            <!-- CONTENT SECTION 1 -->
            <div class="content-section">
                <div class="section-label">What This Means</div>
                <h2 class="section-title">You're Among <em>the Few</em></h2>
                <p class="section-text">By joining our circle, you've chosen intentionality over noise. This code isn't just a discount — it's our way of saying thank you for believing in what we're building.</p>

                <div class="feature-box">
                    <div class="feature-title">You Get:</div>
                    <div class="feature-text">
                        ✓ Exclusive early access to new drops<br>
                        ✓ First notification when stock goes live<br>
                        ✓ Direct communication (no algorithm noise)<br>
                        ✓ Your personal discount code: ${discountCode}
                    </div>
                </div>

                <p class="section-text">We make <span class="highlight">very few bags</span>. Once they're gone, they're gone. The people who know about us find us first.</p>
            </div>

            <!-- DIVIDER -->
            <div class="divider"></div>

            <!-- CTA SECTION -->
            <div class="cta-section">
                <a href="https://www.instagram.com/sorvenestudio" class="cta-button" style="display: inline-block; padding: 14px 48px; background: #1a1510 !important; color: #faf6ee !important; text-decoration: none; font-size: 11px; letter-spacing: 0.38em; text-transform: uppercase; font-family: 'Jost', sans-serif; font-weight: 300; border: 1px solid #1a1510;">Follow Us on Instagram</a>
                <p style="font-size: 12px; color: #9a8e82 !important; margin-top: 20px; letter-spacing: 0.2em;">@sorvenestudio</p>
            </div>

            <!-- FOOTER -->
            <div class="footer">
                <div class="footer-logo" style="color: #1a1510 !important;">SORvÈNE</div>
                <div class="footer-divider"></div>

                <div class="footer-text" style="font-size: 12px; color: #9a8e82 !important; line-height: 1.8; margin-bottom: 16px;">
                    Based in Maharashtra, India<br>
                    Direct-to-Consumer Only
                </div>

                <div class="footer-links">
                    <a href="https://www.instagram.com/sorvenestudio" style="color: #6b3518 !important; text-decoration: none; margin: 0 8px;">Instagram</a>
                    <a href="https://pin.it/XHAUaCqAA" style="color: #6b3518 !important; text-decoration: none; margin: 0 8px;">Pinterest</a>
                    <a href="mailto:hello@${emailDomain}" style="color: #6b3518 !important; text-decoration: none; margin: 0 8px;">Email</a>
                </div>

                <div class="footer-text" style="margin-top: 24px; font-size: 11px; color: #9a8e82 !important;">
                    2026 © SORvÈNE. All rights reserved.<br>
                    Quiet. Intentional. Finite.
                </div>
            </div>

        </div>
    </body>
    </html>
  `;
}
