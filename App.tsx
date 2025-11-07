import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FormData } from './types';
import { exportToCSV, exportToPDF, exportToXLSX, exportToJSON } from './services/exportService';

const initialFormData: FormData = {
  date: '',
  requestBy: 'Gert-Jan Dokter',
  role: 'debtor',
  companyName: '',
  address: '',
  cityAndState: '',
  postCode: '',
  country: '',
  phone: '',
  website: '',
  invoiceAddress: '',
  invoiceCityAndState: '',
  invoicePostCode: '',
  invoiceCountry: '',
  invoiceLanguage: 'English',
  defaultCurrency: 'United States Dollars (USD)',
  generalName: '',
  generalTitle: '',
  generalEmail: '',
  generalPhone: '',
  generalMobile: '',
  financeName: '',
  financeTitle: '',
  financeEmail: '',
  financePhone: '',
  financeMobile: '',
  vatNo: '',
  companyRegNo: '',
  eoriOrEin: 'eori',
  eoriNo: '',
  bankName: '',
  accountName: '',
  bankAddress: '',
  accountIdentifierType: 'accountNo',
  accountIdentifierValue: '',
  swiftOrBicType: 'swift',
  swiftOrBicValue: '',
  sortOrRoutingType: 'sort',
  sortOrRoutingValue: '',
  requestedCreditLimit: '',
  requestedPaymentTerms: '',
  poa: false,
  scope: false,
  gdpr: false,
  credit: false,
  companyRegistration: false,
  passport: false,
  signedQuote: false,
  highrise: false,
  creditCheck: false,
  it: false,
  exact: false,
  bank: false,
  debtorNoScope: '',
  creditorNoScope: '',
  remarks: '',
  agreementDate: '',
  signature: '',
};

// Reusable Input Component
interface InputProps {
  label: string;
  name: keyof FormData | string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}

const InputField: React.FC<InputProps> = ({ label, name, value, onChange, type = 'text', required = false, disabled = false }) => (
  <div className="flex flex-col">
    {label && <label htmlFor={name as string} className="mb-1 text-sm font-semibold text-gray-700">{label}</label>}
    <input
      id={name as string}
      name={name as string}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:border-red-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
    />
  </div>
);

// Reusable Select Component
interface SelectProps {
  label: string;
  name: keyof FormData;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}

const SelectField: React.FC<SelectProps> = ({ label, name, value, onChange, options, required = false }) => (
  <div className="flex flex-col">
    <label htmlFor={name} className="mb-1 text-sm font-semibold text-gray-700">{label}</label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:border-red-500 transition bg-white text-gray-900"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
);


// Reusable Checkbox Component
interface CheckboxProps {
    label: string;
    name: keyof FormData | string; // Allow string for flexibility
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CheckboxField: React.FC<CheckboxProps> = ({ label, name, checked, onChange }) => (
    <div className="flex items-center">
        <input
            type="checkbox"
            id={name as string}
            name={name as string}
            checked={checked}
            onChange={onChange}
            className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        />
        <label htmlFor={name as string} className="ml-2 block text-sm text-gray-900">{label}</label>
    </div>
);


const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [status, setStatus] = useState<'New' | 'Update'>('New');
  const [isInvoiceAddressSame, setInvoiceAddressSame] = useState(false);
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // On initial render, check if a session exists but do not load it automatically
  useEffect(() => {
    const savedData = localStorage.getItem('partnerFormData');
    if (savedData) {
      setHasSavedSession(true);
    }
  }, []);

  const handleSave = useCallback(() => {
    localStorage.setItem('partnerFormData', JSON.stringify(formData));
    setShowSaveMessage(true);
    setHasSavedSession(true); // Ensure session state is updated on save
    setTimeout(() => {
        setShowSaveMessage(false);
    }, 3000);
  }, [formData]);

