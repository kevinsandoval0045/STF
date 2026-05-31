import {
    formatDateEsMx,
    formatMXN,
    renderBrandFooter,
    renderBrandHeader,
} from './emailTheme.js';

/**
 * Template: Subscription Billing Reminder
 * Sent before next scheduled recurring charge.
 */
export function subscriptionBillingReminderTemplate({
    firstName,
    productName,
    amount,
    nextBillingDate,
    billingDays,
}) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recordatorio de cobro</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        ${renderBrandHeader({ subtitle: 'Recordatorio de proximo cobro' })}

        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hola, <strong>${firstName}</strong></p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
              Te recordamos que pronto se realizara el proximo cobro de tu suscripcion a
              <strong style="color:#111827;">${productName}</strong>.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">Monto estimado</td>
                      <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:700;text-align:right;">${formatMXN(amount)}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">Fecha prevista</td>
                      <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${formatDateEsMx(nextBillingDate)}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">Frecuencia</td>
                      <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">Cada ${billingDays} dias</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${renderBrandFooter({ note: 'Asegurate de tener fondos suficientes en tu metodo de pago.' })}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
