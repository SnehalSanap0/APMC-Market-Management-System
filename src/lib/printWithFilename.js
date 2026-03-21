/**
 * printWithFilename(filename)
 *
 * Sets document.title to the desired PDF filename before printing,
 * then restores the original title after the print dialog closes.
 * The browser uses document.title as the default "Save as" filename.
 *
 * @param {string} filename - Desired filename WITHOUT the .pdf extension
 */
export function printWithFilename(filename) {
    const originalTitle = document.title;
    document.title = filename;

    // Restore after the print dialog closes (works in all major browsers)
    const restore = () => {
        document.title = originalTitle;
        window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);

    window.print();
}
