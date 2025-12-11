import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'NexTravel <noreply@nextravel.com>',
    to,
    subject: 'Your NexTravel verification code',
    text: `Your NexTravel verification code is: ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7c3aed;">NexTravel</h2>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code is valid for 3 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });
  console.log(`📧 Email sent to ${to}: ${info.messageId}`);
}
