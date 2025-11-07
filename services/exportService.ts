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
    const namePart = companyName?.trim() ? ` ${companyName.trim()}` : '';
    const datePart = date?.trim() ? ` ${date.trim()}` : '';
    return `${base}${namePart}${datePart}.${extension}`;
}

export const exportToCSV = (data: FormData) => {
  const headers = Object.keys(data).join(',');
  const values = Object.values(data).map(value => `"${value}"`).join(',');
  const csvContent = `${headers}\n${values}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = createFilename('Partner Card', data.companyName, data.date, 'csv');
  downloadFile(blob, filename);
};

export const exportToXLSX = (data: FormData) => {
  const worksheetData = Object.entries(data).map(([key, value]) => ({
    Field: key,
    Value: value,
  }));
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Partner Data');
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
  const eoriLabel = data.eoriOrEin === 'eori' ? 'EORI No (EU):' : 'EIN No (US):';
  const accountLabel = data.accountIdentifierType === 'accountNo' ? 'Account No.:' : 'IBAN:';
  const swiftBicLabel = data.swiftOrBicType === 'swift' ? 'Swift Code:' : 'BIC:';
  const sortRoutingLabel = data.sortOrRoutingType === 'sort' ? 'Sort Code:' : 'Routing No. (ACH/Wire):';

  drawField('VAT Number (if applicable):', data.vatNo, col1X, financialY, 150);
  drawField('Company Reg No:', data.companyRegNo, col1X, financialY + 25, 150);
  drawField(eoriLabel, data.eoriNo, col1X, financialY + 50, 150);

  drawField('Bank Name:', data.bankName, col2X, financialY, 150);
  drawField('Bank Address:', data.bankAddress, col2X, financialY + 25, 150);
  drawField(accountLabel, data.accountIdentifierValue, col2X, financialY + 50, 150);
  drawField(swiftBicLabel, data.swiftOrBicValue, col2X, financialY + 75, 150);
  drawField(sortRoutingLabel, data.sortOrRoutingValue, col2X, financialY + 100, 150);

  y = financialY + 130;
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