import { renderBrandFooter, renderBrandHeader } from './emailTheme.js';

const statusLabels = {
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    REFUND_RECEIVED: 'Reembolso recibido',
    COMPLETED: 'Completada',
};

/**
 * Template: Return Request Status Updated
 */
export function returnStatusUpdatedTemplate({
    firstName,
    orderNumber,
    status,
    adminNote,
    returnCode,
    carrier,
}) {
    const label = statusLabels[status] || status;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Actualizacion de devolucion</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        ${renderBrandHeader({ subtitle: 'Actualizacion de devolucion' })}

        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hola, <strong>${firstName}</strong></p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
              Tu solicitud de devolucion del pedido <strong style="color:#111827;">${orderNumber}</strong> cambio a estado:
              <strong style="color:#111827;">${label}</strong>.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">Pedido</td>
                      <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${orderNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">Estado actual</td>
                      <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:700;text-align:right;">${label}</td>
                    </tr>
                    ${returnCode ? `
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">Codigo de devolucion</td>
                      <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${returnCode}</td>
                    </tr>` : ''}
                    ${carrier ? `
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">Paqueteria</td>
                      <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${carrier}</td>
                    </tr>` : ''}
                  </table>
                  ${adminNote ? `
                    <div style="margin-top:14px;padding-top:14px;border-top:1px solid #e5e7eb;">
                      <p style="margin:0 0 4px;color:#6b7280;font-size:12px;">Nota del equipo:</p>
                      <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">${adminNote}</p>
                    </div>
                  ` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${renderBrandFooter({ note: 'Gracias por tu paciencia durante el proceso.' })}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
