import { Button } from '@/components/ui/button';

interface NavItemsProps {
  className?: string;
}

export function NavItems({ className = '' }: NavItemsProps) {
  return (
    <nav className={className}>
      <Button variant="ghost" asChild>
        <a href="/">Home</a>
      </Button>
      <Button variant="ghost" asChild>
        <a href="/dashboard">Dashboard</a>
      </Button>
      <Button variant="ghost" asChild>
        <a href="/about">About</a>
      </Button>
      <Button variant="ghost" asChild>
        <a href="/contact">Contact</a>
      </Button>
    </nav>
  );
}