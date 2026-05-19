/**
 * Template: Subscription Charged (recurring payment processed)
 * Sent each time Mercado Pago successfully charges a recurring payment.
 */
export function subscriptionChargedTemplate({ firstName, productName, amount, nextBillingDate, billingDays }) {
    const formattedAmount = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    const formattedDate = nextBillingDate
        ? new Date(nextBillingDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
        : `en ${billingDays} días`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cobro procesado — KAS Supplements</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#C41E3A;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">KAS Supplements</h1>
            <p style="margin:8px 0 0;color:#fca5a5;font-size:14px;">Cobro de suscripción procesado 💳</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hola, <strong>${firstName}</strong> 👋</p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
              Se ha procesado exitosamente el cobro automático de tu suscripción a
              <strong style="color:#111827;">${productName}</strong>. Tu pedido está siendo preparado.
            </p>

            <!-- Info card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">📦 Producto</td>
                      <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${productName}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">💳 Monto cobrado</td>
                      <td style="padding:6px 0;color:#C41E3A;font-size:16px;font-weight:700;text-align:right;">${formattedAmount}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">🔔 Próximo cobro</td>
                      <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${formattedDate}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              Recibirás un correo adicional con tu número de guía una vez que tu paquete sea enviado.
              Puedes administrar tu suscripción desde tu perfil en el sitio web.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              © 2025 KAS Supplements · Todos los derechos reservados
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
