import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false,
        auth: {
            user: "96174c001@smtp-brevo.com",
            pass: "xsmtpsib-8b002bcaaf2cc76ee975dcf8a173d0cd80f69d0a9715e9599b3cc53d2569a33c-Ljy6zmW77ac58Plk",
        },
    });

export default transporter;

