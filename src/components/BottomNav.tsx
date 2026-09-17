import React from 'react';
import { Home, QrCode, History, ShieldCheck, Video as VideoIcon } from 'lucide-react';

export type TabType = 'home' | 'videos' | 'scan' | 'history' | 'admin';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  isAdmin?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, isAdmin = false }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 px-2 py-2 safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* Tab 1: Home */}
        <button
          onClick={() => onChangeTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-[#0F6B4C]' : 'text-[#6B7568] hover:text-[#1F2A24]'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] sm:text-[11px] mt-0.5 ${activeTab === 'home' ? 'font-bold' : 'font-medium'}`}>
            Beranda
          </span>
        </button>

        {/* Tab 2: Videos (Fitur Baru) */}
        <button
          onClick={() => onChangeTab('videos')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors cursor-pointer ${
            activeTab === 'videos' ? 'text-[#0F6B4C]' : 'text-[#6B7568] hover:text-[#1F2A24]'
          }`}
        >
          <div className="relative">
            <VideoIcon className={`w-5 h-5 ${activeTab === 'videos' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {activeTab !== 'videos' && (
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </div>
          <span className={`text-[10px] sm:text-[11px] mt-0.5 ${activeTab === 'videos' ? 'font-bold' : 'font-medium'}`}>
            Videos
          </span>
        </button>

        {/* Tab 3: Scan QR (Central Floating Action Button) */}
        <div className="-mt-7">
          <button
            onClick={() => onChangeTab('scan')}
            className="group relative flex flex-col items-center justify-center focus:outline-none cursor-pointer"
            aria-label="Scan QR Code Kajian"
          >
            <div
              className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                activeTab === 'scan'
                  ? 'bg-gradient-to-tr from-[#0F6B4C] to-[#15803d] ring-4 ring-[#D4AF37]/50 text-white shadow-[#0F6B4C]/30'
                  : 'bg-[#0F6B4C] hover:bg-[#0c593f] ring-4 ring-white text-white shadow-[#0F6B4C]/25'
              }`}
            >
              <QrCode className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
            </div>
            <span
              className={`text-[10px] sm:text-[11px] mt-1 ${
                activeTab === 'scan' ? 'font-bold text-[#0F6B4C]' : 'font-medium text-[#6B7568]'
              }`}
            >
              Scan QR
            </span>
          </button>
        </div>

        {/* Tab 4: History */}
        <button
          onClick={() => onChangeTab('history')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors cursor-pointer ${
            activeTab === 'history' ? 'text-[#0F6B4C]' : 'text-[#6B7568] hover:text-[#1F2A24]'
          }`}
        >
          <History className={`w-5 h-5 ${activeTab === 'history' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] sm:text-[11px] mt-0.5 ${activeTab === 'history' ? 'font-bold' : 'font-medium'}`}>
            Riwayat
          </span>
        </button>

        {/* Tab 5: Admin (Khusus Role: Admin) */}
        {isAdmin && (
          <button
            onClick={() => onChangeTab('admin')}
            className={`flex flex-col items-center justify-center py-1 px-2 transition-colors cursor-pointer ${
              activeTab === 'admin' ? 'text-[#0F6B4C]' : 'text-[#6B7568] hover:text-[#1F2A24]'
            }`}
          >
            <div className="relative">
              <ShieldCheck className={`w-5 h-5 ${activeTab === 'admin' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#D4AF37] ring-2 ring-white" />
            </div>
            <span className={`text-[10px] sm:text-[11px] mt-0.5 ${activeTab === 'admin' ? 'font-bold' : 'font-medium'}`}>
              Admin
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};
