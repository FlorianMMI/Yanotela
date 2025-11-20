import { LogoIcon } from '@/libs/Icons';

export default function Logo() {
  return (
    <div className='h-32 flex justify-center items-center overflow-hidden '>
      <LogoIcon width={280} height={280} className="text-clrprincipal stroke-25" />
    </div>
  );
}
