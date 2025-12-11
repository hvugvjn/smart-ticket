import nodemailer from 'nodemailer';

async function runSmtpDiagnostics() {
  console.log('=== SMTP DIAGNOSTICS ===\n');
  
  console.log('Environment variables check:');
  console.log('  SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com (default)');
  console.log('  SMTP_PORT:', process.env.SMTP_PORT || '465 (default)');
  console.log('  SMTP_USER:', process.env.SMTP_USER ? '✓ Set' : '✗ Not set');
  console.log('  SMTP_PASS:', process.env.SMTP_PASS ? '✓ Set' : '✗ Not set');
  console.log('  SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✓ Set' : '✗ Not set');
  console.log('');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  console.log('Testing SMTP connection...\n');

  try {
    const verifyResult = await transporter.verify();
    console.log('✓ SMTP transporter.verify() SUCCESS');
    console.log('  Result:', verifyResult);
    console.log('');

    const testEmail = process.env.SMTP_USER;
    if (testEmail) {
      console.log(`Sending test email to ${testEmail}...`);
      
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'NexTravel <noreply@nextravel.com>',
        to: testEmail,
        subject: 'NexTravel SMTP Test - ' + new Date().toISOString(),
        text: 'This is a test email from NexTravel SMTP diagnostics.',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #7c3aed;">NexTravel SMTP Test</h2>
            <p>This is a test email sent at: ${new Date().toISOString()}</p>
            <p style="color: #22c55e;">✓ If you received this, SMTP is working correctly!</p>
          </div>
        `,
      });

      console.log('✓ Test email sent successfully!');
      console.log('  Message ID:', info.messageId);
      console.log('  Response:', info.response);
      console.log('  Accepted:', info.accepted);
      console.log('  Rejected:', info.rejected);
    } else {
      console.log('⚠ No SMTP_USER set, skipping test email send');
    }
  } catch (error: any) {
    console.error('✗ SMTP ERROR');
    console.error('  Error name:', error.name);
    console.error('  Error message:', error.message);
    console.error('  Error code:', error.code);
    if (error.response) {
      console.error('  SMTP response:', error.response);
    }
    console.error('');
    console.error('Full error:', error);
  }

  console.log('\n=== DIAGNOSTICS COMPLETE ===');
}

runSmtpDiagnostics().catch(console.error);
