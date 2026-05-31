import { buildFrontendUrl, renderBrandFooter, renderBrandHeader } from './emailTheme.js';

/**
 * Template: Welcome Email
 * Sent when a new user registers.
 */
export function welcomeTemplate({ firstName }) {
    const shopUrl = buildFrontendUrl('/');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          ${renderBrandHeader({ subtitle: 'Bienvenido a STF' })}

          <tr>
            <td style="padding:40px 32px 24px;text-align:center;">
              <h2 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">Bienvenido, ${firstName}</h2>
              <p style="margin:0;color:#6b7280;font-size:15px;line-height:1.6;max-width:420px;margin:0 auto;">
                Tu cuenta fue creada exitosamente. Ya puedes explorar nuestro catalogo y comprar de forma segura.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 32px 36px;text-align:center;">
              <a href="${shopUrl}" style="display:inline-block;background:#E02424;color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                Explorar productos
              </a>
            </td>
          </tr>

          ${renderBrandFooter({ note: 'Si no creaste esta cuenta, ignora este correo.' })}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
