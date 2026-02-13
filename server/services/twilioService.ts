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

    let formattedPhone = recipientPhone.trim();
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+243' + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith('243')) {
        formattedPhone = '+' + formattedPhone;
      } else {
        formattedPhone = '+243' + formattedPhone;
      }
    }

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

    let formattedPhone = recipientPhone.trim();
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+243' + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith('243')) {
        formattedPhone = '+' + formattedPhone;
      } else {
        formattedPhone = '+243' + formattedPhone;
      }
    }

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
