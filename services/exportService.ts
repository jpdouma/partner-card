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
  const filename = createFilename('Red2Roast Partner Card', data.companyName, data.date, 'csv');
  downloadFile(blob, filename);
};

export const exportToJSON = (data: FormData) => {
  const jsonContent = JSON.stringify(data, null, 2); // Pretty print JSON
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const filename = createFilename('Red2Roast Partner Card', data.companyName, data.date, 'json');
  downloadFile(blob, filename);
};

export const exportToPDF = async (data: FormData, logoBase64: string | null) => {
  const { jsPDF } = jspdf;
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 40;
  let y = margin;

  // Header
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
    const valueLines = doc.splitTextToSize(String(value ?? ''), pageWidth / 2 - margin * 1.5);
    doc.text(valueLines, margin + 120 + offsetX, keyY);
    
    const lineHeight = 10 * 1.15;
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
  y = initialY; 
  
  doc.setFillColor(235, 245, 255);
  doc.rect(col2X - 10, y - 10, pageWidth / 2 - margin + 10, col1Height - y + 20, 'F');
  addKeyValue('Invoice Address', data.invoiceAddress, col2X - margin);
  addKeyValue('Invoice City and State', data.invoiceCityAndState, col2X - margin);
  addKeyValue('Invoice Post Code', data.invoicePostCode, col2X - margin);
  addKeyValue('Invoice Country', data.invoiceCountry, col2X - margin);
  addKeyValue('Invoice Language', data.invoiceLanguage, col2X - margin);
  addKeyValue('Default Currency', data.defaultCurrency, col2X - margin);
  
  y = Math.max(col1Height, y); 

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
  addSectionHeader('Financial & Credit Information');
  const finY = y;
  addKeyValue('VAT Number', data.vatNo);
  addKeyValue('Company Reg. Number', data.companyRegNo);
  addKeyValue(data.eoriOrEinType === 'eori' ? 'EORI Number (EU)' : 'EIN Number (US)', data.eoriOrEinValue);
  addKeyValue('Requested Credit Limit', data.requestedCreditLimit);
  addKeyValue('Requested Payment Terms', data.requestedPaymentTerms);
  const fin1H = y;
  y = finY;
  
  doc.setFillColor(235, 245, 255);
  doc.rect(col2X - 10, y - 10, pageWidth / 2 - margin + 10, 150, 'F');
  addKeyValue('Bank Name', data.bankName, col2X - margin);
  addKeyValue('Account Name', data.accountName, col2X - margin);
  addKeyValue('Bank Address', data.bankAddress, col2X - margin);
  addKeyValue(data.accountIdentifierType === 'iban' ? 'IBAN' : 'Account Number', data.accountIdentifierValue, col2X - margin);
  addKeyValue(data.swiftOrBicType === 'swift' ? 'SWIFT Code' : 'BIC', data.swiftOrBicValue, col2X - margin);
  addKeyValue(data.sortOrRoutingType === 'sort' ? 'Sort Code' : 'Routing Number', data.sortOrRoutingValue, col2X - margin);
  y = Math.max(fin1H, y);


  // Red2Roast Internal Section
  addSectionHeader('To be completed by Red2Roast (Internal)');
  
  const checklistRows = [
    [{ label: 'POA' }, { label: 'Credit' }, { label: 'Signed Quote' }, { label: 'IT' }],
    [{ label: 'Scope' }, { label: 'Company Reg' }, { label: 'Highrise' }, { label: 'Exact' }],
    [{ label: 'GDPR' }, { label: 'Passport' }, { label: 'Credit Check' }, { label: 'Bank' }]
  ];

  const colWidth = (pageWidth - 2 * margin) / 4;
  const boxSize = 10;
  
  checklistRows.forEach(row => {
      const rowY = y;
      row.forEach((item, index) => {
          const x = margin + index * colWidth;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(`${item.label}:`, x, y);
          doc.setDrawColor(0);
          doc.setLineWidth(0.5);
          doc.rect(x + 80, y - 8, boxSize, boxSize); // Draw a square
      });
      y = rowY + 20; // Move y down for the next row
  });


  addKeyValue('Debtor No Scope', data.debtorNoScope);
  addKeyValue('Creditor No Scope', data.creditorNoScope);
  
  // Agreement Section
  addSectionHeader('Agreement Mgmt');
  const agreementY = y;
  addKeyValue('Agreement Date', data.agreementDate);
  const leftHeight = y;
  y = agreementY;
  addKeyValue('Signature', data.signature, (pageWidth / 2) - margin);
  y = Math.max(leftHeight, y);

  addKeyValue('Remarks', data.remarks);

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
      
      const targetHeight = 30;
      const aspectRatio = logoImage.width / logoImage.height;
      const targetWidth = targetHeight * aspectRatio;

      const logoY = firstPage.getHeight() - margin - targetHeight;
      firstPage.drawImage(logoImage, {
        x: margin,
        y: logoY,
        width: targetWidth,
        height: targetHeight,
      });

      const title = 'Red2Roast Partner Card';
      const titleFontSize = 18;
      const titleY = logoY + (targetHeight / 2) - (titleFontSize / 2) + 2; 
      const titleX = margin + targetWidth + 15;
      
      firstPage.drawText(title, {
          x: titleX,
          y: titleY,
          size: titleFontSize,
          font: helveticaBold,
          color: rgb(0, 0, 0),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      downloadFile(blob, createFilename('Red2Roast Partner Card', data.companyName, data.date, 'pdf'));

    } catch (e) {
      console.error("Failed to add logo to PDF:", e);
      const blob = new Blob([jsPdfArrayBuffer], { type: 'application/pdf' });
      downloadFile(blob, createFilename('Red2Roast Partner Card', data.companyName, data.date, 'pdf'));
    }
  } else {
      const blob = new Blob([jsPdfArrayBuffer], { type: 'application/pdf' });
      downloadFile(blob, createFilename('Red2Roast Partner Card', data.companyName, data.date, 'pdf'));
  }
};


