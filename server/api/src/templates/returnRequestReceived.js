import { renderBrandFooter, renderBrandHeader } from './emailTheme.js';

/**
 * Template: Return Request Received
 * Sent when a customer submits a return/refund request.
 */

const typeLabels = {
    DEFECTIVE_PRODUCT: 'Producto defectuoso',
    CHANGE_OF_MIND: 'Cambio de opinion',
    WRONG_PRODUCT: 'Producto equivocado',
    OTHER: 'Otro motivo',
};

export function returnRequestReceivedTemplate({
    firstName,
    orderNumber,
    returnType,
    description,
}) {
    const label = typeLabels[returnType] || returnType;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Solicitud de devolucion recibida</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        ${renderBrandHeader({ subtitle: 'Solicitud de devolucion recibida' })}

        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hola, <strong>${firstName}</strong></p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
              Recibimos tu solicitud para el pedido <strong style="color:#111827;">${orderNumber}</strong>.
              Nuestro equipo la revisara en un plazo de 1 a 3 dias habiles.
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
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">Motivo</td>
                      <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${label}</td>
                    </tr>
                  </table>
                  <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;">
                    <p style="margin:0 0 6px;color:#6b7280;font-size:13px;font-weight:500;">Tu descripcion:</p>
                    <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;font-style:italic;">"${description}"</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${renderBrandFooter({ note: 'Si tienes preguntas, responde este correo.' })}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
