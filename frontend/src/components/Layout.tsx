import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import {
  Shield,
  Key,
  User,
  FileText,
  CheckCircle,
  Eye,
  Settings,
  LogOut,
  Layers,
} from 'lucide-react';
import { Button } from './ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Layers },
    { label: 'My Identity', path: '/identity', icon: User },
    { label: 'Attributes', path: '/attributes', icon: FileText },
    { label: 'Verifications', path: '/verifications', icon: CheckCircle },
    { label: 'Selective Disclosure', path: '/disclosure', icon: Eye },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const truncate = (str: string, lead = 6, tail = 4) => {
    if (!str || str.length <= lead + tail) return str;
    return `${str.slice(0, lead)}...${str.slice(-tail)}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-xl shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Equinox DID
                </span>
                <span className="text-[10px] text-cyan-400 tracking-wider uppercase font-mono">
                  Passkey Identity
                </span>
              </div>
            </Link>

            {/* Network Pill */}
            <div className="hidden md:flex items-center gap-2 ml-6 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium">Stellar Testnet</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">Soroban v21</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700 text-xs font-mono">
                  <Key className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{truncate(user.stellarAddress || user.id)}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-slate-700 hover:bg-slate-800 text-slate-300"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-slate-300">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold">
                    Create Passkey
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sub-Navigation Tabs (Authenticated) */}
        {isAuthenticated && (
          <div className="border-t border-slate-800/60 bg-slate-900/40 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-4 overflow-x-auto py-2 scrollbar-none">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <p>
          Equinox Prime Decentralized Identity • Native Secp256r1 Passkeys & Zero-Knowledge Selective Disclosure on Stellar Soroban
        </p>
      </footer>
    </div>
  );
}
