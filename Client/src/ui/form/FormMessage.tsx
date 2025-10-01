import React from 'react';

interface FormMessageProps {
  type: 'error' | 'success';
  message: string;
}

const FormMessage: React.FC<FormMessageProps> = ({ type, message }) => {
  if (!message) return null;

  const className =
    type === 'error'
      ? 'w-full p-2.5 bg-red-100 border border-red-400 text-red-700 rounded-[10px] text-sm'
      : 'w-full p-2.5 bg-green-100 border border-green-400 text-green-700 rounded-[10px] text-sm';

  return <div className={className}>{message}</div>;
};

export default FormMessage;