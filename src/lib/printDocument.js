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

    const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(link => `<link rel="stylesheet" href="${link.href}">`)
        .join('\n');

    const inlineStyles = Array.from(document.querySelectorAll('style'))
        .map(style => style.outerHTML)
        .join('\n');

    const popup = window.open('', `_print_${Date.now()}`, 'width=1100,height=850');
    if (!popup) {
        alert('Please allow popups for this site to print documents.');
        return;
    }

    popup.document.write(`<!DOCTYPE html>
<html lang="mr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${filename}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    ${styleLinks}
    ${inlineStyles}
    <style>
        /* ── Modern Premium Print System ──────────────────────────── */
        
        @page {
            size: ${size} ${orientation};
            margin: 12mm 10mm 12mm 10mm;
        }

        :root {
            --print-primary: #0f172a;
            --print-slate-600: #475569;
            --print-slate-200: #e2e8f0;
            --print-slate-50: #f8fafc;
        }

        /* ── Base Reset ────────────────────────────────────────────── */
        *, *::before, *::after {
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
            font-family: 'Inter', 'Noto Sans Devanagari', sans-serif;
            -webkit-font-smoothing: antialiased;
        }

        body {
            padding: 0;
        }

        .no-print { display: none !important; }

        /* ── Typography & Consistency ──────────────────────────────── */
        h1, h2, h3, h4, .font-bold { font-weight: 700 !important; }
        .text-xs { font-size: 7.5pt !important; line-height: 1.2 !important; }
        .text-sm { font-size: 9pt !important; line-height: 1.3 !important; }
        .font-mono { font-family: 'JetBrains Mono', 'Courier New', monospace !important; }

        /* ── High-Density Table Logic ─────────────────────────────── */
        table { 
            width: 99.8% !important; 
            max-width: 99.8% !important;
            border-collapse: collapse !important; 
            table-layout: auto !important;
            margin-bottom: 5mm;
            border: 1pt solid #000 !important;
            margin-left: auto;
            margin-right: auto;
        }

        th {
            background-color: var(--print-slate-50) !important;
            color: #000 !important;
            font-weight: 700 !important;
            border: 1pt solid #000 !important;
            padding: 2.5mm 1.5mm !important;
            text-transform: uppercase;
            letter-spacing: 0.025em;
        }

        td { 
            border: 0.5pt solid #000 !important;
            padding: 1.8mm 1.5mm !important;
            vertical-align: middle;
            word-wrap: break-word !important; 
        }

        tr:nth-child(even) {
            background-color: rgba(248, 250, 252, 0.5) !important;
        }

        /* Essential for multi-page tables */
        thead { display: table-header-group !important; }
        tfoot { display: table-row-group !important; }
        tr    { break-inside: avoid !important; }

        /* Ensure tables don't try to force themselves onto a new page */
        table { 
            break-inside: auto !important;
        }

        /* ── Page Break Utilities ────────────────────────────────── */
        .page-break-before { break-before: page !important; }
        .page-break-after { break-after: page !important; }
        .break-inside-avoid { break-inside: avoid !important; }
        
        /* ── Premium Elements ────────────────────────────────────── */
        .print-only-shadow { 
            border: 1pt solid var(--print-slate-200) !important;
        }
        
        /* Hide scrollbars just in case */
        ::-webkit-scrollbar { display: none; }

        /* Forced reset for Tailwind shadows and rounding */
        [class*="shadow"]  { box-shadow: none !important; }
        [class*="rounded"] { border-radius: 0 !important; }
        
        .print-content {
            width: 100% !important;
            overflow-x: visible !important;
        }

        /* Special case for 30+ entries: relaxed but efficient padding */
        .dense-table td {
            padding: 2.2mm 2mm !important;
            font-size: 8.5pt !important;
        }
        .dense-table th {
            padding: 3mm 2mm !important;
        }
    </style>
</head>
<body>
    <div class="print-content">
        ${html}
    </div>
</body>
</html>`);

    popup.document.close();
    popup.focus();

    // Wait for fonts and styles to settle
    await new Promise(resolve => setTimeout(resolve, 1500));

    popup.print();

    popup.addEventListener('afterprint', () => popup.close());
    setTimeout(() => { try { popup.close(); } catch (_) {} }, 60_000);
}

