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
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  namePrefix: 'accountIdentifier' | 'swiftOrBic' | 'sortOrRouting';
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
      <div className="space-y-4">
        <h3 className="text-md font-bold text-gray-600 mt-2 border-b pb-1">{title}</h3>
        <InputField label="Name" name={fieldName('name')} value={formData[fieldName('name')]} onChange={handleChange} />
        <InputField label="Title" name={fieldName('title')} value={formData[fieldName('title')]} onChange={handleChange} />
        <InputField label="Email" name={fieldName('email')} value={formData[fieldName('email')]} onChange={handleChange} type="email" />
      </div>
      <div className="space-y-4 md:mt-10">
        <InputField label="Phone" name={fieldName('phone')} value={formData[fieldName('phone')]} onChange={handleChange} />
        <InputField label="Mobile" name={fieldName('mobile')} value={formData[fieldName('mobile')]} onChange={handleChange} />
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
  date: '', requestBy: 'Gert-Jan Dokter', role: 'debtor', companyName: '', address: '',
  cityAndState: '', postCode: '', country: '', phone: '', website: '', invoiceAddress: '',
  invoiceCityAndState: '', invoicePostCode: '', invoiceCountry: '', invoiceLanguage: 'English',
  defaultCurrency: 'United States Dollars (USD)', generalName: '', generalTitle: '', generalEmail: '',
  generalPhone: '', generalMobile: '', financeName: '', financeTitle: '', financeEmail: '',
  financePhone: '', financeMobile: '', vatNo: '', companyRegNo: '', eoriOrEin: 'eori',
  eoriNo: '', bankName: '', accountName: '', bankAddress: '', accountIdentifierType: 'accountNo',
  accountIdentifierValue: '', swiftOrBicType: 'swift', swiftOrBicValue: '', sortOrRoutingType: 'sort',
  sortOrRoutingValue: '', requestedCreditLimit: '', requestedPaymentTerms: '', poa: false,
  scope: false, gdpr: false, credit: false, companyRegistration: false, passport: false,
  signedQuote: false, highrise: false, creditCheck: false, it: false, exact: false, bank: false,
  debtorNoScope: '', creditorNoScope: '', remarks: '', agreementDate: '', signature: '',
};
Object.freeze(initialFormData); // Make the initial state truly immutable

const constants = {
  selectOptions: {
    requestBy: [
      { value: 'Gert-Jan Dokter', label: 'Gert-Jan Dokter' },
      { value: 'Jan Paul Douma', label: 'Jan Paul Douma' }
    ],
    role: [
      { value: 'debtor', label: 'Debtor' },
      { value: 'creditor', label: 'Creditor' }
    ],
    invoiceLanguage: [
      { value: 'English', label: 'English' },
      { value: 'Dutch', label: 'Dutch' }
    ],
    defaultCurrency: [
      { value: 'United States Dollars (USD)', label: 'United States Dollars (USD)' },
      { value: 'Euros (EUR)', label: 'Euros (EUR)' },
      { value: 'Ugandan Shillings (UGX)', label: 'Ugandan Shillings (UGX)' }
    ]
  },
  internalChecklist: {
    labels: {
        poa: 'POA', scope: 'Scope', gdpr: 'GDPR', credit: 'Credit',
        companyRegistration: 'Company Registration', passport: 'Passport',
        signedQuote: 'Signed Quote', highrise: 'Highrise', creditCheck: 'Credit Check',
        it: 'IT', exact: 'Exact', bank: 'Bank',
    } as Record<string, string>,
    layout: [
        ['poa', 'scope', 'gdpr'],
        ['credit', 'companyRegistration', 'passport'],
        ['signedQuote', 'highrise', 'creditCheck'],
        ['it', 'exact', 'bank'],
    ]
  }
};


// ==================================================================================
//
//  MAIN APP COMPONENT
//  The primary component that assembles the form.
//
// ==================================================================================

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(() => JSON.parse(JSON.stringify(initialFormData)));
  const [status, setStatus] = useState<'New' | 'Update'>('New');
  const [isInvoiceAddressSame, setInvoiceAddressSame] = useState(false);
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedData = localStorage.getItem('partnerFormData');
    if (savedData) setHasSavedSession(true);
  }, []);

  const handleSave = useCallback(() => {
    localStorage.setItem('partnerFormData', JSON.stringify(formData));
    setShowSaveMessage(true);
    setHasSavedSession(true);
    setTimeout(() => setShowSaveMessage(false), 3000);
  }, [formData]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    const { checked } = e.target as HTMLInputElement;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the form? This will remove any saved progress and cannot be undone.')) {
      // This is a robust way to ensure we get a completely new, deep-copied object.
      // It definitively solves issues where React might not detect a state change
      // due to subtle object reference issues.
      setFormData(JSON.parse(JSON.stringify(initialFormData)));
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
      setHasSavedSession(false);
    }
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
        if (typeof importedData.companyName !== 'string' || typeof importedData.date !== 'string') {
          throw new Error("JSON file does not match the required format.");
        }
        setFormData(importedData);
        alert('Data imported successfully!');
      } catch (error) {
        alert(`Error importing file: ${error instanceof Error ? error.message : 'Invalid file format.'}`);
      }
    };
    reader.onerror = () => alert("An error occurred while reading the file.");
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };
  
  const actionButtons = [
      { label: 'Save Progress', onClick: handleSave, className: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' },
      { label: 'Clear Form', onClick: handleClear, className: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500' },
      { label: 'Import JSON', onClick: () => fileInputRef.current?.click(), className: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400' },
      { label: 'Export JSON', onClick: () => exportToJSON(formData), className: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400' },
      { label: 'Export as CSV', onClick: () => exportToCSV(formData), className: 'bg-green-600 hover:bg-green-700 focus:ring-green-500' },
      { label: 'Export as Excel', onClick: () => exportToXLSX(formData), className: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' },
      { label: 'Export as PDF', onClick: () => exportToPDF(formData), className: 'bg-red-600 hover:bg-red-700 focus:ring-red-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <header className="flex items-start justify-between mb-6 pb-4 border-b">
          <div className="flex items-center">
            <svg className="w-16 h-16 text-red-600 mr-4" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M50 100C77.6142 100 100 77.6142 100 50C100 22.3858 77.61