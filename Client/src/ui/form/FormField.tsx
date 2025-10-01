import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  isInSidebar?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  required = false,
  type = 'text',
  isInSidebar = false,
}) => {
  return (
    <div className={`${isInSidebar ? 'w-full' : 'flex w-full justify-between items-center gap-5'}`}>
      <div className={`${isInSidebar ? 'mb-1' : 'flex flex-col'}`}>
        <p className={`text-clrprincipal ${isInSidebar ? 'text-sm' : 'text-sm'} font-bold`}>{label}</p>
      </div>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`${isInSidebar ? 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent' : 'w-full p-2 px-3 max-w-36 text-xs rounded-lg bg-clrsecondaire text-clrprincipal font-light outline-none placeholder-zinc-500'}`}
      />
    </div>
  );
};

export default FormField;