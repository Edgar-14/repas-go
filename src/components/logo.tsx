
import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
       <Image
          src="/befast-logo.svg"
          alt="BeFast Delivery Logo"
          width={40}
          height={40}
          className="rounded-lg"
          data-ai-hint="logo"
        />
      <span className="text-xl font-headline font-medium text-primary">
        BeFast
      </span>
    </div>
  );
}
