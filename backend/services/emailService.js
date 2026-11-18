const fs = require('fs');
const path = require('path');

const sendMail = async (
    to,
    subject,
    templateName,
    placeholders = {},
    options = {}
) => {
    try {
        // Load email template
        const templatePath = path.join(
            __dirname,
            `../templates/${templateName}.html`
        );

        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        // Replace template placeholders
        Object.entries(placeholders).forEach(([key, value]) => {
            htmlContent = htmlContent.replace(
                new RegExp(`{{${key}}}`, 'g'),
                String(value ?? '')
            );
        });

        // Validate Resend API key
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not configured');
        }

        // Determine sender and reply-to
        const from = options.from || process.env.CONTACT_FROM_EMAIL;
        const replyTo = options.replyTo || process.env.CONTACT_REPLY_TO;

        if (!from || !to) {
            throw new Error('Email sender or recipient is missing');
        }

        // EMAIL DEBUGGING
        console.log('\n========== EMAIL DEBUG ==========');
        console.log('Recipient:', to);
        console.log('Subject:', subject);
        console.log('EMAIL ACTUALLY SENT FROM:', from);
        console.log('EMAIL REPLY TO:', replyTo);
        console.log('Template:', templateName);
        console.log('=================================\n');

        // Resend API payload
        const payload = {
            from: from,
            to: [to],
            subject: subject,
            html: htmlContent
        };

        if (replyTo) {
            payload.reply_to = replyTo;
        }

        // Send email using Resend
        const response = await fetch(
            'https://api.resend.com/emails',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(
                responseData.message || 'Resend email delivery failed'
            );
        }

        console.log('Resend Email ID:', responseData.id);
        console.log('Email request accepted successfully.');

        return responseData;

    } catch (error) {
        console.error('Email Delivery Error:', error.message);
        throw error;
    }
};

module.exports = { sendMail };