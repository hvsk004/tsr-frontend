import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavItems } from './nav-items';
import { ThemeSwitcher } from './theme-switcher';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="relative z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm">
          <div className="container py-4 mt-16">
            <div className="flex flex-col space-y-4">
              <NavItems className="flex flex-col space-y-2" />
              <ThemeSwitcher variant="full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}