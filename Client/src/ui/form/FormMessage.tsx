import React from 'react';

interface FormMessageProps {
  type: 'error' | 'success';
  message: string;
}

const FormMessage: React.FC<FormMessageProps> = ({ type, message }) => {
  if (!message) return null;

  const className =
    type === 'error'
      ? 'w-full p-2.5 bg-dangerous-100 border border-dangerous-400 text-dangerous-700 rounded-[10px] text-sm'
      : 'w-full p-2.5 bg-success-100 border border-success-400 text-success-700 rounded-[10px] text-sm';

  return <div className={className}>{message}</div>;
};

export default FormMessage;