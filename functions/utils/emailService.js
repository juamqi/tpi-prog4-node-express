const nodemailer = require("nodemailer");
const functions = require("firebase-functions");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || 
          (functions.config().email && functions.config().email.user),
    pass: process.env.EMAIL_PASSWORD || 
          (functions.config().email && functions.config().email.password),
  },
});

async function sendWelcomeEmail(email, displayName, userType) {
  const subject = userType === "reseller"
    ? "¡Bienvenido a TangoShop como revendedor!"
    : "¡Bienvenido a TangoShop como Proveedor!";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>¡Bienvenido a TangoShop!</h1>
      </div>
      <div class="content">
        <h2>Hola ${displayName},</h2>
        <p>
          Gracias por unirte a TangoShop, la plataforma líder en dropshipping
          ${userType === "reseller" ? "para revendedores" : "para proveedores"}.
        </p>
        ${userType === "reseller" ? `
          <p>Como revendedor, ahora puedes:</p>
          <ul>
            <li>Explorar miles de productos de proveedores confiables</li>
            <li>Crear tu catálogo personalizado</li>
            <li>Configurar tus márgenes de ganancia</li>
            <li>Compartir tu catálogo con clientes</li>
          </ul>
        ` : `
          <p>Como proveedor, ahora puedes:</p>
          <ul>
            <li>Publicar tus productos</li>
            <li>Llegar a miles de revendedores</li>
            <li>Gestionar tu inventario</li>
            <li>Ver estadísticas de tus productos</li>
          </ul>
        `}
        <p>
          Si tienes alguna pregunta, no dudes en contactarnos.
        </p>
        <p>
          ¡Exitos!<br>
          <strong>El equipo de TangoShop</strong>
        </p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} TangoShop. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@tangoshop.com",
    to: email,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendWelcomeEmail,
};