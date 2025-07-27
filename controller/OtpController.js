const Otp = require('../model/Otp'); // Adjust path
const nodemailer = require('nodemailer');
require('dotenv').config();

exports.sendOtp = async (req, res) => {
    const { email } = req.body;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email }); // remove previous OTPs

    const otp = new Otp({ email, otp: otpCode });
    await otp.save();

    // Send OTP by email (example with nodemailer)
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS
        },
    });

    await transporter.sendMail({
        from: '"Crypto App" <your_email@gmail.com>',
        to: email,
        subject: 'Your OTP Code - Crypto App',
        text: `Your OTP is ${otpCode}`, // plain text fallback
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #333; text-align: center;">🔐 Crypto App Verification</h2>
            <p style="font-size: 16px; color: #555;">
              Hello, <br><br>
              Use the OTP code below to complete your verification process. This OTP is valid for only a few minutes, so please use it promptly.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="display: inline-block; padding: 15px 30px; font-size: 24px; font-weight: bold; background-color: #1a73e8; color: #fff; border-radius: 6px; letter-spacing: 2px;">
                ${otpCode}
              </span>
            </div>
            <p style="font-size: 14px; color: #555;">
              If you didn't request this code, you can safely ignore this email.
            </p>
            <hr style="margin-top: 30px;">
            <p style="font-size: 12px; color: #aaa; text-align: center;">
              © ${new Date().getFullYear()} Crypto App. All rights reserved.
            </p>
          </div>
        `,
    });


    res.json({ message: 'OTP sent to email' });
};

