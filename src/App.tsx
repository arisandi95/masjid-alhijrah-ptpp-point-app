/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { ScanPage } from './pages/ScanPage';
import { HistoryPage } from './pages/HistoryPage';
import { AdminEventPage } from './pages/AdminEventPage';
import { BottomNav, TabType } from './components/BottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';

function AppContent() {
  const { user, isAdmin, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // If non-admin user is on admin tab somehow, fallback to home
  const safeActiveTab = activeTab === 'admin' && !isAdmin ? 'home' : activeTab;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#0F6B4C] text-[#FAF3D1] flex items-center justify-center shadow-md animate-pulse mb-3">
          <svg width="28" height="28" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 8 C70 8 88 35 90 62 L90 88 L10 88 L10 62 C12 35 30 8 50 8 Z" />
          </svg>
        </div>
        <p className="text-xs font-bold text-[#0F6B4C] tracking-wide font-heading">
          Masjid Al Hijrah PTPP
        </p>
        <p className="text-[11px] text-[#6B7568] mt-0.5">Memuat sesi jamaah...</p>
      </div>
    );
  }

  // Not logged in -> show Login or Register
  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFAF7]">
        <OfflineIndicator />
        {authView === 'login' ? (
          <LoginPage onGoToRegister={() => setAuthView('register')} />
        ) : (
          <RegisterPage onGoToLogin={() => setAuthView('login')} />
        )}
      </div>
    );
  }

  // Logged in -> show Application with BottomNav
  return (
    <div className="min-h-screen bg-[#FAFAF7] relative select-none">
      <OfflineIndicator />

      <main className="max-w-md mx-auto min-h-screen">
        {safeActiveTab === 'home' && (
          <HomePage
            onGoToScan={() => setActiveTab('scan')}
            onGoToHistory={() => setActiveTab('history')}
            onGoToAdmin={isAdmin ? () => setActiveTab('admin') : undefined}
          />
        )}

        {safeActiveTab === 'scan' && (
          <ScanPage
            onBack={() => setActiveTab('home')}
            onScanCompleted={() => {
              // Stay on scan or user can tap back
            }}
          />
        )}

        {safeActiveTab === 'history' && <HistoryPage />}

        {safeActiveTab === 'admin' && isAdmin && <AdminEventPage />}
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav activeTab={safeActiveTab} onChangeTab={setActiveTab} isAdmin={isAdmin} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
