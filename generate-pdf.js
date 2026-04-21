const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create a new PDF document
const doc = new PDFDocument({
    size: 'A4',
    margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
    }
});

// Pipe the PDF to a file
const outputPath = path.join(__dirname, 'documents', 'rental_methods.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// Add content to the PDF
doc.fontSize(20)
   .fillColor('#2c3e50')
   .text('RENTMED HEALTHCARE', { align: 'center' });

doc.moveDown();

doc.fontSize(16)
   .fillColor('#34495e')
   .text('Rental Methods Information', { align: 'center' });

doc.moveDown(2);

doc.fontSize(14)
   .fillColor('#000000')
   .text('Thank you for your interest in RentMed Healthcare rental services.');

doc.moveDown();
doc.text('We offer two primary rental methods to suit your needs:');

doc.moveDown();

// Method 1: Private Rentals
doc.fontSize(16)
   .fillColor('#2980b9')
   .text('1. PRIVATE RENTALS');

doc.fontSize(12)
   .fillColor('#000000')
   .list([
    'Direct rental agreements with individuals',
    'Flexible rental periods',
    'Competitive pricing',
    'Quick approval process',
    'Direct billing to customer'
   ], { bulletRadius: 2, textIndent: 20, bulletIndent: 10 });

doc.moveDown();

// Method 2: Medical Aid Scheme Rentals
doc.fontSize(16)
   .fillColor('#2980b9')
   .text('2. MEDICAL AID SCHEME RENTALS');

doc.fontSize(12)
   .fillColor('#000000')
   .list([
    'Rental through your medical aid provider',
    'Coverage subject to medical aid benefits',
    'Pre-authorization may be required',
    'Direct billing to medical aid',
    'May require co-payment depending on your plan'
   ], { bulletRadius: 2, textIndent: 20, bulletIndent: 10 });

doc.moveDown(2);

// How to Proceed
doc.fontSize(16)
   .fillColor('#27ae60')
   .text('HOW TO PROCEED:');

doc.fontSize(12)
   .fillColor('#000000')
   .list([
    'Choose your preferred rental method',
    'Contact us at enquiries@rentmed.co.za',
    'Provide your requirements and details',
    'Receive a customized quotation',
    'Complete the rental agreement',
    'Arrange delivery or pickup'
   ], { bulletRadius: 2, textIndent: 20, bulletIndent: 10 });

doc.moveDown(2);

// Contact Information
doc.fontSize(14)
   .fillColor('#2c3e50')
   .text('CONTACT INFORMATION:', { underline: true });

doc.moveDown(0.5);

doc.fontSize(12)
   .fillColor('#000000')
   .text('Email: enquiries@rentmed.co.za');

doc.moveDown(3);

doc.fontSize(11)
   .fillColor('#7f8c8d')
   .text('Kind regards,', { align: 'center' });

doc.text('RentMed Healthcare Team', { align: 'center' });

// Finalize the PDF
doc.end();

console.log('PDF generated successfully at:', outputPath);
console.log('To generate the PDF, run: node generate-pdf.js');
console.log('Note: You need to install pdfkit first: npm install pdfkit');