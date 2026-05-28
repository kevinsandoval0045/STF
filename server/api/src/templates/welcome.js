/**
 * Template: Welcome Email
 * Sent when a new user registers.
 *
 * @param {Object} params
 * @param {string} params.firstName
 * @returns {string} HTML string
 */
export function welcomeTemplate({ firstName }) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a nuestra tienda</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                Tienda de Suplementos
              </h1>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:40px 32px 24px;text-align:center;">
              <span style="font-size:48px;">💪</span>
              <h2 style="margin:16px 0 8px;color:#111827;font-size:24px;font-weight:700;">¡Bienvenido, ${firstName}!</h2>
              <p style="margin:0;color:#6b7280;font-size:15px;line-height:1.6;max-width:420px;margin:0 auto;">
                Tu cuenta ha sido creada exitosamente. Ahora puedes explorar nuestro catálogo de suplementos y realizar tus compras de forma segura.
              </p>
            </td>
          </tr>

          <!-- Features -->
          <tr>
            <td style="padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px;background:#f9fafb;border-radius:8px;text-align:center;width:33%;">
                    <div style="font-size:24px;margin-bottom:6px;">🛒</div>
                    <p style="margin:0;font-size:13px;color:#374151;font-weight:600;">Compra fácil</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">Checkout en 2 pasos</p>
                  </td>
                  <td width="12"></td>
                  <td style="padding:12px;background:#f9fafb;border-radius:8px;text-align:center;width:33%;">
                    <div style="font-size:24px;margin-bottom:6px;">📦</div>
                    <p style="margin:0;font-size:13px;color:#374151;font-weight:600;">Rastreo real</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">Sigue tu pedido</p>
                  </td>
                  <td width="12"></td>
                  <td style="padding:12px;background:#f9fafb;border-radius:8px;text-align:center;width:33%;">
                    <div style="font-size:24px;margin-bottom:6px;">🔒</div>
                    <p style="margin:0;font-size:13px;color:#374151;font-weight:600;">Pago seguro</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">Mercado Pago</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:8px 32px 36px;text-align:center;">
              <a href="http://localhost:5173"
                 style="display:inline-block;background:#E02424;color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                Explorar productos
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Tienda de Suplementos &bull; Si no creaste esta cuenta, ignora este correo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
