/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SpecialMixes } from './components/SpecialMixes';
import { MenuSection } from './components/MenuSection';
import { AboutAndQuality } from './components/AboutAndQuality';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { StaffPortalModal } from './components/pos/StaffPortalModal';
import { CustomerTalabatApp } from './components/pos/CustomerTalabatApp';
import { CashierScreen } from './components/pos/CashierScreen';
import { CaptainScreen } from './components/pos/CaptainScreen';
import { DriverScreen } from './components/pos/DriverScreen';
import { AccountantScreen } from './components/pos/AccountantScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { LinksDirectoryModal } from './components/LinksDirectoryModal';
import { 
  Smartphone, 
  KeyRound, 
  ArrowRight, 
  Link as LinkIcon, 
  Receipt, 
  ChefHat, 
  Bike, 
  Calculator, 
  ShieldCheck,
  Globe
} from 'lucide-react';

function MainApp() {
  const [activeScreen, setActiveScreen] = useState<string>('website');
  const [isStaffPortalOpen, setIsStaffPortalOpen] = useState(false);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const { setIsCartOpen } = useCart();

  // Read URL query params (?screen=cashier) or Hash (#captain) on initial mount & back/forward navigation
  useEffect(() => {
    const parseUrl = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const screenParam = urlParams.get('screen');
      const hashParam = window.location.hash.replace('#', '');
      const target = screenParam || hashParam;

      if (target && ['app', 'cashier', 'captain', 'driver', 'accountant', 'admin', 'website'].includes(target)) {
        setActiveScreen(target);
      }
    };

    parseUrl();
    window.addEventListener('popstate', parseUrl);
    window.addEventListener('hashchange', parseUrl);
    return () => {
      window.removeEventListener('popstate', parseUrl);
      window.removeEventListener('hashchange', parseUrl);
    };
  }, []);

  const navigateToScreen = (screenKey: string) => {
    setActiveScreen(screenKey);
    const newUrl = screenKey === 'website' 
      ? window.location.pathname 
      : `${window.location.pathname}?screen=${screenKey}`;
    window.history.pushState({}, '', newUrl);
  };

  const scrollToSection = (sectionId: string) => {
    if (activeScreen !== 'website') {
      navigateToScreen('website');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 1. Direct Customer Talabat App Screen
  if (activeScreen === 'app') {
    return (
      <CustomerTalabatApp
        onBackToWebsite={() => navigateToScreen('website')}
      />
    );
  }

  // 2. Direct Standalone Staff Screen View (Cashier, Captain, Driver, Accountant, Admin)
  if (['cashier', 'captain', 'driver', 'accountant', 'admin'].includes(activeScreen)) {
    return (
      <div className="min-h-screen bg-[#121214] text-stone-100 font-['Cairo',sans-serif] selection:bg-amber-500 selection:text-black antialiased p-3 sm:p-6 text-right">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Top Bar for standalone screen */}
          <div className="p-4 bg-stone-950 border border-stone-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateToScreen('website')}
                className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة للموقع الرئيسي</span>
              </button>

              <button
                onClick={() => setIsLinksModalOpen(true)}
                className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>دليل الروابط المباشرة</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-mono">
                رابط مباشر للشاشة: ?screen={activeScreen}
              </span>
              <h2 className="text-sm font-black text-white">
                {activeScreen === 'cashier' && '💻 شاشة الكاشير و الـ POS'}
                {activeScreen === 'captain' && '🍽️ شاشة كابتن الصالة'}
                {activeScreen === 'driver' && '🛵 شاشة طيار الدليفري'}
                {activeScreen === 'accountant' && '📊 شاشة المحاسب والجرد'}
                {activeScreen === 'admin' && '👑 لوحة الإدارة والتحكم'}
              </h2>
            </div>
          </div>

          {/* Screen Content */}
          <div className="p-4 sm:p-6 bg-[#161619] border border-stone-800 rounded-3xl shadow-2xl">
            {activeScreen === 'cashier' && <CashierScreen />}
            {activeScreen === 'captain' && <CaptainScreen />}
            {activeScreen === 'driver' && <DriverScreen />}
            {activeScreen === 'accountant' && <AccountantScreen />}
            {activeScreen === 'admin' && <AdminDashboard isOpen={true} onClose={() => navigateToScreen('website')} isEmbedded={true} />}
          </div>

        </div>

        {/* Links Directory Modal */}
        <LinksDirectoryModal
          isOpen={isLinksModalOpen}
          onClose={() => setIsLinksModalOpen(false)}
          onNavigateToScreen={navigateToScreen}
        />
      </div>
    );
  }

  // 3. Default: Brand Website Experience with links hub
  return (
    <div className="min-h-screen bg-[#121214] text-stone-100 font-['Cairo',sans-serif] selection:bg-amber-500 selection:text-black antialiased">
      
      {/* Top Floating App Mode Switcher Ribbon */}
      <div className="bg-gradient-to-r from-stone-950 via-amber-950/40 to-stone-950 border-b border-stone-800/80 px-4 py-2 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLinksModalOpen(true)}
              className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>دليل روابط الشاشات والأكواد 🔗</span>
            </button>

            <button
              onClick={() => setIsStaffPortalOpen(true)}
              className="text-[11px] text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <KeyRound className="w-3 h-3 text-amber-400" />
              <span>بوابة الإدارة والـ ERP (الكاشير، الكابتن، الطيار، المحاسب)</span>
            </button>
          </div>

          <button
            onClick={() => navigateToScreen('app')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold rounded-lg shadow-sm text-xs cursor-pointer transition-all active:scale-95"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>تجربة أبلكيشن نجم للعملاء (مثل طلبات) 📲</span>
          </button>
        </div>
      </div>

      {/* Top Sticky Header */}
      <Navbar
        onOpenStaffPortal={() => setIsStaffPortalOpen(true)}
        onNavigateTo={scrollToSection}
      />

      {/* Public Customer Facing Experience */}
      <main>
        {/* Hero Section */}
        <Hero
          onOpenMenu={() => scrollToSection('menu')}
          onOpenCart={() => setIsCartOpen(true)}
        />

        {/* Signature Platters & Deals */}
        <SpecialMixes />

        {/* Full Interactive Menu with Search & Category Filters */}
        <MenuSection />

        {/* Heritage of Butcher Shop & Quality */}
        <AboutAndQuality />
      </main>

      {/* Footer with Addresses and Direct Hotline */}
      <Footer onOpenAdmin={() => setIsStaffPortalOpen(true)} />

      {/* Slide-over Customer Cart Drawer (With GPS fee & Loyalty points) */}
      <CartDrawer />

      {/* Full POS & ERP Staff Portal (Admin, Accountant, Cashier POS, Captain Hall, Driver Delivery) */}
      <StaffPortalModal
        isOpen={isStaffPortalOpen}
        onClose={() => setIsStaffPortalOpen(false)}
      />

      {/* Links & Source Code Directory Modal */}
      <LinksDirectoryModal
        isOpen={isLinksModalOpen}
        onClose={() => setIsLinksModalOpen(false)}
        onNavigateToScreen={navigateToScreen}
      />

    </div>
  );
}

export default function App() {
  return (
    <RestaurantProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </RestaurantProvider>
  );
}
