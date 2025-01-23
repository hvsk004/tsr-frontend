import { Camera } from 'lucide-react';
import { NavItems } from './nav-items';
import { ThemeSwitcher } from './theme-switcher';
import { MobileMenu } from './mobile-menu';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-[90%] max-w-[1920px] mx-auto">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-6 w-6" />
            <span className="text-lg font-semibold hidden sm:inline">
              Traffic Sign Detection
            </span>
            <span className="text-lg font-semibold sm:hidden">TSD</span>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            <NavItems className="flex items-center gap-2" />
            <div className="ml-4">
              <ThemeSwitcher />
            </div>
          </nav>

          <MobileMenu />
        </div>
      </div>
    </header>
  );
}