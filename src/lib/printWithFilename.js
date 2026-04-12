/**
 * printWithFilename(filename, options)
 *
 * Industry-standard print helper used by ERP/accounting applications.
 * - Sets document.title for PDF "Save As" filename suggestion
 * - Injects a temporary <style> tag for @page size (portrait/landscape)
 * - Cleans everything up after the print dialog closes
 *
 * @param {string} filename  - Desired PDF filename (no extension needed)
 * @param {object} [options]
 * @param {'portrait'|'landscape'} [options.orientation='portrait'] - Page orientation
 * @param {string} [options.size='A4'] - Paper size (default A4)
 */
export function printWithFilename(filename, options = {}) {
    const { orientation = 'portrait', size = 'A4' } = options;

    // 1. Set the document title for the "Save as" filename suggestion
    const originalTitle = document.title;
    document.title = filename;

    // 2. Inject a temporary <style> tag to force the correct @page size
    //    This is the only reliable cross-browser way to set print orientation
    //    (CSS @media print inside components cannot override @page rules)
    const styleEl = document.createElement('style');
    styleEl.id = '__print_page_style__';
    styleEl.textContent = `
        @page {
            size: ${size} ${orientation};
            margin: 12mm 10mm 12mm 10mm;
        }
    `;
    document.head.appendChild(styleEl);

    // 3. Restore everything after the print dialog closes
    const restore = () => {
        document.title = originalTitle;
        const injected = document.getElementById('__print_page_style__');
        if (injected) injected.remove();
        window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);

    window.print();
}
