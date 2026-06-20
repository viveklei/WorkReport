import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Helper to ensure all images within an element are loaded before capture.
 */
const waitForImages = async (element) => {
    const images = Array.from(element.getElementsByTagName('img'));
    const promises = images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve; // Continue even if one image fails
        });
    });
    return Promise.all(promises);
};

/**
 * Generates a PDF from one or more DOM elements and triggers a download.
 * @param {string|string[]} elementIds - The ID or array of IDs of the elements to capture.
 * @param {string} filename - The name of the file to save.
 */
export const generatePdfFromElement = async (elementIds, filename = 'work-report.pdf') => {
    const ids = Array.isArray(elementIds) ? elementIds : [elementIds];
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    let isFirstPage = true;

    try {
        for (let i = 0; i < ids.length; i++) {
            const element = document.getElementById(ids[i]);
            if (!element) {
                console.warn(`Element with ID ${ids[i]} not found. Skipping.`);
                continue;
            }

            // Ensure images are loaded before capture
            await waitForImages(element);

            // Force a layout check
            const width = element.offsetWidth || 800;
            const height = element.offsetHeight;
            
            if (width === 0) {
                console.error(`Element ${ids[i]} has 0 width. PDF capture may fail.`);
            }

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff',
                imageTimeout: 15000,
                width: width,
                height: height,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.getElementById(ids[i]);
                    if (el) {
                        el.style.width = '800px';
                        el.style.display = 'block';
                        el.style.visibility = 'visible';
                        el.style.height = 'auto';
                        el.style.position = 'relative';
                    }
                }
            });

            // Double check if canvas was created successfully with dimensions
            if (!canvas || canvas.width === 0 || canvas.height === 0) {
                throw new Error(`Failed to capture element ${ids[i]}: Generated canvas has 0 dimensions.`);
            }

            const imgData = canvas.toDataURL('image/png', 0.8);
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            
            // Set scale to full width
            const finalWidth = pdfWidth;
            const finalHeight = (imgHeight * pdfWidth) / imgWidth;
            
            let heightLeft = finalHeight;
            let position = 0;

            // Add the first part of this element
            if (!isFirstPage) {
                pdf.addPage();
            }
            pdf.addImage(imgData, 'PNG', 0, position, finalWidth, finalHeight, undefined, 'FAST');
            isFirstPage = false;
            heightLeft -= pdfHeight;

            // Handle multi-page overflow for this specific element
            while (heightLeft > 0) {
                position = heightLeft - finalHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, finalWidth, finalHeight, undefined, 'FAST');
                heightLeft -= pdfHeight;
            }
        }

        if (filename === 'FILE_OBJECT') {
            const blob = pdf.output('blob');
            return new File([blob], 'Work_Report.pdf', { type: 'application/pdf' });
        }

        pdf.save(filename);
        return true;
    } catch (error) {
        console.error('Core PDF Generation Engine Failure:', error);
        throw error;
    }
};

