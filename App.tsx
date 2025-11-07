import React, { useState, useEffect } from 'react';
import { FormData } from './types';
import { exportToCSV, exportToPDF, exportToXLSX } from './services/exportService';

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
      className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
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
      className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 transition bg-white text-gray-900"
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
            className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
        />
        <label htmlFor={name as string} className="ml-2 block text-sm text-gray-900">{label}</label>
    </div>
);


const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [status, setStatus] = useState<'New' | 'Update'>('New');
  const [isInvoiceAddressSame, setInvoiceAddressSame] = useState(false);

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
              className="appearance-none bg-blue-100 text-blue-800 font-semibold pl-4 pr-8 py-1 rounded-md border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
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
                              className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
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
                    <InputField label="Company Reg No" name="companyRegNo" value={formData.companyRegNo} onChange={handleChange} />
                    <div>
                      <label className="mb-1 text-sm font-semibold text-gray-700 block">EORI No (EU) / EIN No (US)</label>
                      <div className="flex items-center space-x-4 mt-1 mb-2">
                          <div className="flex items-center">
                              <input type="radio" id="eori" name="eoriOrEin" value="eori" checked={formData.eoriOrEin === 'eori'} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"/>
                              <label htmlFor="eori" className="ml-2 block text-sm text-gray-900">EORI No (EU)</label>
                          </div>
                          <div className="flex items-center">
                              <input type="radio" id="ein" name="eoriOrEin" value="ein" checked={formData.eoriOrEin === 'ein'} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"/>
                              <label htmlFor="ein" className="ml-2 block text-sm text-gray-900">EIN No (US)</label>
                          </div>
                      </div>
                      <input id="eoriNo" name="eoriNo" type="text" value={formData.eoriNo} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 transition"/>
                    </div>
                    <InputField label="Requested Credit Limit" name="requestedCreditLimit" value={formData.requestedCreditLimit} onChange={handleChange} />
                    <InputField label="Requested Payment Terms (days)" name="requestedPaymentTerms" value={formData.requestedPaymentTerms} onChange={handleChange} type="number" />
                </div>
                <div className="space-y-4">
                    <InputField label="Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} />
                    <InputField label="Bank Address" name="bankAddress" value={formData.bankAddress} onChange={handleChange} />
                    <div>
                      <label className="mb-1 text-sm font-semibold text-gray-700 block">Account No. / IBAN</label>
                      <div className="flex items-center space-x-4 mt-1 mb-2">
                          <div className="flex items-center">
                              <input type="radio" id="accountNoRadio" name="accountIdentifierType" value="accountNo" checked={formData.accountIdentifierType === 'accountNo'} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"/>
                              <label htmlFor="accountNoRadio" className="ml-2 block text-sm text-gray-900">Account No.</label>
                          </div>
                          <div className="flex items-center">
                              <input type="radio" id="ibanRadio" name="accountIdentifierType" value="iban" checked={formData.accountIdentifierType === 'iban'} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"/>
                              <label htmlFor="ibanRadio" className="ml-2 block text-sm text-gray-900">IBAN</label>
                          </div>
                      </div>
                      <input name="accountIdentifierValue" value={formData.accountIdentifierValue} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 transition"/>
                    </div>
                    <div>
                        <label className="mb-1 text-sm font-semibold text-gray-700 block">Swift Code / BIC</label>
                        <div className="flex items-center space-x-4 mt-1 mb-2">
                            <div className="flex items-center">
                                <input type="radio" id="swiftRadio" name="swiftOrBicType" value="swift" checked={formData.swiftOrBicType === 'swift'} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"/>
                                <label htmlFor="swiftRadio" className="ml-2 block text-sm text-gray-900">Swift Code</label>
                            </div>
                            <div className="flex items-center">
                                <input type="radio" id="bicRadio" name="swiftOrBicType" value="bic" checked={formData.swiftOrBicType === 'bic'} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"/>
                                <label htmlFor="bicRadio" className="ml-2 block text-sm text-gray-900">BIC</label>
                            </div>
                        </div>
                        <input name="swiftOrBicValue" value={formData.swiftOrBicValue} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 transition"/>
                    </div>
                    <div>
                        <label className="mb-1 text-sm font-semibold text-gray-700 block">Sort Code / Routing No. (ACH/Wire)</label>
                        <div className="flex items-center space-x-4 mt-1 mb-2">
                            <div className="flex items-center">
                                <input type="radio" id="sortRadio" name="sortOrRoutingType" value="sort" checked={formData.sortOrRoutingType === 'sort'} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"/>
                                <label htmlFor="sortRadio" className="ml-2 block text-sm text-gray-900">Sort Code</label>
                            </div>
                            <div className="flex items-center">
                                <input type="radio" id="routingRadio" name="sortOrRoutingType" value="routing" checked={formData.sortOrRoutingType === 'routing'} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"/>
                                <label htmlFor="routingRadio" className="ml-2 block text-sm text-gray-900">Routing No.</label>
                            </div>
                        </div>
                        <input name="sortOrRoutingValue" value={formData.sortOrRoutingValue} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 transition"/>
                    </div>
                </div>
            </div>
          </section>
          
          {/* Section: To be completed by Red2Roast */}
          <section className="mb-8 p-4 border rounded-lg bg-gray-50">
            <h2 className="text-lg font-bold text-gray-700 mb-4 text-center bg-gray-200 p-2 rounded-md">To be completed by Red2Roast</h2>
            <div className="grid grid-cols-4 gap-x-8 gap-y-2 mb-4">
              {/* Column 1 */}
              <div className="space-y-2">
                <CheckboxField label="POA" name="poa" checked={formData.poa} onChange={handleChange} />
                <CheckboxField label="Scope" name="scope" checked={formData.scope} onChange={handleChange} />
                <CheckboxField label="GDPR" name="gdpr" checked={formData.gdpr} onChange={handleChange} />
              </div>
              {/* Column 2 */}
              <div className="space-y-2">
                <CheckboxField label="Credit" name="credit" checked={formData.credit} onChange={handleChange} />
                <CheckboxField label="Company Registration" name="companyRegistration" checked={formData.companyRegistration} onChange={handleChange} />
                <CheckboxField label="Passport" name="passport" checked={formData.passport} onChange={handleChange} />
              </div>
              {/* Column 3 */}
              <div className="space-y-2">
                <CheckboxField label="Signed Quote" name="signedQuote" checked={formData.signedQuote} onChange={handleChange} />
                <CheckboxField label="Highrise" name="highrise" checked={formData.highrise} onChange={handleChange} />
                <CheckboxField label="Credit Check" name="creditCheck" checked={formData.creditCheck} onChange={handleChange} />
              </div>
              {/* Column 4 */}
              <div className="space-y-2">
                <CheckboxField label="IT" name="it" checked={formData.it} onChange={handleChange} />
                <CheckboxField label="Exact" name="exact" checked={formData.exact} onChange={handleChange} />
                <CheckboxField label="Bank" name="bank" checked={formData.bank} onChange={handleChange} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
               <InputField label="Debtor No Scope" name="debtorNoScope" value={formData.debtorNoScope} onChange={handleChange} />
               <InputField label="Creditor No Scope" name="creditorNoScope" value={formData.creditorNoScope} onChange={handleChange} />
            </div>
          </section>

          {/* Section: Agreement */}
          <section className="p-4 border rounded-lg bg-gray-50">
              <h2 className="text-lg font-bold text-gray-700 mb-4">Agreement Management</h2>
              <div className="mb-4">
                <label htmlFor="remarks" className="mb-1 block text-sm font-semibold text-gray-700">Remarks</label>
                <textarea 
                  id="remarks"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 transition"
                ></textarea>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                  <InputField label="Date" name="agreementDate" value={formData.agreementDate} onChange={handleChange} type="date"/>
                  <InputField label="Signature" name="signature" value={formData.signature} onChange={handleChange} />
              </div>
          </section>

        </form>
        
        {/* Action Buttons */}
        <footer className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-center gap-4 sticky bottom-0 bg-white/80 backdrop-blur-sm py-4 -mb-8 -mx-8 px-8 rounded-b-xl">
            <button
              onClick={() => exportToCSV(formData)}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105"
            >
              Export as CSV
            </button>
            <button
              onClick={() => exportToXLSX(formData)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105"
            >
              Export as Excel
            </button>
            <button
              onClick={() => exportToPDF(formData)}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105"
            >
              Export as PDF
            </button>
        </footer>

      </div>
    </div>
  );
};

export default App;