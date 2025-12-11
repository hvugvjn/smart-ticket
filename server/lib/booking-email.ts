import nodemailer from 'nodemailer';
import { sendBookingConfirmationEmailSG } from './sendgrid';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface PassengerDetails {
  gender: string;
  phone: string;
  idType: string;
  idNumber: string;
}

interface BookingDetails {
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
  passenger?: PassengerDetails;
}

function maskIdNumber(idNumber: string): string {
  if (idNumber.length >= 6) {
    return idNumber.slice(0, 2) + '****' + idNumber.slice(-2);
  } else if (idNumber.length >= 4) {
    return idNumber.slice(0, 1) + '**' + idNumber.slice(-1);
  }
  return '****';
}

function formatGender(gender: string): string {
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

export async function sendBookingConfirmationEmail(booking: BookingDetails): Promise<void> {
  const { bookingId, userEmail, tripDetails, seats, pickupPoint, dropPoint, amount, currency, passenger } = booking;
  
  const departureDate = new Date(tripDetails.departureTime).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const departureTimeFormatted = new Date(tripDetails.departureTime).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const arrivalTimeFormatted = new Date(tripDetails.arrivalTime).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(parseFloat(amount));

  const passengerHtml = passenger ? `
    <div class="passenger-card" style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #0369a1;">👤 Passenger Details</p>
      <div class="detail-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #6b7280;">Gender</span>
        <span style="font-weight: 500; color: #1f2937;">${formatGender(passenger.gender)}</span>
      </div>
      <div class="detail-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #6b7280;">Phone</span>
        <span style="font-weight: 500; color: #1f2937;">${passenger.phone}</span>
      </div>
      <div class="detail-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #6b7280;">ID Type</span>
        <span style="font-weight: 500; color: #1f2937;">${passenger.idType}</span>
      </div>
      <div class="detail-row" style="display: flex; justify-content: space-between;">
        <span style="color: #6b7280;">ID Number</span>
        <span style="font-weight: 500; color: #1f2937;">${maskIdNumber(passenger.idNumber)}</span>
      </div>
    </div>
  ` : '';

  const passengerText = passenger ? `
Passenger Details:
Gender: ${formatGender(passenger.gender)}
Phone: ${passenger.phone}
ID Type: ${passenger.idType}
ID Number: ${maskIdNumber(passenger.idNumber)}
` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #7c3aed, #06b6d4); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .booking-id { background: #f0f9ff; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
        .booking-id span { font-size: 24px; font-weight: bold; color: #0369a1; }
        .journey-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .route { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; }
        .city { text-align: center; }
        .city-name { font-size: 18px; font-weight: bold; color: #1f2937; }
        .time { font-size: 14px; color: #6b7280; }
        .arrow { color: #06b6d4; font-size: 24px; }
        .details { border-top: 1px solid #e5e7eb; padding-top: 15px; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .detail-label { color: #6b7280; }
        .detail-value { font-weight: 500; color: #1f2937; }
        .total { background: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center; }
        .total-amount { font-size: 28px; font-weight: bold; color: #16a34a; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎫 Booking Confirmed!</h1>
        </div>
        <div class="content">
          <div class="booking-id">
            <p style="margin: 0 0 5px 0; color: #6b7280;">Booking ID</p>
            <span>#${bookingId}</span>
          </div>
          
          ${passengerHtml}
          
          <div class="journey-card">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #7c3aed;">${tripDetails.operatorName}</p>
            <div class="route">
              <div class="city">
                <div class="city-name">${tripDetails.source}</div>
                <div class="time">${departureTimeFormatted}</div>
              </div>
              <div class="arrow">→</div>
              <div class="city">
                <div class="city-name">${tripDetails.destination}</div>
                <div class="time">${arrivalTimeFormatted}</div>
              </div>
            </div>
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-value">${departureDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration</span>
                <span class="detail-value">${tripDetails.duration}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Seats</span>
                <span class="detail-value">${seats.join(', ')}</span>
              </div>
              ${pickupPoint ? `
              <div class="detail-row">
                <span class="detail-label">Pickup</span>
                <span class="detail-value">${pickupPoint}</span>
              </div>
              ` : ''}
              ${dropPoint ? `
              <div class="detail-row">
                <span class="detail-label">Drop</span>
                <span class="detail-value">${dropPoint}</span>
              </div>
              ` : ''}
            </div>
          </div>
          
          <div class="total">
            <p style="margin: 0 0 5px 0; color: #6b7280;">Total Paid</p>
            <div class="total-amount">${formattedAmount}</div>
          </div>
        </div>
        <div class="footer">
          <p>Thank you for booking with NexTravel!</p>
          <p>For any queries, contact support@nextravel.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Booking Confirmed!

Booking ID: #${bookingId}
${passengerText}
Journey Details:
${tripDetails.operatorName}
${tripDetails.source} → ${tripDetails.destination}
Date: ${departureDate}
Departure: ${departureTimeFormatted}
Arrival: ${arrivalTimeFormatted}
Duration: ${tripDetails.duration}
Seats: ${seats.join(', ')}
${pickupPoint ? `Pickup: ${pickupPoint}` : ''}
${dropPoint ? `Drop: ${dropPoint}` : ''}

Total Paid: ${formattedAmount}

Thank you for booking with NexTravel!
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'NexTravel <noreply@nextravel.com>',
      to: userEmail,
      subject: `🎫 Booking Confirmed - ${tripDetails.source} to ${tripDetails.destination} | #${bookingId}`,
      text,
      html,
    });

    console.log('Sent booking confirmation to', userEmail, 'for booking', bookingId);
    console.log(`📧 Gmail Message ID: ${info.messageId}`);
  } catch (gmailErr: any) {
    console.error('GMAIL SEND ERROR', gmailErr?.message || gmailErr);
    
    if (process.env.SENDGRID_API_KEY) {
      console.log('Falling back to SendGrid...');
      await sendBookingConfirmationEmailSG(booking);
      console.log('Sent booking confirmation via SendGrid to', userEmail);
      return;
    }
    
    throw gmailErr;
  }
}
