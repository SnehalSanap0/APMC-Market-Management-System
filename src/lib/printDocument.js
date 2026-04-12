/**
 * printDocument — The industry-standard way to print from a React SPA.
 *
 * Used by Tally, Zoho Books, QuickBooks Web, SAP Fiori, etc.
 * Opens a clean popup window with ONLY the print content + a copy of all
 * page stylesheets. Completely bypasses SPA layout constraints
 * (overflow-hidden, h-screen, flex containers, etc.).
 *
 * @param {HTMLElement} element     - The DOM element whose innerHTML to print
 * @param {string}      filename    - Suggested PDF filename (no extension)
 * @param {object}      [options]
 * @param {'portrait'|'landscape'} [options.orientation='portrait']
 * @param {string}      [options.size='A4']
 */
export async function printDocument(element, filename, options = {}) {
    const { orientation = 'portrait', size = 'A4' } = options;

    if (!element) {
        console.warn('printDocument: no element provided');
        return;
    }

    const html = element.innerHTML;

    /* ------------------------------------------------------------------
     * 1. Copy all stylesheets from the live page into the popup so that
     *    ALL Tailwind classes (including print: variants) work correctly.
     * ------------------------------------------------------------------ */
    const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(link => `<link rel="stylesheet" href="${link.href}">`)
        .join('\n');

    const inlineStyles = Array.from(document.querySelectorAll('style'))
        .map(style => style.outerHTML)
        .join('\n');

    /* ------------------------------------------------------------------
     * 2. Open a clean popup window (same origin — can load all assets).
     * ------------------------------------------------------------------ */
    const popup = window.open('', `_print_${Date.now()}`, 'width=1000,height=800');
    if (!popup) {
        alert('Please allow popups for this site to print documents.');
        return;
    }

    /* ------------------------------------------------------------------
     * 3. Write a complete, standalone HTML document into the popup.
     *    - @page sets paper size, orientation, and margins
     *    - @top-center / @bottom-center add the separator lines the user
     *      requested at the boundary of the browser's default header/footer
     *    - All Tailwind print: variants work because the stylesheets are
     *      cloned from the live page
     * ------------------------------------------------------------------ */
    popup.document.write(`<!DOCTYPE html>
<html lang="mr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${filename}</title>
    ${styleLinks}
    ${inlineStyles}
    <style>
        /* ── Page Setup ─────────────────────────────────────────────── */
        @page {
            size: ${size} ${orientation};
            margin: 15mm 12mm 15mm 12mm;
        }

        /* ── Separator Lines (Repeating on every page) ──────────────── */
        .print-header-line {
            position: fixed;
            top: -10mm;
            left: 0;
            right: 0;
            border-bottom: 0.5pt solid #cbd5e1;
            height: 1px;
            z-index: 9999;
        }

        .print-footer-line {
            position: fixed;
            bottom: -10mm;
            left: 0;
            right: 0;
            border-top: 0.5pt solid #cbd5e1;
            height: 1px;
            z-index: 9999;
        }

        /* ── Base Reset ────────────────────────────────────────────── */
        *,
        *::before,
        *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
        }

        html, body {
            background: white !important;
            color: #000 !important;
            overflow: visible !important;
            height: auto !important;
            margin: 0;
            padding: 0;
        }

        body {
            padding-top: 5mm;
            padding-bottom: 5mm;
        }

        .no-print { display: none !important; }

        /* ── Table & Layout Logic ──────────────────────────────────── */
        table { 
            width: 100% !important; 
            border-collapse: collapse !important; 
            table-layout: auto !important;
        }

        th, td { 
            word-wrap: break-word !important; 
            overflow-wrap: break-word !important; 
        }

        /* Essential for multi-page tables */
        thead { display: table-header-group !important; }
        tfoot { display: table-row-group !important; }
        tr    { break-inside: avoid !important; }

        /* Ensure tables don't try to force themselves onto a new page */
        table { 
            break-inside: auto !important;
        }

        [class*="shadow"]  { box-shadow: none !important; }
        [class*="rounded"] { border-radius: 0 !important; }
    </style>
</head>
<body>
    <div class="print-header-line"></div>
    <div class="print-footer-line"></div>
    <div class="print-content">
        ${html}
    </div>
</body>
</html>`);

    popup.document.close();
    popup.focus();

    /* ------------------------------------------------------------------
     * 4. Wait for external stylesheets to fully load before printing.
     *    1 200 ms is enough for local/LAN assets; increase if on slow CDN.
     * ------------------------------------------------------------------ */
    await new Promise(resolve => setTimeout(resolve, 1200));

    popup.print();

    /* Close the popup after the user finishes with the print dialog */
    popup.addEventListener('afterprint', () => popup.close());
    /* Fallback: close after 60 s in case afterprint never fires */
    setTimeout(() => { try { popup.close(); } catch (_) {} }, 60_000);
}
