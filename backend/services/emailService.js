const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendMail = async (to, subject, templateName, placeholders) => {
    try {
        const templatePath = path.join(__dirname, `../templates/${templateName}.html`);
        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        Object.keys(placeholders).forEach((key) => {
            htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), placeholders[key]);
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.error(`Email delivery breakdown: ${error.message}`);
        throw new Error('Email delivery failed');
    }
};

module.exports = { sendMail };