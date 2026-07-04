const Enquiry = require('../models/enquiryModel');
const Otp = require('../models/otpModel');
const { sendMail } = require('../services/emailService');

const createEnquiry = async (req, res) => {
    try {
        const { name, email, phone, company, message, formType } = req.body;

        const otpRecord = await Otp.findOne({ email });
        if (!otpRecord) {
            return res.status(400).json({ message: 'Please verify your email via OTP before submitting' });
        }

        const typeOfForm = formType || 'contact';

        const newEnquiry = new Enquiry({
            name,
            email,
            phone: phone || 'Not Provided',
            company: company || 'Not Provided',
            message,
            formType: typeOfForm
        });

        await newEnquiry.save();
        await Otp.deleteOne({ email });

        if (typeOfForm === 'get-started') {

            await sendMail(email, "Your Project Onboarding Brief Received", 'get_started_confirmation', { name });

            await sendMail(
                process.env.ADMIN_EMAIL,
                '[ONBOARDING ALERT] New Project Brief Received',
                'get_started_admin',
                { name, email, company: company || 'N/A', message }
            );
        } else {
            await sendMail(email, "We've received your enquiry", 'confirmation', { name });

            await sendMail(
                process.env.ADMIN_EMAIL,
                '[CONTACT ALERT] New Enquiry Received',
                'admin',
                { name, email, phone: phone || 'N/A', company: company || 'N/A', message }
            );
        }

        res.status(201).json({ success: true, message: 'Enquiry processed and recorded successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createEnquiry };