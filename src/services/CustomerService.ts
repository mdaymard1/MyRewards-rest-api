export const sendSMSVerification = async (
  countryCode: string,
  phoneNumber: string,
  businessId: string
) => {
  console.log("inside sendSMSVerification");

  const client = require("twilio")(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    const verify = await client.verify.v2
      .services(process.env.VERIFY_SERVICE_SID)
      .verifications.create({
        to: `${countryCode}${phoneNumber}`,
        channel: "sms",
      });
    return verify.status;
  } catch (error) {
    console.log("Error thrown by verifications.create: " + error);
    return null;
  }
};

export const verifyCodeIsValid = async (
  countryCode: string,
  phoneNumber: string,
  businessId: string,
  code: string
) => {
  console.log("inside verifyCodeIsValid");

  const client = require("twilio")(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    const verifyCheck = await client.verify.v2
      .services(process.env.VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: `${countryCode}${phoneNumber}`,
        code: `${code}`,
      });
    return verifyCheck.status;
  } catch (error) {
    console.log("Error thrown by verificationChecks.create: " + error);
    return null;
  }
};

module.exports = {
  sendSMSVerification,
  verifyCodeIsValid,
};
