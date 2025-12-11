interface BookingEmailData {
  bookingId: number;
  userEmail: string;
  tripDetails: {
    operatorName: string;
    source: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
  };
  seats: string[];
  pickupPoint?: string;
  dropPoint?: string;
  amount: string;
  currency: string;
}

export async function sendBookingConfirmationEmailSG(data: BookingEmailData): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY not configured');
  }

  const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || 'noreply@nextravel.com';
  
  const departureDate = new Date(data.tripDetails.departureTime).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const departureTime = new Date(data.tripDetails.departureTime).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #ffffff;">
      <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #333;">
        <h1 style="color: #00d9ff; margin: 0;">NexTravel</h1>
        <p style="color: #888; margin: 5px 0;">Your Journey Awaits</p>
      </div>
      
      <div style="padding: 30px 0;">
        <h2 style="color: #22c55e; margin: 0 0 20px;">✓ Booking Confirmed!</h2>
        <p style="color: #ccc;">Booking ID: <strong style="color: #00d9ff;">#${data.bookingId}</strong></p>
      </div>
      
      <div style="background: #252542; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #00d9ff; margin: 0 0 15px;">${data.tripDetails.operatorName}</h3>
        
        <div style="display: flex; justify-content: space-between; margin: 15px 0;">
          <div>
            <p style="color: #888; margin: 0; font-size: 12px;">FROM</p>
            <p style="color: #fff; margin: 5px 0; font-size: 18px; font-weight: bold;">${data.tripDetails.source}</p>
          </div>
          <div style="text-align: center; color: #00d9ff;">
            <p style="margin: 0; font-size: 12px;">${data.tripDetails.duration}</p>
            <p style="margin: 5px 0;">→</p>
          </div>
          <div style="text-align: right;">
            <p style="color: #888; margin: 0; font-size: 12px;">TO</p>
            <p style="color: #fff; margin: 5px 0; font-size: 18px; font-weight: bold;">${data.tripDetails.destination}</p>
          </div>
        </div>
        
        <div style="border-top: 1px solid #333; padding-top: 15px; margin-top: 15px;">
          <p style="color: #888; margin: 0;">📅 ${departureDate}</p>
          <p style="color: #fff; margin: 5px 0;">🕐 Departure: ${departureTime}</p>
        </div>
      </div>
      
      <div style="background: #252542; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h4 style="color: #00d9ff; margin: 0 0 10px;">Seat Details</h4>
        <p style="color: #fff; margin: 0;">Seats: <strong>${data.seats.join(', ')}</strong></p>
        ${data.pickupPoint ? `<p style="color: #ccc; margin: 10px 0 0;">📍 Pickup: ${data.pickupPoint}</p>` : ''}
        ${data.dropPoint ? `<p style="color: #ccc; margin: 5px 0 0;">📍 Drop: ${data.dropPoint}</p>` : ''}
      </div>
      
      <div style="background: linear-gradient(135deg, #7c3aed, #00d9ff); border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="color: #fff; margin: 0; font-size: 14px;">Total Amount</p>
        <p style="color: #fff; margin: 10px 0 0; font-size: 32px; font-weight: bold;">₹${parseFloat(data.amount).toLocaleString('en-IN')}</p>
      </div>
      
      <div style="text-align: center; padding: 20px 0; border-top: 1px solid #333; margin-top: 20px;">
        <p style="color: #888; font-size: 12px; margin: 0;">Thank you for choosing NexTravel!</p>
        <p style="color: #666; font-size: 11px; margin: 10px 0 0;">This is an automated email. Please do not reply.</p>
      </div>
    </div>
  `;

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: data.userEmail }],
          subject: `Booking Confirmed #${data.bookingId} - ${data.tripDetails.source} to ${data.tripDetails.destination}`,
        },
      ],
      from: { email: fromEmail, name: 'NexTravel' },
      content: [
        {
          type: 'text/html',
          value: htmlContent,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
  }

  console.log('SendGrid email sent successfully to', data.userEmail);
}
