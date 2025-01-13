import speakeasy from "speakeasy";
import qrcode from "qrcode";

class TOTP_GEN {
  constructor() {}

  generateTOTP() {
    const secret = speakeasy.generateSecret({
      length: 20,
      name: "Task Management",
    });

    const qr_url = qrcode
      .toDataURL(secret.otpauth_url)
      .then((data_url) => {
        return { secret: secret.base32, qr_url: data_url };
      })
      .catch((err) => {
        throw new Error("Error generating QR code:", err);
      });

    return qr_url;
  }

  // Verify the TOTP code
  verifyTOTP(token, userSecret) {
    return speakeasy.totp.verify({
      secret: userSecret,
      encoding: "base32",
      token: token,
      window: 1,
    });
  }
}

export default TOTP_GEN;
