import nodemailer from 'nodemailer';

// Generate a random 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via email
export const sendOTPEmail = async (email, otp) => {
  try {
    // In a real app, you would use a proper email service like SendGrid, Mailgun, etc.
    // This is a basic example using nodemailer with Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@tugoodtugo.com',
      to: email,
      subject: 'Your OTP for TuGood TuGo',
      text: `Your OTP is: ${otp}\nThis OTP is valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your TuGood TuGo Verification Code</h2>
          <p>Use the following OTP to complete your sign in:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0; padding: 15px; background: #f5f5f5; display: inline-block;">
            ${otp}
          </div>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            This is an automated message, please do not reply directly to this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};