  // Add keyboard shortcut for saving
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSave]);


  useEffect(() => {
    if (isInvoiceAddressSame) {
      setFormData(prev => ({
        ...prev,
        invoiceAddress: prev.address,
        invoiceCityAndState: prev.cityAndState,
        invoicePostCode: prev.postCode,
        invoiceCountry: prev.country,
      }));
    }
  }, [isInvoiceAddressSame, formData.address, formData.cityAndState, formData.postCode, formData.country]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value as 'New' | 'Update');
  };

  const handleSameAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setInvoiceAddressSame(isChecked);
    if (!isChecked) {
        setFormData(prev => ({
            ...prev,
            invoiceAddress: '',
            invoiceCityAndState: '',
            invoicePostCode: '',
            invoiceCountry: '',
        }));
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the form? This will remove any saved progress and cannot be undone.')) {
      setFormData(initialFormData);
      setStatus('New');
      setInvoiceAddressSame(false);
      localStorage.removeItem('partnerFormData');
      setHasSavedSession(false);
    }
  };

  const handleRetrieve = () => {
    const savedData = localStorage.getItem('partnerFormData');
    if (savedData) {
      setFormData(JSON.parse(savedData));
      setHasSavedSession(false); // Hide the button after use
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) throw new Error("File is empty");
        
        const importedData = JSON.parse(content);

        // Basic validation
        if (typeof importedData.companyName !== 'string' || typeof importedData.date !== 'string' || typeof importedData.role !== 'string') {
          throw new Error("JSON file does not match the required format.");
        }
        
        setFormData(importedData);
        alert('Data imported successfully!');

      } catch (error) {
        console.error("Failed to import JSON file:", error);
        alert(`Error importing file: ${error instanceof Error ? error.message : 'Invalid file format.'}`);
      }
    };
    
    reader.onerror = () => {
      console.error("Error reading file:", reader.error);
      alert("An error occurred while reading the file.");
    };

    reader.readAsText(file);

    // Reset input value to allow re-importing the same file
    if (e.target) e.target.value = '';
  };


  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        
        <header className="flex items-start justify-between mb-6 pb-4 border-b">
          <div className="flex items-center">
            <svg className="w-16 h-16 text-red-600 mr-4" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M50 100C77.6142 100 100 77.6142 100 50C100 22.3858 77.6142 0 50 0C22.3858 0 0 22.3858 0 50C0 77.6142 22.3858 100 50 100ZM50 88C70.9868 88 88 70.9868 88 50C88 29.0132 70.9868 12 50 12C29.0132 12 12 29.0132 12 50C12 70.9868 29.0132 88 50 88ZM60 40C60 45.5228 55.5228 50 50 50C44.4772 50 40 45.5228 40 40C40 34.4772 44.4772 30 50 30C55.5228 30 60 34.4772 60 40ZM50 55C63.8071 55 75 66.1929 75 80H25C25 66.1929 36.1929 55 50 55Z"/>
            </svg>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Red2Roast Partner Card</h1>
              <p className="text-gray-500">Partner Onboarding Information</p>
            </div>
          </div>
          <div className="relative">
            <select
              id="form-status"
              value={status}
              onChange={handleStatusChange}
              className="appearance-none bg-blue-100 text-blue-800 font-semibold pl-4 pr-8 py-1 rounded-md border border-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 cursor-pointer"
              aria-label="Form status"
            >
              <option value="New">New</option>
              <option value="Update">Update</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-800">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
            </div>
          </div>
        </header>

        <form onSubmit={(e) => e.preventDefault()}>
          {/* Section: To be completed by Red2Roast */}
          <section className="mb-8 p-4 border rounded-lg bg-gray-50">
            <h2 className="text-lg font-bold text-gray-700 mb-4 text-center bg-gray-200 p-2 rounded-md">To be completed by Red2Roast</h2>
            <div className="grid md:grid-cols-3 gap-6 items-end">
              <InputField label="Date" name="date" value={formData.date} onChange={handleChange} type="date" />
              <SelectField 
                label="Request By" 
                name="requestBy" 
                value={formData.requestBy} 
                onChange={handleChange}
                options={[
                    { value: 'Gert-Jan Dokter', label: 'Gert-Jan Dokter' },
                    { value: 'Jan Paul Douma', label: 'Jan Paul Douma' }
                ]} 
              />
              <SelectField 
                label="Role" 
                name="role" 
                value={formData.role} 
                onChange={handleChange}
                options={[
                    { value: 'debtor', label: 'Debtor' },
                    { value: 'creditor', label: 'Creditor' }
                ]} 
              />
            </div>
          </section>

          {/* Section: To be completed by Debtor / Creditor */}
          <section className="mb-8 p-4 border rounded-lg bg-gray-50">
            <h2 className="text-lg font-bold text-gray-700 mb-4 text-center bg-gray-200 p-2 rounded-md">To be completed by Debtor / Creditor</h2>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
              {/* Left Column */}
              <div className="space-y-4">
                <InputField label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} required />
                <InputField label="Address" name="address" value={formData.address} onChange={handleChange} />
                <InputField label="City and State" name="cityAndState" value={formData.cityAndState} onChange={handleChange} />
                <InputField label="Post Code" name="postCode" value={formData.postCode} onChange={handleChange} />
                <InputField label="Country" name="country" value={formData.country} onChange={handleChange} />
                <InputField label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
                <InputField label="Website" name="website" value={formData.website} onChange={handleChange} />
              </div>
              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-semibold text-gray-700">Invoice Address (If Other)</label>
                      <div className="flex items-center">
                          <input
                              type="checkbox"
                              id="sameAsAddress"
                              checked={isInvoiceAddressSame}
                              onChange={handleSameAddressChange}
                              className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          />
                          <label htmlFor="sameAsAddress" className="ml-2 block text-sm text-gray-900">Same as address</label>
                      </div>
                  </div>
                  <InputField label="" name="invoiceAddress" value={formData.invoiceAddress} onChange={handleChange} disabled={isInvoiceAddressSame} />
                </div>
                <InputField label="City and State" name="invoiceCityAndState" value={formData.invoiceCityAndState} onChange={handleChange} disabled={isInvoiceAddressSame} />
                <InputField label="Post Code" name="invoicePostCode" value={formData.invoicePostCode} onChange={handleChange} disabled={isInvoiceAddressSame} />
                <InputField label="Country" name="invoiceCountry" value={formData.invoiceCountry} onChange={handleChange} disabled={isInvoiceAddressSame} />
                <SelectField 
                    label="Invoice Language" 
                    name="invoiceLanguage" 
                    value={formData.invoiceLanguage} 
                    onChange={handleChange}
                    options={[
                        { value: 'English', label: 'English' },
                        { value: 'Dutch', label: 'Dutch' }
                    ]} 
                />
                <SelectField 
                    label="Default Currency" 
                    name="defaultCurrency" 
                    value={formData.defaultCurrency} 
                    onChange={handleChange}
                    options={[
                        { value: 'United States Dollars (USD)', label: 'United States Dollars (USD)' },
                        { value: 'Euros (EUR)', label: 'Euros (EUR)' },
                        { value: 'Ugandan Shillings (UGX)', label: 'Ugandan Shillings (UGX)' }
                    ]} 
                />
              </div>
            </div>
            
            <hr className="my-6"/>

            {/* Contacts */}
            <div className="grid md:grid-cols-2 gap-x-8">
              <div className="space-y-4">
                  <h3 className="text-md font-bold text-gray-600 mt-2 border-b pb-1">Contact General</h3>
                  <InputField label="Name" name="generalName" value={formData.generalName} onChange={handleChange} />
                  <InputField label="Title" name="generalTitle" value={formData.generalTitle} onChange={handleChange} />
                  <InputField label="Email" name="generalEmail" value={formData.generalEmail} onChange={handleChange} type="email" />
              </div>
              <div className="space-y-4 md:mt-10">
                  <InputField label="Phone" name="generalPhone" value={formData.generalPhone} onChange={handleChange} />
                  <InputField label="Mobile" name="generalMobile" value={formData.generalMobile} onChange={handleChange} />
              </div>
            </div>

            <hr className="my-6"/>
            
            <div className="grid md:grid-cols-2 gap-x-8">
              <div className="space-y-4">
                  <h3 className="text-md font-bold text-gray-600 mt-2 border-b pb-1">Contact Finance</h3>
                  <InputField label="Name" name="financeName" value={formData.financeName} onChange={handleChange} />
                  <InputField label="Title" name="financeTitle" value={formData.financeTitle} onChange={handleChange} />
                  <InputField label="Email" name="financeEmail" value={formData.financeEmail} onChange={handleChange} type="email" />
              </div>
              <div className="space-y-4 md:mt-10">
                  <InputField label="Phone" name="financePhone" value={formData.financePhone} onChange={handleChange} />
                  <InputField label="Mobile" name="financeMobile" value={formData.financeMobile} onChange={handleChange} />
              </div>
            </div>

            <hr className="my-6"/>

            {/* Financials */}
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-4">
                    <InputField label="VAT Number (if applicable)" name="vatNo" value={formData.vatNo} onChange={handleChange} />
                    <InputField label="Company Registration Number" name="companyRegNo" value={formData.companyRegNo} onChange={handleChange} />
                    <div>
                      <div className="flex items-center space-x-4 mb-2">
                          <div className="flex items-center">
                              <input type="radio" id="eori" name="eoriOrEin" value="eori" checked={formData.eoriOrEin === 'eori'} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"/>
                              <label htmlFor="eori" className="ml-2 block text-sm text-gray-900">EORI Number (EU)</label>
                          </div>
                          <div className="flex items-center">
                              <input type="radio" id="ein" name="eoriOrEin" value="ein" checked={formData.eoriOrEin === 'ein'} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"/>
                              <label htmlFor="ein" className="ml-2 block text-sm text-gray-900">EIN Number (US)</label>
                          </div>
                      </div>
                      <input id="eoriNo" name="eoriNo" type="text" value={formData.eoriNo} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:border-red-500 transition"/>
                    </div>
                    <InputField label="Requested Credit Limit" name="requestedCreditLimit" value={formData.requestedCreditLimit} onChange={handleChange} />
                    <InputField label="Requested Payment Terms (days)" name="requestedPaymentTerms" value={formData.requestedPaymentTerms} onChange={handleChange} type="number" />
                </div>
                <div className="space-y-4">
                    <InputField label="Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} />
                    <InputField label="Account Name" name="accountName" value={formData.accountName} onChange={handleChange} />
                    <InputField label="Bank Address" name="bankAddress" value={formData.bankAddress} onChange={handleChange} />
                    <div>
                      <div className="flex items-center space-x-4 mb-2">
                          <div className="flex items-center">
                              <input type="radio" id="accountNoRadio" name="accountIdentifierType" value="accountNo" checked={formData.accountIdentifierType === 'accountNo'} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"/>
                              <label htmlFor="accountNoRadio" className="ml-2 block text-sm text-gray-900">Account Number</label>
                          </div>
                          <div className="flex items-center">
                              <input type="radio" id="ibanRadio" name="accountIdentifierType" value="iban" checked={formData.accountIdentifierType === 'iban'} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"/>
                              <label htmlFor="ibanRadio" className="ml-2 block text-sm text-gray-900">IBAN</label>
                          </div>
                      </div>
                      <input name="accountIdentifierValue" value={formData.accountIdentifierValue} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:border-red-500 transition"/>
                    </div>
                    <div>
                        <div className="flex items-center space-x-4 mb-2">
                            <div className="flex items-center">
                                <input type="radio" id="swiftRadio" name="swiftOrBicType" value="swift" checked={formData.swiftOrBicType === 'swift'} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"/>
                                <label htmlFor="swiftRadio" className="ml-2 block text-sm text-gray-900">Swift Code</label>
                            </div>
                            <div className="flex items-center">
                                <input type="radio" id="bicRadio" name="swiftOrBicType" value="bic" checked={formData.swiftOrBicType === 'bic'} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"/>
                                <label htmlFor="bicRadio" className="ml-2 block text-sm text-gray-900">BIC</label>
                            </div>
                        </div>
                        <input name="swiftOrBicValue" value={formData.swiftOrBicValue} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:border-red-500 transition"/>
                    </div>
                    <div>
                        <div className="flex items-center space-x-4 mb-2">
                            <div className="flex items-center">
                                <input type="radio" id="sortRadio" name="sortOrRoutingType" value="sort" checked={formData.sortOrRoutingType === 'sort'} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"/>
                                <label htmlFor="sortRadio" className="ml-2 block text-sm text-gray-900">Sort Code</label>
                            </div>
                            <div className="flex items-center">
                                <input type="radio" id="routingRadio" name="sortOrRoutingType" value="routing" checked={formData.sortOrRoutingType === 'routing'} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"/>
                                <label htmlFor="routingRadio" className="ml-2 block text-sm text-gray-900">Routing Number (ACH/Wire)</label>
                            </div>
                        </div>
                        <input name="sortOrRoutingValue" value={formData.sortOrRoutingValue} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:border-red-500 transition"/>
                    </div>
                </div>
            </div>
          </section>

          {/* Section: To be completed by Red2Roast - Internal */}
          <section className="mb-8 p-4 border rounded-lg bg-gray-50">
            <h2 className="text-lg font-bold text-gray-700 mb-4 text-center bg-gray-200 p-2 rounded-md">To be completed by Red2Roast (Internal)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
                <div className="space-y-4">
                    <CheckboxField label="POA" name="poa" checked={formData.poa} onChange={handleChange} />
                    <CheckboxField label="Scope" name="scope" checked={formData.scope} onChange={handleChange} />
                    <CheckboxField label="GDPR" name="gdpr" checked={formData.gdpr} onChange={handleChange} />
                </div>
                <div className="space-y-4">
                    <CheckboxField label="Credit" name="credit" checked={formData.credit} onChange={handleChange} />
                    <CheckboxField label="Company Registration" name="companyRegistration" checked={formData.companyRegistration} onChange={handleChange} />
                    <CheckboxField label="Passport" name="passport" checked={formData.passport} onChange={handleChange} />
                </div>
                <div className="space-y-4">
                    <CheckboxField label="Signed Quote" name="signedQuote" checked={formData.signedQuote} onChange={handleChange} />
                    <CheckboxField label="Highrise" name="highrise" checked={formData.highrise} onChange={handleChange} />
                    <CheckboxField label="Credit Check" name="creditCheck" checked={formData.creditCheck} onChange={handleChange} />
                </div>
                <div className="space-y-4">
                    <CheckboxField label="IT" name="it" checked={formData.it} onChange={handleChange} />
                    <CheckboxField label="Exact" name="exact" checked={formData.exact} onChange={handleChange} />
                    <CheckboxField label="Bank" name="bank" checked={formData.bank} onChange={handleChange} />
                </div>
            </div>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 mt-6">
                <InputField label="Debtor No Scope" name="debtorNoScope" value={formData.debtorNoScope} onChange={handleChange} />
                <InputField label="Creditor No Scope" name="creditorNoScope" value={formData.creditorNoScope} onChange={handleChange} />
            </div>
          </section>

          {/* Remarks and Agreement */}
          <section className="mb-8 p-4 border rounded-lg bg-gray-50">
            <h2 className="text-lg font-bold text-gray-700 mb-4 text-center bg-gray-200 p-2 rounded-md">Remarks & Agreement</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="remarks" className="mb-1 text-sm font-semibold text-gray-700">Remarks</label>
                    <textarea
                        id="remarks"
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        rows={4}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:border-red-500 transition"
                    />
                </div>
                <div className="grid md:grid-cols-2 gap-x-8">
                    <InputField label="Date" name="agreementDate" value={formData.agreementDate} onChange={handleChange} type="date" />
                    <InputField label="Signature" name="signature" value={formData.signature} onChange={handleChange} />
                </div>
            </div>
          </section>

          {/* Action Buttons */}
          <footer className="mt-8 pt-6 border-t flex flex-wrap items-center justify-center gap-4">
            <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition">
              Save Progress
            </button>
            <button onClick={handleClear} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-md shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition">
              Clear Form
            </button>
            {hasSavedSession && (
                <div className="flex items-center gap-2 p-2 bg-teal-50 border border-teal-200 rounded-md">
                    <span className="text-sm font-medium text-teal-800">Saved session found.</span>
                    <button onClick={handleRetrieve} className="px-4 py-1 bg-teal-600 text-white font-semibold rounded-md shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition text-sm">
                        Retrieve
                    </button>
                </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept="application/json"
              className="hidden"
              aria-hidden="true"
            />
            <button onClick={handleImportClick} className="px-6 py-2 bg-yellow-500 text-white font-semibold rounded-md shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition">
              Import JSON
            </button>
            <button onClick={() => exportToJSON(formData)} className="px-6 py-2 bg-yellow-500 text-white font-semibold rounded-md shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition">
              Export JSON
            </button>
            <button onClick={() => exportToCSV(formData)} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition">
              Export as CSV
            </button>
            <button onClick={() => exportToXLSX(formData)} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">
              Export as Excel
            </button>
            <button onClick={() => exportToPDF(formData)} className="px-6 py-2 bg-red-600 text-white font-semibold rounded-md shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition">
              Export as PDF
            </button>
          </footer>

          {showSaveMessage && (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-xl transition-opacity duration-300 animate-pulse">
              Progress saved!
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default App;