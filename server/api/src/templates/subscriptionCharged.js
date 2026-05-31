import {
    formatDateEsMx,
    formatMXN,
    renderBrandFooter,
    renderBrandHeader,
} from './emailTheme.js';

/**
 * Template: Subscription Charged (recurring payment processed)
 * Sent each time Mercado Pago successfully charges a recurring payment.
 */
export function subscriptionChargedTemplate({
    firstName,
    productName,
    amount,
    nextBillingDate,
    billingDays,
}) {
    const formattedDate = nextBillingDate
        ? formatDateEsMx(nextBillingDate)
        : `en ${billingDays} dias`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cobro procesado</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        ${renderBrandHeader({ subtitle: 'Cobro de suscripcion procesado' })}

        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hola, <strong>${firstName}</strong></p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
              Ya se proceso el cobro automatico de tu suscripcion a
              <strong style="color:#111827;">${productName}</strong>.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">Producto</td>
                      <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${productName}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">Monto cobrado</td>
                      <td style="padding:6px 0;color:#C41E3A;font-size:16px;font-weight:700;text-align:right;">${formatMXN(amount)}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">Proximo cobro</td>
                      <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${formattedDate}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${renderBrandFooter({ note: 'Recibiras guia de envio cuando el paquete salga.' })}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
