import { cn } from "@/lib/utils";

type HeadingProps = {
  children: React.ReactNode;
  className?: string;
};

export function Heading({ children, className }: HeadingProps) {
  return (
    <h1
      className={cn(
        "text-2xl font-bold uppercase tracking-wide bg-gradient-to-r from-primary-blue to-primary-cyan bg-clip-text text-transparent drop-shadow-sm",
        className
      )}
    >
      {children}
    </h1>
  );
}
