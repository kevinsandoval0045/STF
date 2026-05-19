import SEO from '../components/SEO.jsx';

/**
 * TermsPage — Términos y Condiciones de uso de KAS Supplements.
 * Conforme a PROFECO y legislación de comercio electrónico en México.
 * Última actualización: Mayo 2026.
 */
export default function TermsPage() {
    return (
        <>
            <SEO
                title="Términos y Condiciones"
                description="Lee los Términos y Condiciones de uso de KAS Supplements, incluyendo políticas de compra, envío, devoluciones y suscripciones recurrentes."
            />

            <div className="container-main py-12 max-w-3xl">
                <h1 className="text-3xl font-bold text-kas-text mb-2">Términos y Condiciones</h1>
                <p className="text-sm text-gray-400 mb-8">Última actualización: Mayo de 2026</p>

                <div className="prose prose-sm max-w-none text-gray-600 space-y-8">

                    {/* 1. Aceptación */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">1. Aceptación de los Términos</h2>
                        <p>
                            Al acceder y utilizar el sitio web de <strong>KAS Supplements</strong> (en adelante
                            "el Sitio"), así como al realizar cualquier compra o suscripción a través de él,
                            usted acepta de forma expresa y vinculante los presentes Términos y Condiciones,
                            así como nuestro{' '}
                            <a href="/privacidad" className="text-kas-text underline hover:text-kas-secondary">Aviso de Privacidad</a>.
                        </p>
                        <p className="mt-2">
                            Si no está de acuerdo con alguno de estos términos, le pedimos que se abstenga
                            de utilizar nuestros servicios.
                        </p>
                    </section>

                    {/* 2. Productos y precios */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">2. Productos y Precios</h2>
                        <ul className="list-disc list-inside space-y-1">
                            <li>
                                Todos los precios se expresan en <strong>Pesos Mexicanos (MXN)</strong> e incluyen
                                el Impuesto al Valor Agregado (IVA) cuando corresponda.
                            </li>
                            <li>
                                KAS Supplements se reserva el derecho de modificar los precios en cualquier
                                momento sin previo aviso. El precio aplicable a su compra es el vigente al
                                momento de confirmar el pago.
                            </li>
                            <li>
                                Las imágenes de los productos son referenciales. Pueden existir variaciones
                                menores en empaques o presentaciones sin que esto implique un defecto del producto.
                            </li>
                            <li>
                                La disponibilidad de productos está sujeta al stock existente. En caso de
                                que un producto no esté disponible después de realizar su pago, le
                                notificaremos de inmediato y procederemos al reembolso íntegro.
                            </li>
                        </ul>
                    </section>

                    {/* 3. Proceso de compra */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">3. Proceso de Compra y Pago</h2>
                        <p>El proceso de compra en KAS Supplements sigue los siguientes pasos:</p>
                        <ol className="list-decimal list-inside mt-2 space-y-1">
                            <li>Selección de productos y adición al carrito.</li>
                            <li>Ingreso de datos de envío y contacto.</li>
                            <li>Selección del método de pago y confirmación.</li>
                            <li>Recepción de correo electrónico de confirmación con número de pedido.</li>
                        </ol>
                        <p className="mt-3">
                            El pago se procesa de forma segura a través de <strong>Mercado Pago</strong>.
                            KAS Supplements no almacena datos de tarjetas bancarias. Al completar el pago,
                            usted acepta los términos del procesador de pago correspondiente.
                        </p>
                        <p className="mt-2">
                            Un pedido se considera confirmado únicamente cuando reciba el correo electrónico
                            de confirmación. KAS Supplements se reserva el derecho de cancelar pedidos en
                            caso de errores de precio, fraude detectado o falta de stock.
                        </p>
                    </section>

                    {/* 4. Envíos */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">4. Envíos y Entregas</h2>
                        <ul className="list-disc list-inside space-y-1">
                            <li>
                                Realizamos envíos dentro de la <strong>República Mexicana</strong>.
                            </li>
                            <li>
                                El costo de envío se calcula en función del peso del pedido y se muestra
                                claramente antes de confirmar el pago. Los pedidos que superen el monto
                                establecido como umbral pueden calificar para <strong>envío gratuito</strong>.
                            </li>
                            <li>
                                Los tiempos de entrega estimados son de <strong>3 a 7 días hábiles</strong>
                                una vez confirmado el pago, pudiendo variar según la ubicación geográfica
                                y la paquetería seleccionada.
                            </li>
                            <li>
                                KAS Supplements no se hace responsable por retrasos ocasionados por la
                                empresa de paquetería, causas de fuerza mayor o datos de envío incorrectos
                                proporcionados por el cliente.
                            </li>
                            <li>
                                Una vez despachado su pedido, recibirá un correo con el número de rastreo
                                para seguimiento en tiempo real.
                            </li>
                        </ul>
                    </section>

                    {/* 5. Devoluciones y garantías */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">
                            5. Política de Devoluciones y Garantías
                        </h2>
                        <p>
                            Conforme a lo establecido en la <em>Ley Federal de Protección al Consumidor</em>{' '}
                            (LFPC) y las disposiciones de la PROFECO:
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>
                                Aceptamos devoluciones dentro de los <strong>30 días naturales</strong>{' '}
                                siguientes a la recepción del pedido, siempre que el producto esté sin abrir,
                                en su empaque original y en condiciones de venta.
                            </li>
                            <li>
                                En caso de producto defectuoso, dañado en tránsito o equivocado, cubrimos
                                el costo de devolución y reposición o reembolso íntegro, a elección del cliente.
                            </li>
                            <li>
                                Para iniciar una devolución, acceda a su pedido en la sección{' '}
                                "Rastrear pedido" y seleccione la opción de devolución, o contáctenos en{' '}
                                {/* TODO: Reemplazar con correo real */}
                                <strong>contacto@kassupplements.com</strong>.
                            </li>
                            <li>
                                Los reembolsos se procesan en el mismo método de pago original en un plazo
                                de <strong>5 a 10 días hábiles</strong> tras aprobar la devolución.
                            </li>
                        </ul>
                        <p className="mt-2 text-sm text-gray-500">
                            Por razones de higiene y seguridad alimentaria, no se aceptan devoluciones de
                            productos abiertos o parcialmente consumidos, salvo en caso de defecto comprobado.
                        </p>
                    </section>

                    {/* 6. Suscripciones */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">
                            6. Suscripciones Recurrentes
                        </h2>
                        <p>
                            KAS Supplements ofrece un servicio de suscripción recurrente que permite recibir
                            sus productos favoritos de forma automática y periódica.
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>
                                Al suscribirse, autoriza a Mercado Pago a realizar cargos recurrentes
                                a su método de pago por el monto y periodicidad indicados en el momento
                                de la contratación.
                            </li>
                            <li>
                                La frecuencia de cobro se calcula en función de las porciones del producto
                                (porciones del envase menos 3 días) para garantizar que nunca le falte stock.
                            </li>
                            <li>
                                Puede <strong>cancelar su suscripción en cualquier momento</strong> desde
                                la sección "Mis Suscripciones" en su cuenta, sin penalización ni cargos
                                adicionales. La cancelación aplica a partir del siguiente ciclo de facturación.
                            </li>
                            <li>
                                A partir de la segunda suscripción activa al mismo producto, se aplica
                                automáticamente un <strong>descuento del 5%</strong> como beneficio de lealtad.
                            </li>
                            <li>
                                KAS Supplements se reserva el derecho de modificar los precios de
                                suscripción con un aviso previo de <strong>15 días naturales</strong>
                                por correo electrónico.
                            </li>
                        </ul>
                    </section>

                    {/* 7. Cuenta de usuario */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">7. Cuenta de Usuario</h2>
                        <ul className="list-disc list-inside space-y-1">
                            <li>
                                Para realizar compras es necesario crear una cuenta con información
                                veraz y actualizada.
                            </li>
                            <li>
                                Usted es responsable de mantener la confidencialidad de su contraseña
                                y de todas las actividades realizadas desde su cuenta.
                            </li>
                            <li>
                                KAS Supplements se reserva el derecho de suspender o cancelar cuentas que
                                incurran en uso fraudulento, abusivo o contrario a estos Términos.
                            </li>
                        </ul>
                    </section>

                    {/* 8. Propiedad intelectual */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">8. Propiedad Intelectual</h2>
                        <p>
                            Todos los contenidos del Sitio — incluyendo textos, imágenes, logotipos,
                            diseños, código fuente y elementos gráficos — son propiedad de KAS Supplements
                            o de sus respectivos titulares, y están protegidos por las leyes mexicanas e
                            internacionales de propiedad intelectual.
                        </p>
                        <p className="mt-2">
                            Queda prohibida la reproducción, distribución, modificación o uso comercial
                            de cualquier contenido del Sitio sin autorización expresa y por escrito de
                            KAS Supplements.
                        </p>
                    </section>

                    {/* 9. Limitación de responsabilidad */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">
                            9. Limitación de Responsabilidad
                        </h2>
                        <p>
                            KAS Supplements no será responsable por daños directos, indirectos, incidentales
                            o consecuentes derivados del uso o imposibilidad de uso del Sitio, siempre que
                            dichos daños no sean atribuibles a dolo o negligencia grave de nuestra parte.
                        </p>
                        <p className="mt-2">
                            Los suplementos alimenticios no sustituyen una dieta equilibrada ni el tratamiento
                            médico profesional. KAS Supplements no asume responsabilidad por el uso inadecuado
                            de los productos adquiridos.
                        </p>
                    </section>

                    {/* 10. Ley aplicable */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">
                            10. Ley Aplicable y Jurisdicción
                        </h2>
                        <p>
                            Los presentes Términos y Condiciones se rigen por las leyes vigentes en los
                            <strong> Estados Unidos Mexicanos</strong>, en particular por el{' '}
                            <em>Código de Comercio</em>, la{' '}
                            <em>Ley Federal de Protección al Consumidor (LFPC)</em> y las disposiciones
                            de la <em>PROFECO</em>.
                        </p>
                        <p className="mt-2">
                            Para cualquier controversia derivada de estos Términos, las partes se someten
                            a la jurisdicción de los tribunales competentes en el domicilio de KAS Supplements,
                            renunciando a cualquier otro fuero que pudiera corresponderles.
                        </p>
                        <p className="mt-2">
                            Si tiene una queja como consumidor, también puede acudir a la{' '}
                            <strong>PROFECO</strong> en{' '}
                            <a
                                href="https://www.profeco.gob.mx"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-kas-text underline hover:text-kas-secondary"
                            >
                                www.profeco.gob.mx
                            </a>
                            .
                        </p>
                    </section>

                    {/* 11. Contacto */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">11. Contacto</h2>
                        <p>
                            Para cualquier duda, aclaración o queja relacionada con estos Términos y Condiciones,
                            puede contactarnos en:
                        </p>
                        <ul className="list-none mt-2 space-y-1">
                            {/* TODO: Reemplazar con correo real */}
                            <li>📧 <strong>Correo electrónico:</strong> contacto@kassupplements.com</li>
                        </ul>
                    </section>

                </div>
            </div>
        </>
    );
}
