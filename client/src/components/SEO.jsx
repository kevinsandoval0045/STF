import { Helmet } from 'react-helmet-async';

/**
 * SEO Component — injects <title>, <meta>, Open Graph, and JSON-LD
 * into the document <head> via react-helmet-async.
 *
 * @param {string}  title        — Page title (appended with site name)
 * @param {string}  description  — Meta description
 * @param {string}  canonical    — Canonical URL (optional)
 * @param {string}  ogImage      — Open Graph image URL (optional)
 * @param {object}  jsonLd       — JSON-LD structured data object (optional)
 * @param {boolean} noIndex      — If true, tells search engines not to index
 */
export default function SEO({
    title = 'SupplementsStore',
    description = 'Suplementos premium para tus metas de salud y fitness. Proteínas, creatina, vitaminas y más de marcas confiables.',
    canonical,
    ogImage,
    jsonLd,
    noIndex = false,
}) {
    const siteName = 'SupplementsStore';
    const fullTitle = title === siteName ? title : `${title} | ${siteName}`;

    return (
        <Helmet>
            {/* Basic */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {noIndex && <meta name="robots" content="noindex, nofollow" />}
            {canonical && <link rel="canonical" href={canonical} />}

            {/* Open Graph */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:site_name" content={siteName} />
            {ogImage && <meta property="og:image" content={ogImage} />}
            {canonical && <meta property="og:url" content={canonical} />}

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            {ogImage && <meta name="twitter:image" content={ogImage} />}

            {/* JSON-LD Structured Data */}
            {jsonLd && (
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            )}
        </Helmet>
    );
}
