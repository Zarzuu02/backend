const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function sendConfirmationEmail(to, nombre, fecha, hora) {
  const mailOptions = {
    from: `"Peluquería" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Tu cita ha sido confirmada ✅',
    html: `
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Tu cita ha sido <strong>confirmada</strong> para:</p>
      <ul>
        <li><strong>Fecha:</strong> ${fecha}</li>
        <li><strong>Hora:</strong> ${hora}</li>
      </ul>
      <p>¡Te esperamos!</p>
    `
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendConfirmationEmail
};
