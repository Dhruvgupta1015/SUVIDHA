import twilio from 'twilio';

let twilioClient = null;
let twilioPhone = null;

export const initSMS = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (sid && token && twilioPhone) {
    try {
      twilioClient = twilio(sid, token);
      console.log('[SMS] Twilio service initialized successfully');
    } catch (err) {
      console.warn('[SMS] Twilio initialization failed. Falling back to mock SMS.', err.message);
    }
  } else {
    console.warn('[SMS] Twilio credentials missing. Using Mock SMS provider (console logs).');
  }
};

/**
 * Sends an OTP via SMS to the provided mobile number.
 * @param {string} mobile - 10 digit mobile number
 * @param {string} otp - 6 digit OTP
 */
export const sendOTP = async (mobile, otp) => {
  const messageBody = `SUVIDHA Civic Portal: Your login OTP is ${otp}. It expires in 5 minutes. Do not share this with anyone.`;
  const formattedMobile = `+91${mobile}`; // Assumes India for hackathon scope
  
  if (twilioClient) {
    try {
      const message = await twilioClient.messages.create({
        body: messageBody,
        from: twilioPhone,
        to: formattedMobile
      });
      console.log(`[SMS] Twilio dispatch success: ${message.sid} to ${formattedMobile}`);
      return true;
    } catch (err) {
      console.error(`[SMS] Twilio dispatch failed to ${formattedMobile}:`, err.message);
      // Fallback in case of Twilio trial restrictions to unverified numbers
      console.log(`[SMS MOCK FALLBACK] To: ${formattedMobile} | Body: ${messageBody}`);
      return true;
    }
  } else {
    // Local dev / no-credentials fallback
    console.log(`\n=========================================`);
    console.log(`[SMS MOCK PROVIDER] Dispatching Message`);
    console.log(`To:   ${formattedMobile}`);
    console.log(`Body: ${messageBody}`);
    console.log(`=========================================\n`);
    return true;
  }
};
