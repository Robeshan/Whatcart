import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (to: string, code: string) => {
  const mailOptions = {
    from: `"Whatcart" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your Verification Code',
    text: `Your verification code is: ${code}`,
    html: `<b>Your verification code is: ${code}</b>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
};
