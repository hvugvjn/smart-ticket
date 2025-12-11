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

export async function sendSeatAvailableEmail(to: string, seatNumber: string, source: string, destination: string): Promise<void> {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'NexTravel <noreply@nextravel.com>',
    to,
    subject: 'Seat Available Notification - NexTravel',
    text: `Your seat ${seatNumber} on the ${source} to ${destination} trip is now available. Hurry up and book!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7c3aed;">NexTravel</h2>
        <p style="font-size: 16px; color: #333;">Great news!</p>
        <p style="font-size: 16px; color: #333;">
          The seat <strong>${seatNumber}</strong> on the <strong>${source}</strong> to <strong>${destination}</strong> trip is now available.
        </p>
        <div style="background: #06b6d4; padding: 15px 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <a href="#" style="color: white; text-decoration: none; font-weight: bold; font-size: 16px;">Book Now</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Hurry up and book before someone else takes it!</p>
      </div>
    `,
  });
  console.log(`📧 Seat available email sent to ${to}: ${info.messageId}`);
}

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
