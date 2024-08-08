import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    service: 'Gmail', // Adjust as necessary
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  export default transporter