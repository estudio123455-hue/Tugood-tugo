import { generateOTP, sendOTPEmail } from '../../services/otpService.js';
import { getUserByEmail } from '../../models/User.js';

export const requestOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Check if user exists (for login) or doesn't exist (for signup)
    const user = await getUserByEmail(email);
    
    // Generate OTP
    const otp = generateOTP();
    
    // In a real app, you would save this OTP to the database with an expiration
    // For now, we'll just log it to the console
    console.log(`OTP for ${email}: ${otp}`);
    
    // Send OTP via email
    await sendOTPEmail(email, otp);
    
    res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully' 
    });
    
  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error sending OTP',
      error: error.message 
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }

    // In a real app, you would verify the OTP against the stored value in the database
    // For now, we'll just log it
    console.log(`Verifying OTP for ${email}: ${otp}`);
    
    // Mock verification - in a real app, check against the stored OTP
    const isVerified = true; // Replace with actual verification logic
    
    if (isVerified) {
      // Generate a token for the user
      const token = generateAuthToken({ email });
      
      return res.status(200).json({ 
        success: true, 
        message: 'OTP verified successfully',
        token
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }
    
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying OTP',
      error: error.message 
    });
  }
};
