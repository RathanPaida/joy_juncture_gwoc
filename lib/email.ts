import nodemailer from 'nodemailer';

// Create a transporter using SMTP settings
// For Gmail, use service: 'gmail'
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to your email provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ EMAIL_USER or EMAIL_PASS not set. Email not sent.');
        console.log('--- MOCK EMAIL ---');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('Content (Snippet):', html.substring(0, 100) + '...');
        console.log('------------------');
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: `"Joy Juncture" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log('✅ Email sent: %s', info.messageId);
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }
};

export const sendEventRegistrationEmail = async (userEmail: string, userName: string, eventName: string, eventDate: Date, eventLocation: string) => {
    const subject = `Registration Confirmed: ${eventName}`;
    const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #FF8C00;">Event Registration Confirmed!</h2>
      <p>Hi ${userName},</p>
      <p>You have successfully registered for <strong>${eventName}</strong>.</p>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>
        <p><strong>Location:</strong> ${eventLocation}</p>
      </div>
      <p>We look forward to seeing you there!</p>
      <p>Best regards,<br>The Joy Juncture Team</p>
    </div>
  `;
    await sendEmail(userEmail, subject, html);
};

export const sendOrderConfirmationEmail = async (userEmail: string, userName: string, orderId: string, amount: number, items: any[]) => {
    const subject = `Order Confirmation #${orderId.slice(-6).toUpperCase()}`;

    const itemsHtml = items.map(item => `
    <li style="margin-bottom: 10px;">
      <strong>${item.name}</strong> x ${item.quantity} - ₹${item.price}
    </li>
  `).join('');

    const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #4CAF50;">Order Confirmed!</h2>
      <p>Hi ${userName},</p>
      <p>Thank you for your purchase. Your order has been received.</p>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>Order Details</h3>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Total Amount:</strong> ₹${amount}</p>
        <ul>${itemsHtml}</ul>
      </div>
      <p>We will notify you when your items are shipped.</p>
      <p>Best regards,<br>The Joy Juncture Team</p>
    </div>
  `;
    await sendEmail(userEmail, subject, html);
};
