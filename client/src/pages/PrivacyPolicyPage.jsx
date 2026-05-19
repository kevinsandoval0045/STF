import SEO from '../components/SEO.jsx';

/**
 * PrivacyPolicyPage — Aviso de Privacidad conforme a la LFPDPPP (México).
 * Última actualización: Mayo 2026.
 *
 * Placeholders marcados con TODO para reemplazar antes de producción:
 *   - Dirección fiscal de la empresa
 *   - Email de contacto real
 *   - Teléfono real
 */
export default function PrivacyPolicyPage() {
    return (
        <>
            <SEO
                title="Aviso de Privacidad"
                description="Conoce cómo recopilamos, usamos y protegemos tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares."
            />

            <div className="container-main py-12 max-w-3xl">
                <h1 className="text-3xl font-bold text-kas-text mb-2">Aviso de Privacidad</h1>
                <p className="text-sm text-gray-400 mb-8">Última actualización: Mayo de 2026</p>

                <div className="prose prose-sm max-w-none text-gray-600 space-y-8">

                    {/* 1. Responsable */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">
                            1. Responsable del tratamiento de sus datos personales
                        </h2>
                        <p>
                            <strong>la Empresa</strong> (en adelante "la Empresa", "nosotros" o "la Empresa"),
                            con domicilio en México, es responsable del tratamiento de sus datos personales
                            de conformidad con lo establecido en la{' '}
                            <em>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</em>{' '}
                            (LFPDPPP) y su Reglamento.
                        </p>
                        <p className="mt-2">
                            Para cualquier consulta relacionada con este Aviso de Privacidad puede contactarnos en:
                        </p>
                        <ul className="list-none mt-2 space-y-1">
                            {/* TODO: Reemplazar con correo real */}
                            <li>📧 <strong>Correo electrónico:</strong> privacidad@kassupplements.com</li>
                            {/* TODO: Reemplazar con teléfono real */}
                            <li>📞 <strong>Teléfono:</strong> (contacto disponible próximamente)</li>
                        </ul>
                    </section>

                    {/* 2. Datos personales */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">
                            2. Datos personales que recabamos
                        </h2>
                        <p>Para llevar a cabo las finalidades descritas en este Aviso, recabamos las siguientes categorías de datos personales:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li><strong>Identificación:</strong> nombre, apellidos.</li>
                            <li><strong>Contacto:</strong> correo electrónico, número de teléfono.</li>
                            <li><strong>Domicilio:</strong> dirección de entrega, ciudad, estado y código postal.</li>
                            <li><strong>Financieros:</strong> información de pago procesada de forma segura a través de Mercado Pago; la Empresa <strong>no almacena</strong> datos de tarjeta bancaria.</li>
                            <li><strong>Navegación:</strong> dirección IP, tipo de navegador y páginas visitadas (de forma anónima y agregada, con fines estadísticos).</li>
                        </ul>
                        <p className="mt-2">
                            No recabamos datos personales sensibles (datos de salud, biométricos, etc.).
                        </p>
                    </section>

                    {/* 3. Finalidades */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">
                            3. Finalidades del tratamiento
                        </h2>
                        <p><strong>Finalidades primarias</strong> (necesarias para la relación comercial):</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Crear y gestionar su cuenta de usuario.</li>
                            <li>Procesar y entregar sus pedidos de productos.</li>
                            <li>Gestionar suscripciones recurrentes de productos.</li>
                            <li>Enviar confirmaciones, actualizaciones de pedido y notificaciones de entrega.</li>
                            <li>Atender solicitudes, quejas y devoluciones.</li>
                            <li>Cumplir obligaciones fiscales y legales aplicables en México.</li>
                        </ul>
                        <p className="mt-3"><strong>Finalidades secundarias</strong> (puede negarse sin afectar la relación comercial):</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Enviarle información sobre promociones, nuevos productos y ofertas exclusivas.</li>
                            <li>Realizar encuestas de satisfacción.</li>
                            <li>Análisis estadístico interno del comportamiento de compra.</li>
                        </ul>
                        <p className="mt-2 text-sm text-gray-500">
                            Si no desea que sus datos sean utilizados para las finalidades secundarias, puede
                            enviar un correo a{' '}
                            {/* TODO: Reemplazar con correo real */}
                            <strong>privacidad@kassupplements.com</strong> con el asunto "Oposición a finalidades secundarias".
                        </p>
                    </section>

                    {/* 4. Derechos ARCO */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">
                            4. Derechos ARCO
                        </h2>
                        <p>
                            Usted tiene derecho a <strong>Acceder</strong>, <strong>Rectificar</strong>,{' '}
                            <strong>Cancelar</strong> y <strong>Oponerse</strong> al tratamiento de sus datos
                            personales (Derechos ARCO), así como a la portabilidad y limitación de su uso.
                        </p>
                        <p className="mt-2">
                            Para ejercer estos derechos, envíe su solicitud a{' '}
                            {/* TODO: Reemplazar con correo real */}
                            <strong>privacidad@kassupplements.com</strong> con:
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Nombre completo y correo electrónico registrado.</li>
                            <li>Descripción clara del derecho que desea ejercer.</li>
                            <li>Documentación que acredite su identidad (INE/IFE o equivalente).</li>
                        </ul>
                        <p className="mt-2">
                            Daremos respuesta a su solicitud en un plazo máximo de <strong>20 días hábiles</strong>,
                            conforme a lo establecido en la LFPDPPP.
                        </p>
                    </section>

                    {/* 5. Transferencia */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">
                            5. Transferencia de datos personales
                        </h2>
                        <p>
                            La Empresa podrá compartir sus datos con los siguientes terceros,
                            únicamente para las finalidades indicadas:
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>
                                <strong>Mercado Pago</strong> — procesamiento de pagos y suscripciones recurrentes,
                                sujeto a su propia política de privacidad.
                            </li>
                            <li>
                                <strong>Empresas de mensajería y paquetería</strong> — para la entrega física de pedidos.
                            </li>
                            <li>
                                <strong>Autoridades fiscales y judiciales</strong> — cuando sea requerido por ley.
                            </li>
                        </ul>
                        <p className="mt-2">
                            No vendemos, alquilamos ni cedemos sus datos personales a terceros con fines comerciales propios.
                        </p>
                    </section>

                    {/* 6. Seguridad */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">
                            6. Medidas de seguridad
                        </h2>
                        <p>
                            Implementamos medidas técnicas y organizativas para proteger sus datos personales contra
                            acceso no autorizado, pérdida, alteración o divulgación, incluyendo:
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Transmisión de datos cifrada mediante HTTPS/TLS.</li>
                            <li>Almacenamiento de contraseñas con hashing seguro (bcrypt).</li>
                            <li>Autenticación mediante tokens JWT con expiración definida.</li>
                            <li>Acceso restringido a datos personales solo al personal autorizado.</li>
                        </ul>
                    </section>

                    {/* 7. Cookies */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">
                            7. Uso de cookies y tecnologías similares
                        </h2>
                        <p>
                            Nuestro sitio web utiliza cookies y almacenamiento local del navegador
                            (<em>localStorage</em>) para mantener su sesión activa y mejorar la experiencia
                            de navegación. Estas tecnologías no recaban datos sensibles y puede desactivarlas
                            desde la configuración de su navegador, aunque esto podría afectar el funcionamiento
                            de algunas funciones del sitio.
                        </p>
                    </section>

                    {/* 8. Cambios */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">
                            8. Cambios al Aviso de Privacidad
                        </h2>
                        <p>
                            Nos reservamos el derecho de modificar este Aviso de Privacidad en cualquier momento.
                            Los cambios serán notificados a través de nuestro sitio web con al menos{' '}
                            <strong>15 días naturales</strong> de anticipación antes de entrar en vigor.
                            El uso continuado del sitio web después de dicha notificación constituye su
                            aceptación de los cambios.
                        </p>
                    </section>

                    {/* 9. Autoridad */}
                    <section>
                        <h2 className="text-lg font-semibold text-kas-text mb-3">
                            9. Autoridad competente
                        </h2>
                        <p>
                            Si considera que su derecho a la protección de datos personales ha sido vulnerado,
                            puede presentar una queja ante el{' '}
                            <strong>Instituto Nacional de Transparencia, Acceso a la Información y Protección
                            de Datos Personales (INAI)</strong> en{' '}
                            <a
                                href="https://www.inai.org.mx"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-kas-text underline hover:text-kas-secondary"
                            >
                                www.inai.org.mx
                            </a>
                            .
                        </p>
                    </section>

                </div>
            </div>
        </>
    );
}
