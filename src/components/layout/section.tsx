interface SectionProps {
  children: React.ReactNode;
  className?: string;
}

export function Section({ children, className = '' }: SectionProps) {
  return (
    <section className={`flex flex-col items-center gap-12 pb-8 ${className}`}>
      {children}
    </section>
  );
}