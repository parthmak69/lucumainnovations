const Enquiry = require('../models/enquiryModel');
const Otp = require('../models/otpModel');
const { sendMail } = require('../services/emailService');

const createEnquiry = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            company,
            message,
            formType
        } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                message: 'Name, email and message are required'
            });
        }

        const typeOfForm = formType || 'contact';

        if (!['contact', 'get-started'].includes(typeOfForm)) {
            return res.status(400).json({
                message: 'Invalid form type'
            });
        }

        const otpRecord = await Otp.findOne({ email });

        if (!otpRecord) {
            return res.status(400).json({
                message: 'Please verify your email via OTP before submitting'
            });
        }

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

        res.status(201).json({
            success: true,
            message: 'Enquiry processed and recorded successfully'
        });

        setImmediate(async () => {
            try {

                // GET STARTED FORM
                if (typeOfForm === 'get-started') {

                    // Customer confirmation
                    await sendMail(
                        email,
                        'Your Project Onboarding Brief Received',
                        'get_started_confirmation',
                        { name },
                        {
                            from: process.env.SALES_FROM_EMAIL,
                            replyTo: process.env.SALES_REPLY_TO
                        }
                    );

                    // Internal notification to SALES
                    await sendMail(
                        process.env.SALES_NOTIFICATION_EMAIL,
                        '[ONBOARDING ALERT] New Project Brief Received',
                        'get_started_admin',
                        {
                            name,
                            email,
                            phone: phone || 'Not Provided',
                            company: company || 'Not Provided',
                            message
                        },
                        {
                            from: process.env.CONTACT_FROM_EMAIL,
                            replyTo: email
                        }
                    );

                }

                // CONTACT FORM
                else {

                    // Customer confirmation
                    await sendMail(
                        email,
                        "We've received your enquiry",
                        'confirmation',
                        { name },
                        {
                            from: process.env.CONTACT_FROM_EMAIL,
                            replyTo: process.env.CONTACT_REPLY_TO
                        }
                    );

                    // Internal notification to ADMIN_EMAIL
                    await sendMail(
                        process.env.ADMIN_EMAIL,
                        '[CONTACT ALERT] New Enquiry Received',
                        'admin',
                        {
                            name,
                            email,
                            phone: phone || 'Not Provided',
                            company: company || 'Not Provided',
                            message
                        },
                        {
                            from: process.env.CONTACT_FROM_EMAIL,
                            replyTo: email
                        }
                    );
                }

            } catch (mailError) {
                console.error(
                    'Background Operational Mailer System Exception:',
                    mailError.message
                );
            }
        });

    } catch (error) {
        if (!res.headersSent) {
            return res.status(500).json({
                message: error.message
            });
        }
    }
};

module.exports = { createEnquiry };