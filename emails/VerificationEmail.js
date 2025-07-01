export default function VerificationEmail({ email, verificationUrl }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Verifica tu cuenta - Katalyst</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #233746; margin-bottom: 10px;">Katalyst</h1>
                <h2 style="color: #233746;">Verifica tu cuenta</h2>
            </div>
            
            <div style="margin-bottom: 30px;">
                <p>¡Hola!</p>
                <p>Gracias por registrarte en <strong>Katalyst</strong>. Para completar tu registro, necesitamos verificar tu dirección de email.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #233746; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                        Verificar mi cuenta
                    </a>
                </div>
                
                <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                <p style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 12px;">
                    ${verificationUrl}
                </p>
                
                <p><strong>Importante:</strong></p>
                <ul>
                    <li>Este enlace expira en 1 hora</li>
                    <li>Si no solicitaste este registro, ignora este email</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
                <p>© 2024 Katalyst. Todos los derechos reservados.</p>
                <p>Email enviado a: ${email}</p>
            </div>
        </div>
    </body>
    </html>
  `;
}
