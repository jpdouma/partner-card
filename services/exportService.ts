import { FormData } from '../types';

declare const jspdf: any;
declare const XLSX: any;
declare const PDFLib: any;

const downloadFile = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const createFilename = (base: string, companyName: string | undefined, date: string | undefined, extension: string) => {
    const parts = [base];
    if (companyName?.trim()) {
        parts.push(companyName.trim());
    }
    if (date?.trim()) {
        parts.push(date.trim());
    }
    return `${parts.join(' ')}.${extension}`;
}

export const exportToCSV = (data: FormData) => {
  const headers = Object.keys(data).join(',');
  const values = Object.values(data).map(value => `"${value}"`).join(',');
  const csvContent = `${headers}\n${values}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = createFilename('Partner Card', data.companyName, data.date, 'csv');
  downloadFile(blob, filename);
};

export const exportToJSON = (data: FormData) => {
  const jsonContent = JSON.stringify(data, null, 2); // Pretty print JSON
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const filename = createFilename('Partner Card', data.companyName, data.date, 'json');
  downloadFile(blob, filename);
};

export const exportToPDF = async (data: FormData, logoBase64: string | null) => {
  const { jsPDF } = jspdf;
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 40;
  let y = margin;

  // Header: Reserve space for the logo/title header.
  // If a logo is present, we'll add it with pdf-lib later.
  // If not, we'll draw a centered title here with jsPDF.
  if (logoBase64) {
    y += 40; // Reserve space for the header row
  } else {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Red2Roast Partner Card', pageWidth / 2, y + 10, { align: 'center' });
    y += 40;
  }

  const addText = (x: number, currentY: number, text: string, size = 10, style = 'normal', color = '#000000') => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.setTextColor(color);
      const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - x);
      doc.text(lines, x, currentY);
      return (lines.length * size * 1.15) - size; // Return added height
  };

  const addSectionHeader = (title: string) => {
      if (y + 40 > pageHeight - margin) {
          doc.addPage();
          y = margin;
      }
      y += 20; // Space before header
      doc.setFillColor(230, 230, 230);
      doc.rect(margin, y, pageWidth - margin * 2, 20, 'F');
      addText(margin + 10, y + 14, title, 12, 'bold');
      y += 30; // Space after header
  };

  const addKeyValue = (key: string, value: string, offsetX = 0) => {
    const keyY = y;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${key}:`, margin + offsetX, keyY);
    
    doc.setFont('helvetica', 'normal');
    // Use nullish coalescing to handle null/undefined without printing "null"
    const valueLines = doc.splitTextToSize(String(value ?? ''), pageWidth / 2 - margin * 1.5);
    doc.text(valueLines, margin + 120 + offsetX, keyY);
    
    const lineHeight = 10 * 1.15;
    // Advance Y by at least one line for the key, or more if the value is multi-line.
    y += (valueLines.length * lineHeight) + 5;
  };
  
  // Red2Roast Section
  addSectionHeader('To be completed by Red2Roast');
  addKeyValue('Date', data.date);
  addKeyValue('Request By', data.requestBy);
  addKeyValue('Role', data.role);

  // Debtor/Creditor Section
  addSectionHeader('To be completed by Debtor / Creditor');
  const col1X = margin;
  const col2X = pageWidth / 2 + 10;
  const initialY = y;

  addKeyValue('Company Name', data.companyName);
  addKeyValue('Address', data.address);
  addKeyValue('City and State', data.cityAndState);
  addKeyValue('Post Code', data.postCode);
  addKeyValue('Country', data.country);
  addKeyValue('Phone', data.phone);
  addKeyValue('Website', data.website);

  const col1Height = y;
  y = initialY; // Reset y for second column
  
  // Invoice Details in a blue box
  doc.setFillColor(235, 245, 255);
  doc.rect(col2X - 10, y - 10, pageWidth / 2 - margin + 10, col1Height - y + 20, 'F');
  addKeyValue('Invoice Address', data.invoiceAddress, col2X - margin);
  addKeyValue('Invoice City and State', data.invoiceCityAndState, col2X - margin);
  addKeyValue('Invoice Post Code', data.invoicePostCode, col2X - margin);
  addKeyValue('Invoice Country', data.invoiceCountry, col2X - margin);
  addKeyValue('Invoice Language', data.invoiceLanguage, col2X - margin);
  addKeyValue('Default Currency', data.defaultCurrency, col2X - margin);
  
  y = Math.max(col1Height, y); // Set Y to the bottom of the tallest column

  // Contact Info
  const addContact = (type: 'general' | 'finance') => {
    const title = type === 'general' ? 'Contact General' : 'Contact Finance';
    y += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y);
    y += 15;
    const cY = y;
    addKeyValue('Name', data[`${type}Name`]);
    addKeyValue('Title', data[`${type}Title`]);
    addKeyValue('Email', data[`${type}Email`]);
    const c1H = y;
    y = cY;
    addKeyValue('Phone', data[`${type}Phone`], col2X - margin);
    addKeyValue('Mobile', data[`${type}Mobile`], col2X - margin);
    y = Math.max(c1H, y);
  }
  addContact('general');
  addContact('finance');

  // Financial Info
  addSectionHeader('Financial Information');
  const finY = y;
  addKeyValue('VAT Number', data.vatNo);
  addKeyValue('Company Reg. Number', data.companyRegNo);
  addKeyValue(data.eoriOrEinType === 'eori' ? 'EORI Number (EU)' : 'EIN Number (US)', data.eoriOrEinValue);
  const fin1H = y;
  y = finY;
  // Bank Details in blue box
  doc.setFillColor(235, 245, 255);
  doc.rect(col2X - 10, y - 10, pageWidth / 2 - margin + 10, 150, 'F');
  addKeyValue('Bank Name', data.bankName, col2X - margin);
  addKeyValue('Account Name', data.accountName, col2X - margin);
  addKeyValue('Bank Address', data.bankAddress, col2X - margin);
  addKeyValue(data.accountIdentifierType === 'iban' ? 'IBAN' : 'Account Number', data.accountIdentifierValue, col2X - margin);
  addKeyValue(data.swiftOrBicType === 'swift' ? 'SWIFT Code' : 'BIC', data.swiftOrBicValue, col2X - margin);
  addKeyValue(data.sortOrRoutingType === 'sort' ? 'Sort Code' : 'Routing Number', data.sortOrRoutingValue, col2X - margin);
  y = Math.max(fin1H, y);

  // Credit Info
  addSectionHeader('Credit Information');
  addKeyValue('Requested Credit Limit', data.requestedCreditLimit);
  addKeyValue('Requested Payment Terms', data.requestedPaymentTerms);

  // Red2Roast Internal Section
  addSectionHeader('To be completed by Red2Roast (Internal)');
  
  const addCheckboxSimple = (label: string, checked: boolean, x: number, currentY: number) => {
      const text = checked ? '[X]' : '[ ]';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`${text} ${label}`, x, currentY);
  };
  
  const checkboxCols = [
      [{ label: 'POA', key: 'poa' }, { label: 'Company Registration', key: 'companyRegistration' }, { label: 'Credit Check', key: 'creditCheck' }],
      [{ label: 'Scope', key: 'scope' }, { label: 'Passport', key: 'passport' }, { label: 'IT', key: 'it' }],
      [{ label: 'GDPR', key: 'gdpr' }, { label: 'Signed Quote', key: 'signedQuote' }, { label: 'Exact', key: 'exact' }],
      [{ label: 'Credit', key: 'credit' }, { label: 'Highrise', key: 'highrise' }, { label: 'Bank', key: 'bank' }]
  ];

  let startY = y;
  let colX = margin;
  const colGap = 130;

  for (let i = 0; i < checkboxCols.length; i++) {
      colX = margin + i * colGap;
      y = startY;
      for (const item of checkboxCols[i]) {
          const key = item.key as keyof FormData;
          addCheckboxSimple(item.label, Boolean((data as any)[key]), colX, y);
          y += 20;
      }
  }
  y = startY + 3 * 20; 
  y += 10; 

  addKeyValue('Debtor No Scope', data.debtorNoScope);
  addKeyValue('Creditor No Scope', data.creditorNoScope);
  
  // Agreement Section
  addSectionHeader('Agreement');
  addKeyValue('Remarks', data.remarks);
  addKeyValue('Agreement Date', data.agreementDate);
  addKeyValue('Signature', data.signature);

  const jsPdfArrayBuffer = doc.output('arraybuffer');
  
  if (logoBase64) {
    try {
      const pdfDoc = await PDFLib.PDFDocument.load(jsPdfArrayBuffer);
      const { StandardFonts, rgb } = PDFLib;
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const imageBytes = await fetch(logoBase64).then(res => res.arrayBuffer());
      
      let logoImage;
      if (logoBase64.startsWith('data:image/png')) {
        logoImage = await pdfDoc.embedPng(imageBytes);
      } else if (logoBase64.startsWith('data:image/jpeg') || logoBase64.startsWith('data:image/jpg')) {
        logoImage = await pdfDoc.embedJpg(imageBytes);
      } else {
        throw new Error('Unsupported logo format');
      }
      
      const targetHeight = 30; // Make logo smaller
      const aspectRatio = logoImage.width / logoImage.height;
      const targetWidth = targetHeight * aspectRatio;

      // Position logo at top-left
      const logoY = firstPage.getHeight() - margin - targetHeight;
      firstPage.drawImage(logoImage, {
        x: margin,
        y: logoY,
        width: targetWidth,
        height: targetHeight,
      });

      // Draw title text next to the logo
      const title = 'Red2Roast Partner Card';
      const titleFontSize = 18;
      // Vertically align title text with the middle of the logo
      const titleY = logoY + (targetHeight / 2) - (titleFontSize / 2) + 2; 
      const titleX = margin + targetWidth + 15; // Place text 15pt to the right of the logo
      
      firstPage.drawText(title, {
          x: titleX,
          y: titleY,
          size: titleFontSize,
          font: helveticaBold,
          color: rgb(0, 0, 0),
      });


      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      downloadFile(blob, createFilename('Partner Card', data.companyName, data.date, 'pdf'));

    } catch (e) {
      console.error("Failed to add logo to PDF:", e);
      const blob = new Blob([jsPdfArrayBuffer], { type: 'application/pdf' });
      downloadFile(blob, createFilename('Partner Card', data.companyName, data.date, 'pdf'));
    }
  } else {
      const blob = new Blob([jsPdfArrayBuffer], { type: 'application/pdf' });
      downloadFile(blob, createFilename('Partner Card', data.companyName, data.date, 'pdf'));
  }
};


