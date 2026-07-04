const fs = require('fs');
const path = require('path');

const sendMail = async (to, subject, templateName, placeholders) => {
    try {
        const templatePath = path.join(__dirname, `../templates/${templateName}.html`);
        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        Object.keys(placeholders).forEach((key) => {
            htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), placeholders[key]);
        });

        // Sending via an HTTPS API call on Port 443, bypassing Render's SMTP block entirely
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Lucuma Innovations <info@lucumainnovations.com>',
                to: [to],
                subject: subject,
                html: htmlContent
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'API delivery failure');
        }

        return await response.json();
    } catch (error) {
        console.error("HTTP Email Delivery Error:", error.message);
        throw error;
    }
};

module.exports = { sendMail };