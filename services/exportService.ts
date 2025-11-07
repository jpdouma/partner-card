import { FormData } from '../types';

declare const jspdf: any;
declare const XLSX: any;

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
    const eoriLabel = data.eoriOrEin === 'eori' ? 'EORI Number (EU):' : 'EIN Number (US):';
    const accountLabel = data.accountIdentifierType === 'accountNo' ? 'Account Number:' : 'IBAN:';
    const swiftBicLabel = data.swiftOrBicType === 'swift' ? 'Swift Code:' : 'BIC:';
    const sortRoutingLabel = data.sortOrRoutingType === 'sort' ? 'Sort Code:' : 'Routing Number (ACH/Wire):';

    addCell('B49', 'VAT Number (if applicable):');
    addCell('D49', data.vatNo, valueStyle); mergeCells('D49', 'H50');
    addCell('B51', 'Company Registration Number:');
    addCell('D51', data.companyRegNo, valueStyle); mergeCells('D51', 'H52');
    addCell('B53', eoriLabel);
    addCell('D53', data.eoriNo, valueStyle); mergeCells('D53', 'H54');
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
    
    addCell('J65', 'Check'); addCell('K65', '', { ...valueStyle, ...centerAlign });

    addCell('B69', 'Debtor No Scope:');
    addCell('D69', data.debtorNoScope, yellowValueStyle); mergeCells('D69', 'H70');
    addCell('I69', 'Creditor No Scope:');
    addCell('K69', data.creditorNoScope, yellowValueStyle); mergeCells('K69', 'M70');
    
    // Empty Shipment section
    addCell('B71', 'Expected Type, Direction & Number of Shipments, Per Week / Month / Year:', boldFont); mergeCells('B71', 'M72');
    addCell('C73', 'Select', valueStyle); mergeCells('C73', 'D73');
    addCell('E73', 'Select', valueStyle); mergeCells('E73', 'F73');
    addCell('G73', 'Select', valueStyle); mergeCells('G73', 'H73');
    addCell('I73', '', yellowValueStyle); mergeCells('I73', 'M74');
    addCell('C75', 'Select', valueStyle); mergeCells('C75', 'D75');
    addCell('E75', 'Select', valueStyle); mergeCells('E75', 'F75');
    addCell('G75', 'Select', valueStyle); mergeCells('G75', 'H75');
    addCell('I75', '', yellowValueStyle); mergeCells('I75', 'M76');
    addCell('C77', 'Select', valueStyle); mergeCells('C77', 'D77');
    addCell('E77', 'Select', valueStyle); mergeCells('E77', 'F77');
    addCell('G77', 'Select', valueStyle); mergeCells('G77', 'H77');
    addCell('I77', '', yellowValueStyle); mergeCells('I77', 'M78');

    // Remarks & Agreement
    addCell('B80', 'Remarks:');
    addCell('D80', data.remarks, { ...valueStyle, alignment: { wrapText: true } }); mergeCells('D80', 'M86');
    addCell('B88', 'Agreement Mgmt:', boldFont);
    addCell('B90', 'Date:');
    addCell('D90', data.agreementDate, valueStyle); mergeCells('D90', 'H91');
    addCell('I90', 'Signature:');
    addCell('K90', data.signature, valueStyle); mergeCells('K90', 'M91');

    // --- Finalize and Download ---
    ws['!merges'] = merges;
    // Set the valid range for the worksheet, otherwise it may appear blank
    ws['!ref'] = 'A1:M95'; 
    ws['!cols'] = [
        { wch: 2 }, { wch: 15 }, { wch: 5 }, { wch: 15 }, { wch: 5 }, { wch: 15 }, 
        { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 5 }, { wch: 15 }, { wch: 5 }, { wch: 15 }
    ];
    ws['!rows'] = Array.from({length: 95}, () => ({ hpt: 15 })); // Default row height

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, 'Partner Card');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const filename = createFilename('Partner Card', data.companyName, data.date, 'xlsx');
    downloadFile(blob, filename);
};