export const exportToXLSX = (data: FormData) => {
    const ws: { [key: string]: any } = {};
    const merges: any[] = [];

    // --- Helper Functions ---
    const addCell = (addr: string, value: any, style: any = {}) => {
        // Ensure value is a string to avoid issues with xlsx library
        ws[addr] = { t: 's', v: String(value ?? ''), s: style };
    };
    const mergeCells = (startAddr: string, endAddr: string) => {
        merges.push({ s: XLSX.utils.decode_cell(startAddr), e: XLSX.utils.decode_cell(endAddr) });
    };

    // --- Styles ---
    const border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    const boldFont = { font: { bold: true } };
    const centerAlign = { alignment: { horizontal: 'center' } };
    const greyFill = { fill: { fgColor: { rgb: "E0E0E0" } } };
    const blueFill = { fill: { fgColor: { rgb: "B0E0E6" } } };
    const yellowFill = { fill: { fgColor: { rgb: "FFFF00" } } };

    const valueStyle = { border };
    const blueValueStyle = { border, ...blueFill };
    const yellowValueStyle = { border, ...yellowFill };
    const sectionStyle = { ...boldFont, ...centerAlign, ...greyFill };
    
    // --- Populate Worksheet ---

    // Title & Header
    addCell('E1', 'Red2Roast Partner Card', { font: { bold: true, sz: 16 }, alignment: { horizontal: 'center' } });
    mergeCells('E1', 'I2');
    addCell('E3', 'To be completed by Red2Roast', sectionStyle);
    mergeCells('E3', 'I4');

    // Red2Roast Section
    addCell('E5', 'Date:');
    addCell('F5', data.date, valueStyle); mergeCells('F5', 'G5');
    addCell('E7', 'Request By:');
    addCell('F7', data.requestBy, valueStyle); mergeCells('F7', 'G7');
    addCell('E9', 'Role:');
    addCell('F9', data.role === 'debtor' ? 'X' : '', { ...valueStyle, ...centerAlign });
    addCell('G9', 'Debtor');
    addCell('H9', data.role === 'creditor' ? 'X' : '', { ...valueStyle, ...centerAlign });
    addCell('I9', 'Creditor');

    // Debtor/Creditor Section Header
    addCell('B16', 'To be completed by Debtor / Creditor', sectionStyle);
    mergeCells('B16', 'M17');

    // Debtor/Creditor Info
    addCell('B18', 'Company Name:');
    addCell('D18', data.companyName, valueStyle); mergeCells('D18', 'H19');
    addCell('B20', 'Address:');
    addCell('D20', data.address, valueStyle); mergeCells('D20', 'H21');
    addCell('B22', 'City and State:');
    addCell('D22', data.cityAndState, valueStyle); mergeCells('D22', 'H23');
    addCell('B24', 'Post Code:');
    addCell('D24', data.postCode, valueStyle); mergeCells('D24', 'H25');
    addCell('B26', 'Country:');
    addCell('D26', data.country, valueStyle); mergeCells('D26', 'H27');
    addCell('B28', 'Phone:');
    addCell('D28', data.phone, valueStyle); mergeCells('D28', 'H29');
    addCell('B30', 'Website:');
    addCell('D30', data.website, valueStyle); mergeCells('D30', 'H31');

    // Invoice Info
    addCell('I18', 'Invoice Address (If Other):');
    addCell('K18', data.invoiceAddress, blueValueStyle); mergeCells('K18', 'M21');
    addCell('I22', 'City and State:');
    addCell('K22', data.invoiceCityAndState, blueValueStyle); mergeCells('K22', 'M23');
    addCell('I24', 'Post Code:');
    addCell('K24', data.invoicePostCode, blueValueStyle); mergeCells('K24', 'M25');
    addCell('I26', 'Country:');
    addCell('K26', data.invoiceCountry, blueValueStyle); mergeCells('K26', 'M27');
    addCell('I28', 'Invoice Language:');
    addCell('K28', data.invoiceLanguage, valueStyle); mergeCells('K28', 'M29');
    addCell('I30', 'Default Currency:');
    addCell('K30', data.defaultCurrency, valueStyle); mergeCells('K30', 'M31');
    
    // Contact General
    addCell('B32', 'Contact general :', boldFont);
    addCell('B34', 'Name:');
    addCell('D34', data.generalName, valueStyle); mergeCells('D34', 'H35');
    addCell('B36', 'Title:');
    addCell('D36', data.generalTitle, valueStyle); mergeCells('D36', 'H37');
    addCell('B38', 'Email:');
    addCell('D38', data.generalEmail, valueStyle); mergeCells('D38', 'H39');
    addCell('I34', 'Phone:');
    addCell('K34', data.generalPhone, valueStyle); mergeCells('K34', 'M35');
    addCell('I36', 'Mobile:');
    addCell('K36', data.generalMobile, valueStyle); mergeCells('K36', 'M37');

    // Contact Finance
    addCell('B40', 'Contact Finance:', boldFont);
    addCell('B42', 'Name:');
    addCell('D42', data.financeName, valueStyle); mergeCells('D42', 'H43');
    addCell('B44', 'Title:');
    addCell('D44', data.financeTitle, valueStyle); mergeCells('D44', 'H45');
    addCell('B46', 'Email:');
    addCell('D46', data.financeEmail, valueStyle); mergeCells('D46', 'H47');
    addCell('I42', 'Phone:');
    addCell('K42', data.financePhone, valueStyle); mergeCells('K42', 'M43');
    addCell('I44', 'Mobile:');
    addCell('K44', data.financeMobile, valueStyle); mergeCells('K44', 'M45');

    // Financial Info
    const eoriLabel = data.eoriOrEinType === 'eori' ? 'EORI Number (EU):' : 'EIN Number (US):';
    const accountLabel = data.accountIdentifierType === 'accountNo' ? 'Account Number:' : 'IBAN:';
    const swiftBicLabel = data.swiftOrBicType === 'swift' ? 'Swift Code:' : 'BIC:';
    const sortRoutingLabel = data.sortOrRoutingType === 'sort' ? 'Sort Code:' : 'Routing Number (ACH/Wire):';

    addCell('B49', 'VAT Number (if applicable):');
    addCell('D49', data.vatNo, valueStyle); mergeCells('D49', 'H50');
    addCell('B51', 'Company Registration Number:');
    addCell('D51', data.companyRegNo, valueStyle); mergeCells('D51', 'H52');
    addCell('B53', eoriLabel);
    addCell('D53', data.eoriOrEinValue, valueStyle); mergeCells('D53', 'H54');
    addCell('B55', 'Requested Credit Limit:');
    addCell('D55', data.requestedCreditLimit, valueStyle); mergeCells('D55', 'H56');
    addCell('B57', 'Requested Payment Terms:');
    addCell('D57', data.requestedPaymentTerms, valueStyle); mergeCells('D57', 'H58');

    // Bank Info
    addCell('I49', 'Bank name:');
    addCell('K49', data.bankName, blueValueStyle); mergeCells('K49', 'M50');
    addCell('I51', 'Account Name:');
    addCell('K51', data.accountName, blueValueStyle); mergeCells('K51', 'M52');
    addCell('I53', 'Bank address:');
    addCell('K53', data.bankAddress, blueValueStyle); mergeCells('K53', 'M54');
    addCell('I55', accountLabel);
    addCell('K55', data.accountIdentifierValue, blueValueStyle); mergeCells('K55', 'M56');
    addCell('I57', swiftBicLabel);
    addCell('K57', data.swiftOrBicValue, blueValueStyle); mergeCells('K57', 'M58');
    addCell('I59', sortRoutingLabel);
    addCell('K59', data.sortOrRoutingValue, blueValueStyle); mergeCells('K59', 'M60');

    // Second Red2Roast Section
    addCell('B63', 'To be completed by Red2Roast', sectionStyle); mergeCells('B63', 'M64');
    addCell('B65', 'POA'); addCell('C65', data.poa ? 'X' : '', { ...valueStyle, ...centerAlign });
    addCell('B66', 'Scope'); addCell('C66', data.scope ? 'X' : '', { ...valueStyle, ...centerAlign });
    addCell('B67', 'GDPR'); addCell('C67', data.gdpr ? 'X' : '', { ...valueStyle, ...centerAlign });

    addCell('D65', 'Credit'); addCell('E65', data.credit ? 'X' : '', { ...valueStyle, ...centerAlign });
    addCell('D66', 'Company Registration'); addCell('E66', data.companyRegistration ? 'X' : '', { ...valueStyle, ...centerAlign });
    addCell('D67', 'Passport'); addCell('E67', data.passport ? 'X' : '', { ...valueStyle, ...centerAlign });

    addCell('F65', 'Signed Quote'); addCell('G65', data.signedQuote ? 'X' : '', { ...valueStyle, ...centerAlign });
    addCell('F66', 'Highrise'); addCell('G66', data.highrise ? 'X' : '', { ...valueStyle, ...centerAlign });
    addCell('F67', 'Credit check'); addCell('G67', data.creditCheck ? 'X' : '', { ...valueStyle, ...centerAlign });
    
    addCell('H65', 'IT'); addCell('I65', data.it ? 'X' : '', { ...valueStyle, ...centerAlign });
    addCell('H66', 'Exact'); addCell('I66', data.exact ? 'X' : '', { ...valueStyle, ...centerAlign });
    addCell('H67', 'Bank'); addCell('I67', data.bank ? 'X' : '', { ...valueStyle, ...centerAlign });

    addCell('B69', 'Debtor No Scope');
    addCell('D69', data.debtorNoScope, valueStyle);
    mergeCells('D69', 'H69');

    addCell('B71', 'Creditor No Scope');
    addCell('D71', data.creditorNoScope, valueStyle);
    mergeCells('D71', 'H71');

    // Agreement Section
    addCell('B73', 'Agreement', sectionStyle);
    mergeCells('B73', 'M74');

    addCell('B76', 'Remarks:');
    addCell('D76', data.remarks, { ...valueStyle, alignment: { wrapText: true, vertical: 'top' } });
    mergeCells('D76', 'M80');

    addCell('B82', 'Agreement Date:');
    addCell('D82', data.agreementDate, valueStyle);
    mergeCells('D82', 'F82');

    addCell('B84', 'Signature:');
    addCell('D84', data.signature, valueStyle);
    mergeCells('D84', 'F84');

    // --- Finalize and Download ---
    ws['!merges'] = merges;
    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 2 }, { wch: 25 }, { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Partner Card');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    
    const filename = createFilename('Partner Card', data.companyName, data.date, 'xlsx');
    downloadFile(blob, filename);
};