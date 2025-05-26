const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const enviarCorreoCita = async ({ email, nombre, fecha, hora, peluquero }) => {
  const mailOptions = {
    from: `"Peluquería" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Registro de cita',
    html: `
      <h3>Hola ${nombre},</h3>
      <p>Tu cita ha sido registrada con éxito:</p>
      <ul>
        <li><strong>Fecha:</strong> ${fecha}</li>
        <li><strong>Hora:</strong> ${hora}</li>
        <li><strong>Peluquero:</strong> ${peluquero}</li>
      </ul>
      <p>¡Gracias por elegirnos!</p>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { enviarCorreoCita };
