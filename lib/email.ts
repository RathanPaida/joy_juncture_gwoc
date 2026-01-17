
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 EMAIL SERVICE NOT CONFIGURED - GENERIC EMAIL');
      console.log(`To: ${to}, Subject: ${subject}`);
      return true;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Joy Juncture" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 EMAIL SERVICE NOT CONFIGURED - DEVELOPMENT MODE');
      console.log(`OTP for ${email}: ${otp}`);
      console.log('Add SMTP_USER and SMTP_PASS to .env.local to send actual emails');
      return true; // Return true to allow testing without real email
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Joy Juncture" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Email Verification OTP - Basho',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #8B7355 0%, #A0826D 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; text-align: center;">Basho</h2>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hello,</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 30px;">Thank you for signing up with Basho. To complete your registration, please verify your email address using the OTP below:</p>
            
            <div style="background: white; border: 2px solid #8B7355; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <p style="margin: 0; font-size: 12px; color: #999;">Verification Code</p>
              <p style="margin: 10px 0; font-size: 32px; font-weight: bold; color: #8B7355; letter-spacing: 5px;">${otp}</p>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-bottom: 20px;">This OTP will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">If you didn't sign up for Basho, please ignore this email.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© 2024 Basho. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
}

export async function sendForgotPasswordEmail(email: string, otp: string): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 EMAIL SERVICE NOT CONFIGURED - DEVELOPMENT MODE');
      console.log(`Reset Password OTP for ${email}: ${otp}`);
      return true;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Joy Juncture" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset Your Password - Basho',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #8B7355 0%, #A0826D 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; text-align: center;">Basho</h2>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hello,</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 30px;">You requested to reset your password. Use the OTP below to proceed:</p>
            
            <div style="background: white; border: 2px solid #8B7355; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <p style="margin: 0; font-size: 12px; color: #999;">Password Reset Code</p>
              <p style="margin: 10px 0; font-size: 32px; font-weight: bold; color: #8B7355; letter-spacing: 5px;">${otp}</p>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-bottom: 20px;">This OTP will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">If you didn't request a password reset, please ignore this email.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© 2024 Basho. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending reset password email:', error);
    return false;
  }
}

export async function sendRefundEmail(email: string, amount: number, orderNumber: string, message?: string): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 EMAIL SERVICE NOT CONFIGURED - REFUND');
      console.log(`Refund ${amount} to ${email} for Order ${orderNumber}`);
      return true;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Joy Juncture" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Refund Initiated for Order ${orderNumber} - Basho`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; text-align: center;">Refund Initiated</h2>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hello,</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">We have initiated a refund for your order <strong>${orderNumber}</strong>.</p>
            
            <div style="background: white; border: 2px solid #10B981; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <p style="margin: 0; font-size: 12px; color: #999;">Refund Amount</p>
              <p style="margin: 5px 0 10px 0; font-size: 32px; font-weight: bold; color: #10B981;">₹${amount}</p>
              <p style="margin: 0; font-size: 12px; color: #666;">Source: ${message || 'Original Payment Method'}</p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;">The amount will reflect in your account within <strong>5-7 business days</strong>.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© 2024 Basho. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending refund email:', error);
    return false;
  }
}

export async function sendCancellationEmail(email: string, orderNumber: string): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 EMAIL SERVICE NOT CONFIGURED - CANCELLATION');
      console.log(`Cancellation email for ${email} - Order ${orderNumber}`);
      return true;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Joy Juncture" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Order Cancelled - ${orderNumber} - Basho`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #EF4444 0%, #B91C1C 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; text-align: center;">Order Cancelled</h2>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hello,</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Your order <strong>${orderNumber}</strong> has been cancelled.</p>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">If you have paid for this order, a refund has been initiated and will be credited to your account shortly.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© 2024 Basho. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    return false;
  }
}

export async function sendOrderStatusEmail(email: string, orderNumber: string, status: string, trackingNumber?: string): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`📧 EMAIL SERVICE NOT CONFIGURED - ORDER STATUS: ${status}`);
      console.log(`Status update for ${email} - Order ${orderNumber} -> ${status}`);
      return true;
    }

    const titles: any = {
      confirmed: 'Order Confirmed',
      shipped: 'Order Shipped',
      delivered: 'Order Delivered',
    };

    const colors: any = {
      confirmed: ['#3B82F6', '#2563EB'], // Blue
      shipped: ['#F59E0B', '#D97706'],   // Amber
      delivered: ['#10B981', '#059669'],  // Emerald
    };

    const messages: any = {
      confirmed: 'Your order has been confirmed and is being processed.',
      shipped: 'Your order has been packed and shipped.',
      delivered: 'Your order has been delivered successfully. Thank you for shopping with Basho!',
    };

    const title = titles[status] || 'Order Update';
    const color = colors[status] || ['#8B7355', '#A0826D'];
    const message = messages[status] || `Your order status has been updated to ${status}.`;

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Joy Juncture" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `${title} - ${orderNumber} - Basho`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, ${color[0]} 0%, ${color[1]} 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; text-align: center;">${title}</h2>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hello,</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">${message}</p>
            
            <div style="background: white; border: 2px solid ${color[0]}; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <p style="margin: 0; font-size: 12px; color: #999;">Order Number</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: ${color[0]};">${orderNumber}</p>
              ${trackingNumber ? `<div style="margin-top: 15px; border-top: 1px dashed #eee; padding-top: 10px;">
                <p style="font-size: 12px; color: #999; margin: 0;">Tracking Number</p>
                <p style="font-size: 16px; font-weight: bold; color: #333; margin: 5px 0 0 0;">${trackingNumber}</p>
              </div>` : ''}
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">You can track your order status in your account.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© 2024 Basho. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email} for order ${orderNumber} status ${status}`);
    return true;
  } catch (error) {
    console.error('Error sending order status email:', error);
    return false;
  }
}

