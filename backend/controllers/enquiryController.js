const Enquiry = require('../models/enquiryModel');
const { sendMail } = require('../services/emailService');

const createEnquiry = async (req, res) => {
    try {
        const { name, email, phone, company, message } = req.body;

        const newEnquiry = new Enquiry({
            name,
            email,
            phone,
            company: company || 'Not Provided',
            message
        });

        await newEnquiry.save();

        // 1. Sends premium dark-themed confirmation receipt to the client
        await sendMail(email, "We've received your enquiry", 'confirmation', { name });

        // 2. Sends layout alert notification straight to your Admin Inbox
        await sendMail(
            process.env.ADMIN_EMAIL,
            '[ALERT] New Enquiry Received',
            'admin',
            { name, email, phone, company: company || 'N/A', message }
        );

        res.status(201).json({ success: true, message: 'Enquiry processed and recorded successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createEnquiry };