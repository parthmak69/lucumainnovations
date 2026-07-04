const crypto = require('crypto');
const bcrypt = require('bcrypt');
const Otp = require('../models/otpModel');
const { sendMail } = require('../services/emailService');

const sendOtp = async (req, res) => {
    try {
        const { email, phone } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email field is required' });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);

        await Otp.findOneAndUpdate(
            { email },
            { otpHash, attempts: 0, createdAt: Date.now() },
            { upsert: true, returnDocument: 'after' }
        );

        console.log(`\n>>> [RENDER CONSOLE] ACTIVE OTP CODE FOR ${email}: [ ${otp} ] <<<\n`);

        sendMail(email, 'Your Verification Code', 'otp', { otp })
            .catch(err => console.error("Background Mail System Log:", err.message));

        return res.status(200).json({ success: true, message: 'Verification OTP successfully transmitted' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP parameters are required' });
        }

        const otpRecord = await Otp.findOne({ email });
        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP has expired or does not exist' });
        }

        if (otpRecord.attempts >= 5) {
            return res.status(400).json({ message: 'Maximum verification attempts exceeded. Please request a new code.' });
        }

        const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
        if (!isMatch) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        return res.status(200).json({ success: true, message: 'Identity verified successfully' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { sendOtp, verifyOtp };