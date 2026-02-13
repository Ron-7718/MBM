export const sendOtp = async (identifier: string, otp: string) => {
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

  if (isEmail) {
    console.log(`📧 Sending OTP ${otp} to email: ${identifier}`);
    // TODO: Integrate Nodemailer here
  } else {
    console.log(`📱 Sending OTP ${otp} to phone: ${identifier}`);
    // TODO: Integrate Twilio / SMS API here
  }
};
