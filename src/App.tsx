import { ThemeProvider } from '@/components/theme-provider';
import { Navbar } from '@/components/navbar';
import { Landing } from '@/pages/landing';
import { Dashboard } from '@/pages/dashboard';
import { About } from '@/pages/about';
import { Contact } from '@/pages/contact';
import { Toaster } from '@/components/ui/toaster';

function App() {
  const path = window.location.pathname;

  const getContent = () => {
    switch (path) {
      case '/dashboard':
        return <Dashboard />;
      case '/about':
        return <About />;
      case '/contact':
        return <Contact />;
      default:
        return <Landing />;
    }
  };

  return (
    <ThemeProvider defaultTheme="system">
      <div className="relative min-h-screen flex flex-col bg-background font-sans antialiased">
        <Navbar />
        <main className="flex-1 flex flex-col">{getContent()}</main>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;