require('dotenv').config();

module.exports = {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_ENCRYPTION === 'ssl',
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
    },
    from: {
        address: process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME,
        name: process.env.MAIL_FROM_NAME || 'Arsip Surat Digital'
    },
    replyTo: process.env.MAIL_REPLY_TO || process.env.MAIL_USERNAME
};