export const exportToPDF = (data: FormData) => {
  const { jsPDF } = jspdf;
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // --- Helper Functions ---
  const drawSectionHeader = (text: string) => {
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setFillColor(224, 224, 224);
    doc.rect(margin, y - 10, pageWidth - margin * 2, 15, 'F');
    doc.text(text, pageWidth / 2, y, { align: 'center' });
    y += 25;
  };
  
  const drawCheckbox = (x: number, y: number, checked: boolean) => {
      doc.rect(x, y, 10, 10);
      if (checked) {
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.text('X', x + 2.5, y + 8.5);
          doc.setFont(undefined, 'normal'); // Reset font style
      }
  };

  const drawField = (label: string, value: string, xOffset = 0, customY?: number, labelWidth = 120) => {
    const currentY = customY || y;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(label, margin + xOffset, currentY);
    doc.setFont(undefined, 'normal');
    doc.setDrawColor(128, 128, 128);
    const valueX = margin + xOffset + labelWidth;
    const valueWidth = (pageWidth / 2) - margin - labelWidth - 10;
    doc.rect(valueX, currentY - 10, valueWidth, 15);
    doc.text(value || '', valueX + 5, currentY);
    if (!customY) {
      y += 25;
    }
  };

  // --- PDF Content ---

  // Header
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Red2Roast Partner Card', pageWidth / 2, y, { align: 'center' });
  y += 30;

  // Red2Roast Section
  drawSectionHeader('To be completed by Red2Roast');
  let red2RoastY = y;
  drawField('Date:', data.date, 0, red2RoastY);
  drawField('Request By:', data.requestBy, 0, red2RoastY + 25);
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('Role:', margin, red2RoastY + 50);
  doc.setFont(undefined, 'normal');
  doc.text('Debtor', margin + 80, red2RoastY + 50);
  drawCheckbox(margin + 120, red2RoastY + 42, data.role === 'debtor');
  doc.text('Creditor', margin + 150, red2RoastY + 50);
  drawCheckbox(margin + 200, red2RoastY + 42, data.role === 'creditor');

  y += 75;

  // Debtor/Creditor Section
  drawSectionHeader('To be completed by Debtor / Creditor');
  
  const col1X = 0;
  const col2X = pageWidth / 2 - margin;

  let startY = y;
  drawField('Company Name:', data.companyName, col1X, startY);
  drawField('Address:', data.address, col1X, startY + 25);
  drawField('City and State:', data.cityAndState, col1X, startY + 50);
  drawField('Post Code:', data.postCode, col1X, startY + 75);
  drawField('Country:', data.country, col1X, startY + 100);
  drawField('Phone:', data.phone, col1X, startY + 125);
  drawField('Website:', data.website, col1X, startY + 150);

  drawField('Invoice Address (If Other):', data.invoiceAddress, col2X, startY);
  drawField('City and State:', data.invoiceCityAndState, col2X, startY + 25);
  drawField('Post Code:', data.invoicePostCode, col2X, startY + 50);
  drawField('Country:', data.invoiceCountry, col2X, startY + 75);
  drawField('Invoice Language:', data.invoiceLanguage, col2X, startY + 100);
  drawField('Default Currency:', data.defaultCurrency, col2X, startY + 125);
  
  y = startY + 175;

  // Contacts
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  let contactY = y;
  doc.setFont(undefined, 'bold');
  doc.text('Contact general:', margin, contactY);
  contactY += 20;
  drawField('Name:', data.generalName, col1X, contactY);
  drawField('Title:', data.generalTitle, col1X, contactY + 25);
  drawField('Email:', data.generalEmail, col1X, contactY + 50);
  drawField('Phone:', data.generalPhone, col2X, contactY, 80);
  drawField('Mobile:', data.generalMobile, col2X, contactY + 25, 80);

  y = contactY + 80;
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  let financeY = y;
  doc.setFont(undefined, 'bold');
  doc.text('Contact Finance:', margin, financeY);
  financeY += 20;
  drawField('Name:', data.financeName, col1X, financeY);
  drawField('Title:', data.financeTitle, col1X, financeY + 25);
  drawField('Email:', data.financeEmail, col1X, financeY + 50);
  drawField('Phone:', data.financePhone, col2X, financeY, 80);
  drawField('Mobile:', data.financeMobile, col2X, financeY + 25, 80);

  y = financeY + 80;

  // Financial Info
  let financialY = y;
  const eoriLabel = data.eoriOrEin === 'eori' ? 'EORI Number (EU):' : 'EIN Number (US):';
  const accountLabel = data.accountIdentifierType === 'accountNo' ? 'Account Number:' : 'IBAN:';
  const swiftBicLabel = data.swiftOrBicType === 'swift' ? 'Swift Code:' : 'BIC:';
  const sortRoutingLabel = data.sortOrRoutingType === 'sort' ? 'Sort Code:' : 'Routing Number (ACH/Wire):';

  drawField('VAT Number (if applicable):', data.vatNo, col1X, financialY, 150);
  drawField('Company Registration Number:', data.companyRegNo, col1X, financialY + 25, 150);
  drawField(eoriLabel, data.eoriNo, col1X, financialY + 50, 150);

  drawField('Bank Name:', data.bankName, col2X, financialY, 150);
  drawField('Account Name:', data.accountName, col2X, financialY + 25, 150);
  drawField('Bank Address:', data.bankAddress, col2X, financialY + 50, 150);
  drawField(accountLabel, data.accountIdentifierValue, col2X, financialY + 75, 150);
  drawField(swiftBicLabel, data.swiftOrBicValue, col2X, financialY + 100, 150);
  drawField(sortRoutingLabel, data.sortOrRoutingValue, col2X, financialY + 125, 150);

  y = financialY + 155;
  // Credit Info
  drawField('Requested Credit Limit:', data.requestedCreditLimit, 0, y, 150);
  y += 25;
  drawField('Requested Payment Terms:', data.requestedPaymentTerms, 0, y, 150);
  y += 25;

  doc.addPage();
  y = margin;

  // Second page
  drawSectionHeader('To be completed by Red2Roast');
  doc.setFontSize(9);

  const drawCheckboxWithLabel = (label: string, isChecked: boolean, x: number, customY: number) => {
    drawCheckbox(x, customY - 8, isChecked);
    doc.text(label, x + 15, customY);
  };
  
  const colWidth = (pageWidth - margin * 2) / 4;
  const checkCol1X = margin;
  const checkCol2X = margin + colWidth;
  const checkCol3X = margin + colWidth * 2;
  const checkCol4X = margin + colWidth * 3;
  let checkboxStartY = y;

  // Column 1
  drawCheckboxWithLabel('POA', data.poa, checkCol1X, checkboxStartY);
  drawCheckboxWithLabel('Scope', data.scope, checkCol1X, checkboxStartY + 20);
  drawCheckboxWithLabel('GDPR', data.gdpr, checkCol1X, checkboxStartY + 40);

  // Column 2
  drawCheckboxWithLabel('Credit', data.credit, checkCol2X, checkboxStartY);
  drawCheckboxWithLabel('Company Registration', data.companyRegistration, checkCol2X, checkboxStartY + 20);
  drawCheckboxWithLabel('Passport', data.passport, checkCol2X, checkboxStartY + 40);
  
  // Column 3
  drawCheckboxWithLabel('Signed Quote', data.signedQuote, checkCol3X, checkboxStartY);
  drawCheckboxWithLabel('Highrise', data.highrise, checkCol3X, checkboxStartY + 20);
  drawCheckboxWithLabel('Credit Check', data.creditCheck, checkCol3X, checkboxStartY + 40);

  // Column 4
  drawCheckboxWithLabel('IT', data.it, checkCol4X, checkboxStartY);
  drawCheckboxWithLabel('Exact', data.exact, checkCol4X, checkboxStartY + 20);
  drawCheckboxWithLabel('Bank', data.bank, checkCol4X, checkboxStartY + 40);

  y = checkboxStartY + 65; // Adjust y to continue below the checkboxes
  
  drawField('Debtor No Scope:', data.debtorNoScope, 0, y, 150);
  y += 25;
  drawField('Creditor No Scope:', data.creditorNoScope, 0, y, 150);
  y += 25;
  drawField('Remarks:', data.remarks, 0, y, 150);
  
  y += 50;
  
  // Agreement
  doc.setFont(undefined, 'bold');
  doc.text('Agreement Management:', margin, y);
  y += 25;
  drawField('Date:', data.agreementDate, 0, y, 80);
  drawField('Signature:', data.signature, col2X, y, 80);

  const filename = createFilename('Partner Card', data.companyName, data.date, 'pdf');
  doc.save(filename);
};