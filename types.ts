export interface FormData {
  // Header Status
  status: 'New' | 'Update';

  // Red2Roast Section
  date: string;
  requestBy: 'Gert-Jan Dokter' | 'Jan Paul Douma';
  role: 'debtor' | 'creditor';
  
  // Debtor/Creditor Section
  companyName: string;
  address: string;
  cityAndState: string;
  postCode: string;
  country: string;
  phone: string;
  website: string;
  
  invoiceAddress: string;
  invoiceCityAndState: string;
  invoicePostCode: string;
  invoiceCountry: string;
  invoiceLanguage: string;
  defaultCurrency: string;

  // Contact General
  generalName: string;
  generalTitle: string;
  generalEmail: string;
  generalPhone: string;
  generalMobile: string;

  // Contact Finance
  financeName: string;
  financeTitle: string;
  financeEmail: string;
  financePhone: string;
  financeMobile: string;

  // Financial Info
  vatNo: string;
  companyRegNo: string;
  eoriOrEinType: 'eori' | 'ein';
  eoriOrEinValue: string;
  bankName: string;
  accountName: string;
  bankAddress: string;

  accountIdentifierType: 'accountNo' | 'iban';
  accountIdentifierValue: string;
  
  swiftOrBicType: 'swift' | 'bic';
  swiftOrBicValue: string;
  
  sortOrRoutingType: 'sort' | 'routing';
  sortOrRoutingValue: string;
  
  // Credit Info
  requestedCreditLimit: string;
  requestedPaymentTerms: string;

  // Red2Roast Completion Section - Individual Checkboxes
  poa: boolean;
  scope: boolean;
  gdpr: boolean;
  credit: boolean;
  companyRegistration: boolean;
  passport: boolean;
  signedQuote: boolean;
  highrise: boolean;
  creditCheck: boolean;
  it: boolean;
  exact: boolean;
  bank: boolean;

  debtorNoScope: string;
  creditorNoScope: string;
  
  // Agreement
  remarks: string;
  agreementDate: string;
  signature: string;
}