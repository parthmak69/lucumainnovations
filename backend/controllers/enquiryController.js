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

        // 👉 CRITICAL FIX: Return response IMMEDIATELY to drop the frontend loading spinners instantly!
        res.status(201).json({ success: true, message: 'Enquiry processed and recorded successfully' });

        // 👉 OFF-LOAD MAILS: Run dispatches in background threads using non-blocking asynchronous execution
        setImmediate(async () => {
            try {
                if (typeOfForm === 'get-started') {
                    // User Confirmation
                    await sendMail(email, "Your Project Onboarding Brief Received", 'get_started_confirmation', { name });

                    // Admin Alert Notification
                    await sendMail(
                        process.env.ADMIN_EMAIL,
                        '[ONBOARDING ALERT] New Project Brief Received',
                        'get_started_admin',
                        { name, email, phone: phone || 'Not Provided', company: company || 'Not Provided', message }
                    );
                } else {
                    // User Confirmation
                    await sendMail(email, "We've received your enquiry", 'confirmation', { name });

                    // Admin Alert Notification
                    await sendMail(
                        process.env.ADMIN_EMAIL,
                        '[CONTACT ALERT] New Enquiry Received',
                        'admin',
                        { name, email, phone: phone || 'Not Provided', company: company || 'Not Provided', message }
                    );
                }
            } catch (mailError) {
                console.error("Background Operational Mailer System Exception:", mailError.message);
            }
        });

    } catch (error) {
        // Prevent application hanging if errors break before headers are written
        if (!res.headersSent) {
            return res.status(500).json({ message: error.message });
        }
    }
};

module.exports = { createEnquiry };