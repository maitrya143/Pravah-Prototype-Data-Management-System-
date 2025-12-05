
import React, { useState } from 'react';
import { User, ViewState } from '../types';
import { LOGO_URL } from '../constants';
import { 
  Menu, User as UserIcon, LogOut, Settings, 
  LayoutDashboard, UserPlus, QrCode, ClipboardCheck, 
  BookOpen, FileText, BarChart2, History, X, CreditCard
} from 'lucide-react';

interface LayoutProps {
  user: User;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const MenuItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: React.ElementType, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-6 py-3 transition-colors duration-200 ${
      active 
        ? 'bg-emerald-50 text-emerald-700 border-r-4 border-emerald-600' 
        : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ 
  user, 
  currentView, 
  onNavigate, 
  onLogout, 
  children 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleNav = (view: ViewState) => {
    onNavigate(view);
    setIsSidebarOpen(false); // Close on mobile after click
  };

  const handleLogout = () => {
    setIsSidebarOpen(false);
    onLogout();
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="bg-white shadow-sm h-16 fixed w-full top-0 z-40 flex items-center justify-between px-4 lg:px-8 border-b border-stone-200">
        <div className="flex items-center space-x-4">
          <button onClick={toggleSidebar} className="lg:hidden text-stone-600">
            <Menu size={24} />
          </button>
          
          <div className="flex items-center space-x-3">
            {!imgError ? (
              <img 
                src={LOGO_URL} 
                alt="Pravah Logo" 
                className="h-10 w-auto object-contain" 
                onError={() => setImgError(true)}
              />
            ) : (
               <div className="flex flex-col">
                  <span className="text-2xl font-bold text-emerald-800 leading-none">Pravah</span>
                  <span className="text-[10px] text-stone-500 tracking-wide">The Flow of Change</span>
               </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-stone-800">{user.name}</p>
            <p className="text-xs text-stone-500">{user.volunteerId} | {user.centerName}</p>
          </div>
          <button onClick={() => handleNav('SETTINGS')} className="text-stone-400 hover:text-stone-600">
            <Settings size={20} />
          </button>
          <button onClick={onLogout} className="text-stone-400 hover:text-red-500">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out pt-20 flex flex-col ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:shadow-none lg:border-r lg:border-stone-200'
      }`}>
        <div className="lg:hidden absolute top-4 right-4">
          <button onClick={toggleSidebar} className="text-stone-500">
            <X size={24} />
          </button>
        </div>
        
        <nav className="space-y-1 mt-4 flex-1">
          <MenuItem icon={LayoutDashboard} label="Home" active={currentView === 'DASHBOARD'} onClick={() => handleNav('DASHBOARD')} />
          <MenuItem icon={UserPlus} label="New Admission" active={currentView === 'ADMISSION'} onClick={() => handleNav('ADMISSION')} />
          <MenuItem icon={CreditCard} label="Student IDs" active={currentView === 'GENERATE_QR'} onClick={() => handleNav('GENERATE_QR')} />
          <MenuItem icon={QrCode} label="QR Scanning" active={currentView === 'QR_SCAN'} onClick={() => handleNav('QR_SCAN')} />
          <MenuItem icon={ClipboardCheck} label="Manual Attendance" active={currentView === 'MANUAL_ATTENDANCE'} onClick={() => handleNav('MANUAL_ATTENDANCE')} />
          <MenuItem icon={BookOpen} label="UPAY Diary" active={currentView === 'DIARY'} onClick={() => handleNav('DIARY')} />
          <MenuItem icon={FileText} label="Syllabus" active={currentView === 'SYLLABUS'} onClick={() => handleNav('SYLLABUS')} />
          <MenuItem icon={BarChart2} label="Performance" active={currentView === 'PERFORMANCE'} onClick={() => handleNav('PERFORMANCE')} />
          <MenuItem icon={History} label="History" active={currentView === 'HISTORY'} onClick={() => handleNav('HISTORY')} />
        </nav>

        <div className="p-4 border-t border-stone-100">
             <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-6 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
             </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 mt-16 lg:ml-64 p-4 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