export const exportToXLSX = (data: FormData) => {
    const ws: { [key: string]: any } = {};
    const merges: any[] = [];
    let R = 0; // Current Row

    // --- Helper Functions ---
    const addCell = (c: number, r: number, value: any, style: any = {}) => {
        const addr = XLSX.utils.encode_cell({ c, r });
        ws[addr] = { t: 's', v: String(value ?? ''), s: style };
    };
    const mergeCells = (sc: number, sr: number, ec: number, er: number) => {
        merges.push({ s: { c: sc, r: sr }, e: { c: ec, r: er } });
    };

    // --- Styles ---
    const border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    const boldFont = { font: { bold: true } };
    const centerAlign = { alignment: { horizontal: 'center', vertical: 'center' } };

    const headerFill = { fill: { fgColor: { rgb: "FFFF00" } } }; // Yellow
    const sectionFill = { fill: { fgColor: { rgb: "D3D3D3" } } }; // Grey
    const blueFill = { fill: { fgColor: { rgb: "ADD8E6" } } }; // Light Blue
    const yellowFill = { fill: { fgColor: { rgb: "FFFF00" } } }; // Yellow

    const sectionStyle = { ...boldFont, ...centerAlign, ...sectionFill, border };
    const headerStyle = { ...boldFont, ...centerAlign, ...headerFill, border };

    const valueStyle = { border };
    const blueValueStyle = { border, ...blueFill };
    const yellowValueStyle = { border, ...yellowFill, ...centerAlign };
    const checkStyle = { border, ...yellowFill, ...centerAlign };

    // --- Populate Worksheet ---

    // Header Block (To be completed by Red2Roast)
    R = 2;
    addCell(9, R, 'To be completed by Red2Roast', headerStyle); // J3
    mergeCells(9, R, 15, R); // J3:P3

    R = 4;
    addCell(9, R, 'Date:'); addCell(12, R, data.date, valueStyle); mergeCells(12, R, 14, R); // J5, M5:O5
    R = 6;
    addCell(9, R, 'Request By:'); addCell(12, R, data.requestBy, valueStyle); mergeCells(12, R, 15, R); // J7, M7:P7
    R = 8;
    addCell(9, R, 'Role:');
    addCell(12, R, 'Debtor :'); addCell(14, R, data.role === 'debtor' ? 'X' : '', checkStyle); // M9, O9
    addCell(15, R, 'Creditor :'); addCell(17, R, data.role === 'creditor' ? 'X' : '', checkStyle); // P9, R9

    // Debtor/Creditor Section
    R = 10;
    addCell(1, R, 'To be completed by Debtor / Creditor', sectionStyle); mergeCells(1, R, 18, R); // B11:S11

    const startRowDebtor = R + 2;
    R = startRowDebtor;
    addCell(1, R, 'Company Name:'); addCell(3, R, data.companyName, blueValueStyle); mergeCells(3, R, 7, R+1);
    R+=2;
    addCell(1, R, 'Address:'); addCell(3, R, data.address, blueValueStyle); mergeCells(3, R, 7, R+1);
    R+=2;
    addCell(1, R, 'City and State:'); addCell(3, R, data.cityAndState, blueValueStyle); mergeCells(3, R, 7, R+1);
    R+=2;
    addCell(1, R, 'Post Code:'); addCell(3, R, data.postCode, blueValueStyle); mergeCells(3, R, 7, R+1);
    R+=2;
    addCell(1, R, 'Country:'); addCell(3, R, data.country, blueValueStyle); mergeCells(3, R, 7, R+1);
    R+=2;
    addCell(1, R, 'Phone:'); addCell(3, R, data.phone, blueValueStyle); mergeCells(3, R, 7, R+1);
    R+=2;
    addCell(1, R, 'Website:'); addCell(3, R, data.website, blueValueStyle); mergeCells(3, R, 7, R+1);
    const leftColHeight = R;
    
    R = startRowDebtor;
    addCell(9, R, 'Invoice Address'); addCell(12, R, data.invoiceAddress, blueValueStyle); mergeCells(12, R, 16, R+1);
    R+=2;
    addCell(9, R, 'City and State:'); addCell(12, R, data.invoiceCityAndState, blueValueStyle); mergeCells(12, R, 16, R+1);
    R+=2;
    addCell(9, R, 'Post Code:'); addCell(12, R, data.invoicePostCode, blueValueStyle); mergeCells(12, R, 16, R+1);
    R+=2;
    addCell(9, R, 'Country:'); addCell(12, R, data.invoiceCountry, blueValueStyle); mergeCells(12, R, 16, R+1);
    R+=2;
    addCell(9, R, 'Invoice Language:'); addCell(12, R, data.invoiceLanguage, valueStyle); mergeCells(12, R, 16, R+1);
    R+=2;
    addCell(9, R, 'Default Currency:'); addCell(12, R, data.defaultCurrency, valueStyle); mergeCells(12, R, 16, R+1);

    R = Math.max(leftColHeight, R) + 1;
    const contactStartRow = R;

    // Contact General
    addCell(1, contactStartRow, 'Contact general :', boldFont);
    R = contactStartRow + 1;
    addCell(1, R, 'Name:'); addCell(3, R, data.generalName, blueValueStyle); mergeCells(3, R, 7, R);
    addCell(9, R, 'Phone:'); addCell(12, R, data.generalPhone, blueValueStyle); mergeCells(12, R, 16, R);
    R += 2;
    addCell(1, R, 'Title:'); addCell(3, R, data.generalTitle, blueValueStyle); mergeCells(3, R, 7, R);
    addCell(9, R, 'Mobile:'); addCell(12, R, data.generalMobile, blueValueStyle); mergeCells(12, R, 16, R);
    R += 2;
    addCell(1, R, 'Email:'); addCell(3, R, data.generalEmail, blueValueStyle); mergeCells(3, R, 7, R);
    R += 2;

    // Contact Finance
    addCell(1, R, 'Contact Finance:', boldFont);
    R += 1;
    const finContactStartRow = R;
    addCell(1, R, 'Name:'); addCell(3, R, data.financeName, blueValueStyle); mergeCells(3, R, 7, R);
    addCell(9, R, 'Phone:'); addCell(12, R, data.financePhone, blueValueStyle); mergeCells(12, R, 16, R);
    R += 2;
    addCell(1, R, 'Title:'); addCell(3, R, data.financeTitle, blueValueStyle); mergeCells(3, R, 7, R);
    addCell(9, R, 'Mobile:'); addCell(12, R, data.financeMobile, blueValueStyle); mergeCells(12, R, 16, R);
    R += 2;
    addCell(1, R, 'Email:'); addCell(3, R, data.financeEmail, blueValueStyle); mergeCells(3, R, 7, R);
    R += 2;

    // Financial Info
    const finInfoStartRow = R;
    addCell(1, R, 'VAT no (if applicable):'); addCell(4, R, data.vatNo, blueValueStyle); mergeCells(4, R, 7, R);
    R+=2;
    addCell(1, R, 'Company Reg No:'); addCell(4, R, data.companyRegNo, blueValueStyle); mergeCells(4, R, 7, R);
    R+=2;
    addCell(1, R, 'EORI No (EU) / EIN No (US)'); addCell(4, R, data.eoriOrEinValue, blueValueStyle); mergeCells(4, R, 7, R);
    R+=2;
    addCell(1, R, 'Requested Credit Limit:'); addCell(4, R, data.requestedCreditLimit, blueValueStyle); mergeCells(4, R, 7, R);
    R+=2;
    addCell(1, R, 'Requested Payment Terms:'); addCell(4, R, data.requestedPaymentTerms, valueStyle); mergeCells(4, R, 7, R);
    const finLeftColHeight = R;
    
    R = finInfoStartRow;
    addCell(9, R, 'Bank name:'); addCell(12, R, data.bankName, blueValueStyle); mergeCells(12, R, 16, R);
    R+=2;
    addCell(9, R, 'Account name:'); addCell(12, R, data.accountName, blueValueStyle); mergeCells(12, R, 16, R);
    R+=2;
    addCell(9, R, 'Bank address:'); addCell(12, R, data.bankAddress, blueValueStyle); mergeCells(12, R, 16, R+1);
    R+=2;
    addCell(9, R, 'Account No / IBAN No.:'); addCell(12, R, data.accountIdentifierValue, blueValueStyle); mergeCells(12, R, 16, R);
    R+=2;
    addCell(9, R, 'Swift Code / BIC:'); addCell(12, R, data.swiftOrBicValue, blueValueStyle); mergeCells(12, R, 16, R);
    R+=2;
    addCell(9, R, 'Sort Code / Routing'); addCell(12, R, data.sortOrRoutingValue, blueValueStyle); mergeCells(12, R, 16, R);
    R = Math.max(finLeftColHeight, R) + 2;

    // Second Red2Roast Section
    addCell(1, R, 'To be completed by Red2Roast (Internal)', sectionStyle); mergeCells(1, R, 18, R);
    R+=2;
    addCell(2, R, 'POA'); addCell(3, R, '', checkStyle);
    addCell(4, R, 'Credit'); addCell(5, R, '', checkStyle);
    addCell(6, R, 'Signed Quote'); addCell(7, R, '', checkStyle);
    addCell(9, R, 'IT'); addCell(10, R, '', checkStyle);
    addCell(12, R, 'Check'); addCell(13, R, '', checkStyle); addCell(15, R, '', checkStyle); addCell(17, R, '', checkStyle);
    R++;
    addCell(2, R, 'Scope'); addCell(3, R, '', checkStyle);
    addCell(4, R, 'Company Reg'); addCell(5, R, '', checkStyle);
    addCell(6, R, 'Highrise'); addCell(7, R, '', checkStyle);
    addCell(9, R, 'Exact'); addCell(10, R, '', checkStyle);
    R++;
    addCell(2, R, 'GDPR'); addCell(3, R, '', checkStyle);
    addCell(4, R, 'Passport'); addCell(5, R, '', checkStyle);
    addCell(6, R, 'Credit check'); addCell(7, R, '', checkStyle);
    addCell(9, R, 'Bank'); addCell(10, R, '', checkStyle);
    R+=2;
    addCell(1, R, 'Debtor No Scope:'); addCell(4, R, data.debtorNoScope, yellowValueStyle); mergeCells(4, R, 7, R);
    addCell(10, R, 'Creditor No Scope:'); addCell(13, R, data.creditorNoScope, yellowValueStyle); mergeCells(13, R, 16, R);
    R+=2;

    // Agreement Section
    addCell(1, R, 'Remarks:');
    addCell(3, R, data.remarks, { ...valueStyle, alignment: { wrapText: true, vertical: 'top' } });
    mergeCells(3, R, 18, R + 2);
    R += 4;
    
    addCell(1, R, 'Agreement Mgmt:', boldFont);
    R += 2;
    addCell(1, R, 'Date:'); addCell(3, R, data.agreementDate, valueStyle); mergeCells(3, R, 6, R);
    addCell(12, R, 'Signature:'); addCell(14, R, data.signature, valueStyle); mergeCells(14, R, 17, R);
    R+=2;

    // --- Finalize and Download ---
    ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 18, r: R } });
    ws['!merges'] = merges;
    ws['!cols'] = [ {wch: 2}, {wch: 20}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 2}, {wch: 15}, {wch: 12}, {wch: 2}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 2} ];
    ws['!rows'] = Array.from({length: R}, () => ({ hpt: 15 }));


    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Partner Card');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    
    const filename = createFilename('Red2Roast Partner Card', data.companyName, data.date, 'xlsx');
    downloadFile(blob, filename);
};