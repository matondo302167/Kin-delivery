import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

function getTwilioClient() {
  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN sont requis');
  }
  return twilio(accountSid, authToken);
}

function formatPhoneNumber(phone: string): string {
  let formatted = phone.trim();
  if (formatted.startsWith('+')) {
    return formatted;
  }
  if (formatted.startsWith('00')) {
    return '+' + formatted.substring(2);
  }
  if (formatted.startsWith('0')) {
    return '+243' + formatted.substring(1);
  }
  return '+' + formatted;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendPinCodeSms(
  recipientPhone: string,
  pinCode: string,
  trackingToken: string
): Promise<SendSmsResult> {
  try {
    const client = getTwilioClient();

    const formattedPhone = formatPhoneNumber(recipientPhone);

    const message = `KOLISA Livraison\n\nVotre colis arrive!\n\nCode PIN: ${pinCode}\n\nSuivi: ${trackingToken}\n\nPrésentez ce code au livreur.`;

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedPhone,
    });

    console.log('Twilio SMS sent:', result.sid);
    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error: any) {
    console.error('Twilio SMS error:', error.message || error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

export async function sendDeliveryConfirmationSms(
  recipientPhone: string,
  trackingToken: string
): Promise<SendSmsResult> {
  try {
    const client = getTwilioClient();

    const formattedPhone = formatPhoneNumber(recipientPhone);

    const message = `KOLISA Livraison\n\nVotre colis a été livré avec succès!\n\nSuivi: ${trackingToken}\n\nMerci d'avoir utilisé KOLISA.`;

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedPhone,
    });

    console.log('Twilio SMS sent:', result.sid);
    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error: any) {
    console.error('Twilio SMS error:', error.message || error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}
