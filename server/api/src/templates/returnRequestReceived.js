/**
 * Template: Return Request Received
 * Sent when a customer submits a return/refund request.
 */

const typeLabels = {
    DEFECTIVE_PRODUCT: 'Producto defectuoso',
    CHANGE_OF_MIND:    'Cambio de opinión',
    WRONG_PRODUCT:     'Producto equivocado',
    OTHER:             'Otro motivo',
};

export function returnRequestReceivedTemplate({ firstName, orderNumber, returnType, description }) {
    const label = typeLabels[returnType] || returnType;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Solicitud de devolución recibida</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1f2937;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Tienda de Suplementos</h1>
            <p style="margin:8px 0 0;color:#9ca3af;font-size:14px;">Solicitud de devolución recibida 📋</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hola, <strong>${firstName}</strong></p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
              Hemos recibido tu solicitud de devolución para el pedido
              <strong style="color:#111827;">${orderNumber}</strong>. Nuestro equipo la revisará en un plazo
              de <strong>1 a 3 días hábiles</strong> y nos pondremos en contacto contigo.
            </p>

            <!-- Info card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">🧾 Pedido</td>
                      <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${orderNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">📌 Motivo</td>
                      <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${label}</td>
                    </tr>
                  </table>
                  <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;">
                    <p style="margin:0 0 6px;color:#6b7280;font-size:13px;font-weight:500;">Tu descripción:</p>
                    <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;font-style:italic;">"${description}"</p>
                  </div>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              Si tienes alguna pregunta adicional, responde a este correo y con gusto te atendemos.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              © 2025 Todos los derechos reservados
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
