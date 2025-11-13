import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FormData } from './types';
import { exportToCSV, exportToPDF, exportToXLSX, exportToJSON } from './services/exportService';

// ==================================================================================
//
//  FORM CONTROL & UI COMPONENTS
//  Reusable, generic components for building the form.
//
// ==================================================================================

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <section className="mb-8 p-4 border rounded-lg bg-gray-50">
    <h2 className="text-lg font-bold text-gray-700 mb-4 text-center bg-gray-200 p-2 rounded-md">{title}</h2>
    {children}
  </section>
);

interface InputProps {
  label?: string;
  name: keyof FormData | string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const InputField: React.FC<InputProps> = ({ label, name, value, onChange, type = 'text', required = false, disabled = false, className = '' }) => (
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
      className={`p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:border-red-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500 ${className}`}
    />
  </div>
);

interface SelectProps {
  label: string;
  name: keyof FormData;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  className?: string;
}

const SelectField: React.FC<SelectProps> = ({ label, name, value, onChange, options, required = false, className = '' }) => (
  <div className="flex flex-col">
    <label htmlFor={name} className="mb-1 text-sm font-semibold text-gray-700">{label}</label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={`p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:border-red-500 transition bg-white text-gray-900 ${className}`}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
);

interface CheckboxProps {
    label: string;
    name: keyof FormData | string;
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

interface RadioGroupWithInputProps {
  namePrefix: 'accountIdentifier' | 'swiftOrBic' | 'sortOrRouting' | 'eoriOrEin';
  options: { value: string, label: string }[];
  formData: FormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RadioGroupWithInput: React.FC<RadioGroupWithInputProps> = ({ namePrefix, options, formData, handleChange }) => {
    const typeName = `${namePrefix}Type` as keyof FormData;
    const valueName = `${namePrefix}Value` as keyof FormData;

    return (
        <div>
            <div className="flex items-center space-x-4 mb-2">
                {options.map(({ value, label }) => (
                    <div key={value} className="flex items-center">
                        <input
                            type="radio"
                            id={`${namePrefix}-${value}`}
                            name={typeName}
                            value={value}
                            checked={String(formData[typeName]) === value}
                            onChange={handleChange}
                            className="h-4 w-4 text-red-600 border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        />
                        <label htmlFor={`${namePrefix}-${value}`} className="ml-2 block text-sm text-gray-900">{label}</label>
                    </div>
                ))}
            </div>
            <InputField
                name={valueName}
                value={String(formData[valueName])}
                onChange={handleChange}
                className="w-full"
            />
        </div>
    );
};


// ==================================================================================
//
//  SECTION COMPONENTS
//  Components that represent logical sections of the form.
//
// ==================================================================================

interface ContactSectionProps {
  title: string;
  type: 'general' | 'finance';
  formData: FormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ContactSection: React.FC<ContactSectionProps> = ({ title, type, formData, handleChange }) => {
  const fieldName = (field: string) => `${type}${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof FormData;

  return (
    <>
      <hr className="my-6 col-span-2"/>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-md font-bold text-gray-600 mt-2 border-b pb-1">{title}</h3>
          <InputField label="Name" name={fieldName('name')} value={String(formData[fieldName('name')])} onChange={handleChange} />
          <InputField label="Title" name={fieldName('title')} value={String(formData[fieldName('title')])} onChange={handleChange} />
          <InputField label="Email" name={fieldName('email')} value={String(formData[fieldName('email')])} onChange={handleChange} type="email" />
        </div>
        <div className="space-y-4 md:mt-10">
          <InputField label="Phone" name={fieldName('phone')} value={String(formData[fieldName('phone')])} onChange={handleChange} />
          <InputField label="Mobile" name={fieldName('mobile')} value={String(formData[fieldName('mobile')])} onChange={handleChange} />
        </div>
      </div>
    </>
  );
};

// ==================================================================================
//
//  CONSTANTS
//  Initial state and static data for the form.
//
// ==================================================================================

const initialFormData: FormData = {
  status: 'New', date: '', requestBy: 'Gert-Jan Dokter', role: 'debtor', companyName: '', address: '',
  cityAndState: '', postCode: '', country: '', phone: '', website: '', invoiceAddress: '',
  invoiceCityAndState: '', invoicePostCode: '', invoiceCountry: '', invoiceLanguage: 'English',
  defaultCurrency: 'United States Dollars (USD)', generalName: '', generalTitle: '', generalEmail: '',
  generalPhone: '', generalMobile: '', financeName: '', financeTitle: '', financeEmail: '',
  financePhone: '', financeMobile: '', vatNo: '', companyRegNo: '', eoriOrEinType: 'eori',
  eoriOrEinValue: '', bankName: '', accountName: '', bankAddress: '', accountIdentifierType: 'accountNo',
  accountIdentifierValue: '', swiftOrBicType: 'swift', swiftOrBicValue: '', sortOrRoutingType: 'sort',
  sortOrRoutingValue: '', requestedCreditLimit: '', requestedPaymentTerms: '', poa: false,
  scope: false, gdpr: false, credit: false, companyRegistration: false, passport: false,
  signedQuote: false, highrise: false, creditCheck: false, it: false, exact: false, bank: false,
  debtorNoScope: '', creditorNoScope: '', remarks: '', agreementDate: '', signature: '',
};
Object.freeze(initialFormData); // Make the initial state truly immutable

const constants = {
  logoBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABdklEQVR4Xu2ZsQ3DMAxF3QiYSUiYQUiYQUiYSUiYQUiYQZCEkYQJSBigspRIkmy/yj/gKo4i/Xl2N5Nn//w4dHx8vGehYJWjRjO2ADsA+wB7AIeS3kQwykLgVwJshh3gI8B3gG+S3gwyloVgr8BuhgP8DPAZ4DOkNwN5pgywFphhL8B3gC8B3iS9GWSsYcBugm07gP8AfgZ8lvRmkLHGA7sJtq0D/gX4GfBb0ptBhhq9gG3bBH8A/gx4LelNIEOtfsBubBP8Dfgy4PekN4EMtbEB2AfsAZySvA1kLGEGsAqwgH8Cfkp6M8hYwgRgicAC/gX4KelNIWMJE4AlAAv4L8BPSW8KGUsYASwDWMAfgb8lvSlkLGEAsARgAf8E/Jb0ppCxho3AagCL+A3gp6Q3hYw1bgBWAFjAbwE/Jb0pZKwBHsBWgAX8NvBT0ptCxgresAF2AzYAW5LeDTKWEA5YBDgAWJL0bpCxBOGAOcABwJOkdwMZYwE/AYy3x8fH++ce/wBfqpdnNnS2AAAAAABJRU5ErkJggg=='
};

// ==================================================================================
//
//  MAIN APP COMPONENT
//  The main application component that orchestrates the form.
//
// ==================================================================================

const App: React.FC = () => {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [isInvoiceAddressSame, setIsInvoiceAddressSame] = useState(false);
    const logoBase64Ref = useRef(constants.logoBase64);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            date: new Date().toISOString().split('T')[0]
        }));
    }, []);

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


    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: finalValue,
        }));
    }, []);

    const handleSameAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsInvoiceAddressSame(e.target.checked);
    };

    const handleExport = (format: 'csv' | 'json' | 'xlsx' | 'pdf') => {
        switch (format) {
            case 'csv':
                exportToCSV(formData);
                break;
            case 'json':
                exportToJSON(formData);
                break;
            case 'xlsx':
                exportToXLSX(formData);
                break;
            case 'pdf':
                exportToPDF(formData, logoBase64Ref.current);
                break;
        }
    };
    
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target?.result;
                if (typeof json === 'string') {
                    const importedData = JSON.parse(json);
                    setFormData({ ...initialFormData, ...importedData });
                    alert('Data imported successfully!');
                }
            } catch (error) {
                console.error("Failed to parse JSON file:", error);
                alert('Failed to import data. Please check if the file is a valid JSON.');
            }
        };
        reader.onerror = (error) => {
             console.error("Failed to read file:", error);
             alert('Failed to read the selected file.');
        };
        reader.readAsText(file);
        
        e.target.value = ''; 
    };

    const statusColorClass = formData.status === 'New' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';

    return (
        <div className="container mx-auto p-8 bg-gray-100 font-sans">
            <main className="bg-white p-8 rounded-lg shadow-2xl">
                 <header className="flex items-center justify-between mb-8 pb-4 border-b">
                    <div className="flex items-center">
                        <img src={constants.logoBase64} alt="Red2Roast Logo" className="h-12 w-12 mr-4" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Partner Onboarding Form</h1>
                            <p className="text-sm text-gray-500">A digital version of the Red2Roast Partner Card</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <label htmlFor="status" className="mr-2 font-semibold text-sm text-gray-600">Status:</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className={`py-1 px-3 border border-gray-300 rounded-full text-sm font-semibold shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition ${statusColorClass}`}
                        >
                            <option value="New">New</option>
                            <option value="Update">Update</option>
                        </select>
                    </div>
                </header>

                <form onSubmit={(e) => e.preventDefault()}>
                    <Section title="To be completed by Red2Roast">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InputField label="Date" name="date" type="date" value={formData.date} onChange={handleChange} required />
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
                    </Section>

                    <Section title="To be completed by Debtor / Creditor">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                            <div className="space-y-4">
                                <InputField label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} required />
                                <InputField label="Address" name="address" value={formData.address} onChange={handleChange} required />
                                <InputField label="City and State" name="cityAndState" value={formData.cityAndState} onChange={handleChange} required />
                                <InputField label="Post Code" name="postCode" value={formData.postCode} onChange={handleChange} required />
                                <InputField label="Country" name="country" value={formData.country} onChange={handleChange} required />
                                <InputField label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
                                <InputField label="Website" name="website" value={formData.website} onChange={handleChange} />
                            </div>
                            <div className="space-y-4 bg-blue-50 p-4 rounded-md border border-blue-200">
                                 <CheckboxField
                                    label="Invoice address is same as company address"
                                    name="isInvoiceAddressSame"
                                    checked={isInvoiceAddressSame}
                                    onChange={handleSameAddressChange}
                                />
                                <InputField label="Invoice Address" name="invoiceAddress" value={formData.invoiceAddress} onChange={handleChange} disabled={isInvoiceAddressSame} />
                                <InputField label="Invoice City and State" name="invoiceCityAndState" value={formData.invoiceCityAndState} onChange={handleChange} disabled={isInvoiceAddressSame} />
                                <InputField label="Invoice Post Code" name="invoicePostCode" value={formData.invoicePostCode} onChange={handleChange} disabled={isInvoiceAddressSame} />
                                <InputField label="Invoice Country" name="invoiceCountry" value={formData.invoiceCountry} onChange={handleChange} disabled={isInvoiceAddressSame} />
                                <InputField label="Invoice Language" name="invoiceLanguage" value={formData.invoiceLanguage} onChange={handleChange} />
                                <InputField label="Default Currency" name="defaultCurrency" value={formData.defaultCurrency} onChange={handleChange} />
                            </div>
                        </div>

                        <ContactSection title="Contact General" type="general" formData={formData} handleChange={handleChange} />
                        <ContactSection title="Contact Finance" type="finance" formData={formData} handleChange={handleChange} />
                    </Section>
                    
                    <Section title="Financial Information">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                            <div className="space-y-4">
                                 <InputField label="VAT Number (if applicable)" name="vatNo" value={formData.vatNo} onChange={handleChange} />
                                 <InputField label="Company Registration Number" name="companyRegNo" value={formData.companyRegNo} onChange={handleChange} />
                                 <RadioGroupWithInput namePrefix="eoriOrEin" options={[{value: 'eori', label: 'EORI Number (EU)'}, {value: 'ein', label: 'EIN Number (US)'}]} formData={formData} handleChange={handleChange} />
                            </div>
                            <div className="space-y-4 bg-blue-50 p-4 rounded-md border border-blue-200">
                                <h3 className="text-md font-semibold text-gray-700">Bank Details</h3>
                                <InputField label="Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} />
                                <InputField label="Account Name" name="accountName" value={formData.accountName} onChange={handleChange} />
                                <InputField label="Bank Address" name="bankAddress" value={formData.bankAddress} onChange={handleChange} />
                                <RadioGroupWithInput namePrefix="accountIdentifier" options={[{value: 'accountNo', label: 'Account Number'}, {value: 'iban', label: 'IBAN'}]} formData={formData} handleChange={handleChange} />
                                <RadioGroupWithInput namePrefix="swiftOrBic" options={[{value: 'swift', label: 'Swift Code'}, {value: 'bic', label: 'BIC'}]} formData={formData} handleChange={handleChange} />
                                <RadioGroupWithInput namePrefix="sortOrRouting" options={[{value: 'sort', label: 'Sort Code'}, {value: 'routing', label: 'Routing Number (ACH/Wire)'}]} formData={formData} handleChange={handleChange} />
                            </div>
                        </div>
                    </Section>

                    <Section title="Credit Information">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Requested Credit Limit" name="requestedCreditLimit" value={formData.requestedCreditLimit} onChange={handleChange} />
                            <InputField label="Requested Payment Terms" name="requestedPaymentTerms" value={formData.requestedPaymentTerms} onChange={handleChange} />
                        </div>
                    </Section>
                    
                    <Section title="To be completed by Red2Roast (Internal)">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            <CheckboxField label="POA" name="poa" checked={formData.poa} onChange={handleChange} />
                            <CheckboxField label="Scope" name="scope" checked={formData.scope} onChange={handleChange} />
                            <CheckboxField label="GDPR" name="gdpr" checked={formData.gdpr} onChange={handleChange} />
                            <CheckboxField label="Credit" name="credit" checked={formData.credit} onChange={handleChange} />
                            <CheckboxField label="Company Registration" name="companyRegistration" checked={formData.companyRegistration} onChange={handleChange} />
                            <CheckboxField label="Passport" name="passport" checked={formData.passport} onChange={handleChange} />
                            <CheckboxField label="Signed Quote" name="signedQuote" checked={formData.signedQuote} onChange={handleChange} />
                            <CheckboxField label="Highrise" name="highrise" checked={formData.highrise} onChange={handleChange} />
                            <CheckboxField label="Credit Check" name="creditCheck" checked={formData.creditCheck} onChange={handleChange} />
                            <CheckboxField label="IT" name="it" checked={formData.it} onChange={handleChange} />
                            <CheckboxField label="Exact" name="exact" checked={formData.exact} onChange={handleChange} />
                            <CheckboxField label="Bank" name="bank" checked={formData.bank} onChange={handleChange} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <InputField label="Debtor No Scope" name="debtorNoScope" value={formData.debtorNoScope} onChange={handleChange} />
                            <InputField label="Creditor No Scope" name="creditorNoScope" value={formData.creditorNoScope} onChange={handleChange} />
                        </div>
                    </Section>

                    <Section title="Agreement">
                         <div className="space-y-4">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <InputField label="Agreement Date" name="agreementDate" type="date" value={formData.agreementDate} onChange={handleChange} />
                            <InputField label="Signature" name="signature" value={formData.signature} onChange={handleChange} />
                        </div>
                    </Section>
                </form>

                <div className="mt-8 pt-6 border-t flex justify-end space-x-4">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        className="hidden"
                    />
                    <button onClick={handleImportClick} className="bg-gray-500 text-white px-5 py-2 rounded-lg hover:bg-gray-600 transition-colors shadow-md">Import JSON</button>
                    <button onClick={() => handleExport('csv')} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md">Export CSV</button>
                    <button onClick={() => handleExport('json')} className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md">Export JSON</button>
                    <button onClick={() => handleExport('xlsx')} className="bg-yellow-500 text-white px-5 py-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-md">Export XLSX</button>
                    <button onClick={() => handleExport('pdf')} className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-md">Export PDF</button>
                </div>
            </main>
        </div>
    );
};

export default App;