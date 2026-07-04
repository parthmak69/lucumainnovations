const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const getTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
        port: parseInt(process.env.EMAIL_PORT || '465', 10),
        secure: true,
        auth: {
            user: process.env.EMAIL_USER || 'info@lucumainnovations.com',
            pass: process.env.EMAIL_PASS || 'Gooners@6769',
        },
        tls: {
            rejectUnauthorized: false 
        }
    });
};

const sendMail = async (to, subject, templateName, placeholders) => {
    try {
        const templatePath = path.join(__dirname, `../templates/${templateName}.html`);
        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        Object.keys(placeholders).forEach((key) => {
            htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), placeholders[key]);
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"Lucuma Innovations" <info@lucumainnovations.com>',
            to,
            subject,
            html: htmlContent,
        };

        const transporter = getTransporter();
        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.error("Detailed SMTP Server Handshake Stack:", error);
        throw new Error('Email delivery failed');
    }
};

module.exports = { sendMail };