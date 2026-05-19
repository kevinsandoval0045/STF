import PDFDocument from 'pdfkit';

/**
 * PDF Service — generates order receipt PDFs using PDFKit.
 *
 * Design: clean, minimal receipt in Spanish.
 * Does NOT generate CFDI — this is an informal proof of purchase.
 *
 * Usage:
 *   const pdfBuffer = await pdfService.generateOrderReceipt(order);
 *   res.set({ 'Content-Type': 'application/pdf', ... });
 *   res.send(pdfBuffer);
 */
export class PdfService {
    /**
     * Generate a PDF receipt for an order.
     *
     * @param {Object} order - Order object from orderService.trackOrder()
     *   { orderNumber, status, totalAmount, shippingCost,
     *     items: [{productName, quantity, unitPrice}],
     *     customerInfo: { firstName, lastName, email, address, city, state, zipCode } }
     * @returns {Promise<Buffer>}
     */
    generateOrderReceipt(order) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50,
                    info: {
                        Title: `Comprobante de Pedido ${order.orderNumber}`,
                        Author: 'KAS Supplements',
                    },
                });

                const chunks = [];
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // ─── Color palette ─────────────────────────────────
                const RED    = '#D10A11';
                const DARK   = '#111111';
                const GRAY   = '#555555';
                const LIGHT  = '#F5F5F5';
                const BORDER = '#E5E5E5';

                const W = doc.page.width - 100; // usable width (margins=50 each side)

                // ─── HEADER ────────────────────────────────────────
                // Red top bar
                doc.rect(0, 0, doc.page.width, 6).fill(RED);

                // Company name
                doc.moveDown(1.2);
                doc
                    .fontSize(22)
                    .fillColor(RED)
                    .font('Helvetica-Bold')
                    .text('KAS Supplements', 50, 30);

                // Tagline
                doc
                    .fontSize(9)
                    .fillColor(GRAY)
                    .font('Helvetica')
                    .text('Suplementos premium para tus metas de salud y fitness.', 50, 58);

                // Right side: document title
                doc
                    .fontSize(18)
                    .fillColor(DARK)
                    .font('Helvetica-Bold')
                    .text('COMPROBANTE DE PAGO', 50, 30, { align: 'right', width: W });

                doc
                    .fontSize(9)
                    .fillColor(GRAY)
                    .font('Helvetica')
                    .text(`Documento no válido como CFDI`, 50, 58, { align: 'right', width: W });

                // Divider
                doc.moveTo(50, 82).lineTo(50 + W, 82).strokeColor(BORDER).lineWidth(1).stroke();

                // ─── ORDER META ────────────────────────────────────
                const metaY = 95;
                const STATUS_LABELS = {
                    PENDING:    'Pendiente',
                    PROCESSING: 'En proceso',
                    SHIPPED:    'Enviado',
                    DELIVERED:  'Entregado',
                    COMPLETED:  'Completado',
                    CANCELLED:  'Cancelado',
                };

                this.#labelValue(doc, 'Número de pedido', order.orderNumber, 50, metaY, DARK, GRAY);
                this.#labelValue(doc, 'Estado', STATUS_LABELS[order.status] || order.status, 50, metaY + 30, DARK, GRAY);
                this.#labelValue(doc, 'Fecha de emisión', this.#formatDate(new Date()), 300, metaY, DARK, GRAY);

                // ─── CUSTOMER INFO ─────────────────────────────────
                const custY = metaY + 75;
                doc
                    .fontSize(9)
                    .fillColor(GRAY)
                    .font('Helvetica-Bold')
                    .text('DATOS DEL CLIENTE', 50, custY);

                doc.rect(50, custY + 14, W, 60).fillColor(LIGHT).fill();

                const ci = order.customerInfo || {};
                const fullName = [ci.firstName, ci.lastName].filter(Boolean).join(' ') || '—';
                const addressLine = [ci.address, ci.city, ci.state, ci.zipCode].filter(Boolean).join(', ') || '—';

                doc
                    .fontSize(9)
                    .fillColor(DARK)
                    .font('Helvetica-Bold')
                    .text(fullName, 60, custY + 22);
                doc
                    .font('Helvetica')
                    .fillColor(GRAY)
                    .text(ci.email || '—', 60, custY + 36)
                    .text(addressLine, 60, custY + 48);

                // ─── ITEMS TABLE ───────────────────────────────────
                const tableY = custY + 95;
                doc
                    .fontSize(9)
                    .fillColor(GRAY)
                    .font('Helvetica-Bold')
                    .text('DETALLE DE PRODUCTOS', 50, tableY);

                // Table header
                const headerY = tableY + 14;
                doc.rect(50, headerY, W, 20).fillColor(DARK).fill();
                doc
                    .fontSize(8.5)
                    .fillColor('#FFFFFF')
                    .font('Helvetica-Bold')
                    .text('PRODUCTO', 58, headerY + 6)
                    .text('CANT.', 340, headerY + 6, { width: 50, align: 'center' })
                    .text('PRECIO UNIT.', 390, headerY + 6, { width: 80, align: 'right' })
                    .text('SUBTOTAL', 470, headerY + 6, { width: W - 420, align: 'right' });

                // Table rows
                let rowY = headerY + 20;
                (order.items || []).forEach((item, i) => {
                    const bg = i % 2 === 0 ? '#FFFFFF' : LIGHT;
                    doc.rect(50, rowY, W, 20).fillColor(bg).fill();

                    const lineTotal = Number(item.unitPrice) * Number(item.quantity);

                    doc
                        .fontSize(8.5)
                        .fillColor(DARK)
                        .font('Helvetica')
                        .text(item.productName || '—', 58, rowY + 6, { width: 280, ellipsis: true })
                        .text(String(item.quantity), 340, rowY + 6, { width: 50, align: 'center' })
                        .text(this.#formatPrice(item.unitPrice), 390, rowY + 6, { width: 80, align: 'right' })
                        .text(this.#formatPrice(lineTotal), 470, rowY + 6, { width: W - 420, align: 'right' });

                    rowY += 20;
                });

                // Bottom border of table
                doc.moveTo(50, rowY).lineTo(50 + W, rowY).strokeColor(BORDER).lineWidth(0.5).stroke();

                // ─── TOTALS ────────────────────────────────────────
                const totY = rowY + 15;
                const subtotal = (order.items || []).reduce(
                    (acc, it) => acc + Number(it.unitPrice) * Number(it.quantity),
                    0
                );

                this.#totalRow(doc, 'Subtotal', subtotal, totY, DARK, GRAY, W);
                this.#totalRow(
                    doc,
                    'Envío',
                    Number(order.shippingCost) === 0 ? 'Gratis' : order.shippingCost,
                    totY + 18,
                    DARK, GRAY, W
                );

                // Total highlighted
                doc.rect(50, totY + 38, W, 24).fillColor(RED).fill();
                doc
                    .fontSize(10)
                    .fillColor('#FFFFFF')
                    .font('Helvetica-Bold')
                    .text('TOTAL', 58, totY + 44)
                    .text(this.#formatPrice(order.totalAmount), 58, totY + 44, { align: 'right', width: W - 8 });

                // ─── FOOTER ────────────────────────────────────────
                const footY = doc.page.height - 80;
                doc.moveTo(50, footY).lineTo(50 + W, footY).strokeColor(BORDER).lineWidth(0.5).stroke();
                doc
                    .fontSize(7.5)
                    .fillColor(GRAY)
                    .font('Helvetica')
                    .text(
                        'Este documento es un comprobante informativo de compra y no tiene validez fiscal como CFDI ante el SAT.',
                        50, footY + 10, { width: W, align: 'center' }
                    )
                    .text(
                        'KAS Supplements · contacto@kassupplements.com · kassupplements.com',
                        50, footY + 24, { width: W, align: 'center' }
                    );

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    // ─── Private helpers ─────────────────────────────────

    #labelValue(doc, label, value, x, y, darkColor, grayColor) {
        doc.fontSize(8).fillColor(grayColor).font('Helvetica').text(label, x, y);
        doc.fontSize(10).fillColor(darkColor).font('Helvetica-Bold').text(value, x, y + 12);
    }

    #totalRow(doc, label, value, y, darkColor, grayColor, W) {
        doc
            .fontSize(9)
            .fillColor(grayColor)
            .font('Helvetica')
            .text(label, 50, y)
            .fillColor(darkColor)
            .font('Helvetica-Bold')
            .text(
                typeof value === 'number' ? this.#formatPrice(value) : value,
                50, y, { align: 'right', width: W }
            );
    }

    #formatPrice(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(Number(amount) || 0);
    }

    #formatDate(date) {
        return new Intl.DateTimeFormat('es-MX', {
            year: 'numeric', month: 'long', day: 'numeric',
        }).format(date);
    }
}
