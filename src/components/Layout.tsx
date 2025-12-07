import { Link, useLocation } from 'react-router-dom';
import { Home, PlusSquare, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, title }: { to: string, icon: any, title: string }) => {
    const active = isActive(to);
    return (
      <Link 
        to={to} 
        className={cn(
          "relative p-3 rounded-xl transition-all duration-200 group flex items-center justify-center",
          active 
            ? "text-white bg-primary shadow-lg shadow-primary/25" 
            : "text-gray-400 hover:text-white hover:bg-white/10"
        )}
        title={title}
      >
        <Icon size={24} strokeWidth={active ? 2.5 : 2} />
        {active && (
          <motion.div
            layoutId="active-nav"
            className="absolute inset-0 rounded-xl bg-primary -z-10"
            initial={false}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-background text-white font-sans overflow-hidden">
      <nav className="w-20 bg-surface flex flex-col items-center py-6 gap-8 border-r border-white/5 z-20">
        <div className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-600 mb-2">
          AT
        </div>
        
        <div className="flex flex-col gap-4 w-full px-4">
          <NavItem to="/" icon={Home} title="Home" />
          <NavItem to="/config" icon={PlusSquare} title="Create Session" />
        </div>

        <div className="flex-1" />
        
        <div className="flex flex-col gap-4 w-full px-4 mb-4">
           {/* Maybe a link to current focus session if running? */}
          <NavItem to="/settings" icon={Settings} title="Settings" />
        </div>
      </nav>
      
      <main className="flex-1 overflow-auto bg-background relative">
        {/* Background ambient glow */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px]" />
        </div>
        
        <div className="h-full w-full">
          {children}
        </div>
      </main>
    </div>
  );
};