export async function sendOrderConfirmationEmail(email: string, name: string, orderNumber: string, amount: number, items: any[]): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 EMAIL SERVICE NOT CONFIGURED - ORDER CONFIRMATION');
      console.log(`Confirmation for Order ${orderNumber} to ${email} (₹${amount})`);
      return true;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Joy Juncture" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Order Confirmation - ${orderNumber} - Joy Juncture`,
      html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0; text-align: center;">Order Confirmed!</h2>
                </div>
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
                    <p style="color: #333; font-size: 16px;">Hello ${name},</p>
                    <p style="color: #666; font-size: 14px;">Thank you for your purchase via Joy Juncture! Your order <strong>${orderNumber}</strong> has been confirmed.</p>
                    
                    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <p style="font-weight: bold; color: #333; margin-bottom: 10px;">Order Summary</p>
                         ${items.map(item => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                                <span>${item.name} (x${item.quantity})</span>
                                <span>₹${item.price * item.quantity}</span>
                            </div>
                        `).join('')}
                        <div style="border-top: 1px solid #eee; margin-top: 10px; padding-top: 10px; display: flex; justify-content: space-between; font-weight: bold;">
                            <span>Total</span>
                            <span style="color: #10B981;">₹${amount}</span>
                        </div>
                    </div>
                </div>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
}

export async function sendEventRegistrationEmail(email: string, name: string, eventName: string, date: Date, location: string): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 EMAIL SERVICE NOT CONFIGURED - EVENT REGISTRATION');
      console.log(`Event: ${eventName}, User: ${email}`);
      return true;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Joy Juncture" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Event Registration Confirmed: ${eventName} - Joy Juncture`,
      html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: black; margin: 0; text-align: center; text-transform: uppercase;">You're In!</h2>
                </div>
                <div style="background: #1a1a1a; padding: 30px; border-radius: 0 0 8px 8px; color: white;">
                    <p style="font-size: 16px;">Hello ${name},</p>
                    <p style="font-size: 14px; opacity: 0.8;">Your spot for <strong>${eventName}</strong> is confirmed!</p>
                    
                    <div style="background: #2d2d2d; border: 1px solid #FF6B00; border-radius: 12px; padding: 20px; margin: 20px 0;">
                        <div style="margin-bottom: 15px;">
                            <p style="color: #FF6B00; font-size: 12px; text-transform: uppercase; margin: 0;">Event</p>
                            <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${eventName}</p>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <p style="color: #FF6B00; font-size: 12px; text-transform: uppercase; margin: 0;">Date</p>
                            <p style="font-size: 16px; margin: 5px 0;">${new Date(date).toDateString()}</p>
                        </div>
                        <div>
                             <p style="color: #FF6B00; font-size: 12px; text-transform: uppercase; margin: 0;">Location</p>
                            <p style="font-size: 16px; margin: 5px 0;">${location}</p>
                        </div>
                    </div>
                    
                    <p style="font-size: 14px; opacity: 0.6; text-align: center;">Can't wait to see you there!</p>
                </div>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending event registration email:', error);
    return false;
  }
}

export async function sendAccountDeletionOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 EMAIL SERVICE NOT CONFIGURED - ACCOUNT DELETION');
      console.log(`Deletion OTP for ${email}: ${otp}`);
      return true;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Joy Juncture" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Security Alert: Account Deletion OTP - Basho',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #EF4444 0%, #B91C1C 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; text-align: center;">Basho Security</h2>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hello,</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 30px;">You have requested to permanently delete your Basho account. This action cannot be undone. To proceed, please use the security verification code below:</p>
            
            <div style="background: white; border: 2px solid #EF4444; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <p style="margin: 0; font-size: 12px; color: #999;">Deletion Verification Code</p>
              <p style="margin: 10px 0; font-size: 32px; font-weight: bold; color: #EF4444; letter-spacing: 5px;">${otp}</p>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-bottom: 20px;">This OTP will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;"><strong>If you did not request this, please change your password immediately and secure your account.</strong></p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© 2024 Basho. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending deletion OTP email:', error);
    return false;
  }
}

export async function sendWalletCreditEmail(email: string, amount: number, newBalance: number, message?: string): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 EMAIL SERVICE NOT CONFIGURED - WALLET CREDIT');
      console.log(`Credit ${amount} to ${email}. New Balance: ${newBalance}`);
      return true;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Joy Juncture" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Wallet Credited - Basho',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; text-align: center;">Wallet Credited</h2>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hello,</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Your Basho wallet has been credited!</p>
            
            <div style="background: white; border: 2px solid #10B981; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              
              <div style="margin-bottom: 15px;">
                  <p style="margin: 0; font-size: 12px; color: #999;">Amount Added</p>
                  <p style="margin: 5px 0 10px 0; font-size: 32px; font-weight: bold; color: #10B981;">₹${amount}</p>
              </div>

               <div style="border-top: 1px dashed #eee; padding-top: 15px;">
                  <p style="margin: 0; font-size: 12px; color: #999;">New Wallet Balance</p>
                  <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #333;">₹${newBalance}</p>
              </div>
              
              ${message ? `<p style="margin-top: 15px; font-style: italic; color: #666;">"${message}"</p>` : ''}
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;">You can use this balance for your next purchase on Basho.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© 2024 Basho. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending wallet credit email:', error);
    return false;
  }
}
