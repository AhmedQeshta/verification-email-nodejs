const nodemailer = require('nodemailer');

const { EMAIL_SENDER, MAIL_HOST, MAIL_USER, MAIL_PASS } = process.env;

const sendEmail = async (to, subject, html) => {
  try {
    const transport = nodemailer.createTransport({
      host: MAIL_HOST,
      port: 2525,
      // secure: true,
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
      },
    });

    await transport.sendMail({
      from: EMAIL_SENDER,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = sendEmail;
