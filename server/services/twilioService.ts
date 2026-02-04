// Twilio SMS Service for sending PIN codes
import twilio from 'twilio';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.account_sid || !connectionSettings.settings.api_key || !connectionSettings.settings.api_key_secret)) {
    throw new Error('Twilio not connected');
  }
  return {
    accountSid: connectionSettings.settings.account_sid,
    apiKey: connectionSettings.settings.api_key,
    apiKeySecret: connectionSettings.settings.api_key_secret,
    phoneNumber: connectionSettings.settings.phone_number
  };
}

async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, {
    accountSid: accountSid
  });
}

async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send PIN code SMS to recipient
 */
export async function sendPinCodeSms(
  recipientPhone: string,
  pinCode: string,
  trackingToken: string
): Promise<SendSmsResult> {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();
    
    // Format phone number for DRC (Kinshasa)
    let formattedPhone = recipientPhone.trim();
    
    // Add +243 country code if not present
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+243' + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith('243')) {
        formattedPhone = '+' + formattedPhone;
      } else {
        formattedPhone = '+243' + formattedPhone;
      }
    }
    
    // SMS message in French for Kinshasa
    const message = `KOLISA Livraison\n\nVotre colis arrive!\n\nCode PIN: ${pinCode}\n\nSuivi: ${trackingToken}\n\nPrésentez ce code au livreur.`;
    
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedPhone,
    });
    
    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error: any) {
    console.error('Twilio SMS error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

/**
 * Send delivery confirmation SMS to recipient
 */
export async function sendDeliveryConfirmationSms(
  recipientPhone: string,
  trackingToken: string
): Promise<SendSmsResult> {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();
    
    // Format phone number
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
    
    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error: any) {
    console.error('Twilio SMS error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}
