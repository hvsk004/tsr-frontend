interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className="flex-1 w-full">
      <div className="w-[90%] max-w-[1920px] mx-auto py-8 md:py-12">
        <div className={`mx-auto w-full ${className}`}>
          {children}
        </div>
      </div>
    </div>
  );
}