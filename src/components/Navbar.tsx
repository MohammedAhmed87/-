import React, { useState } from 'react';
import { ShoppingBag, Phone, Menu as MenuIcon, X, ShieldCheck, KeyRound } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  onOpenStaffPortal: () => void;
  onNavigateTo: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenStaffPortal, onNavigateTo }) => {
  const { totalItemsCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    onNavigateTo(sectionId);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#121214]/95 backdrop-blur-md border-b border-stone-800 transition-colors font-['Cairo',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-20">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <a 
              href="#hero" 
              onClick={(e) => { e.preventDefault(); handleNavClick('hero'); }}
              className="flex items-center gap-3 text-right group"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center font-black text-xl text-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                ن
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors whitespace-nowrap">
                  مطعم وجزارة نجم
                </span>
                <span className="text-xs text-stone-400 font-medium whitespace-nowrap">
                  جزارة السماح · أسم له تاريخ
                </span>
              </div>
            </a>
          </div>

          {/* Zone 2: Navigation Links (Customer Facing) */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-stone-300">
            <button
              onClick={() => handleNavClick('hero')}
              className="hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer"
            >
              الرئيسية
            </button>
            <button
              onClick={() => handleNavClick('menu')}
              className="hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer"
            >
              المنيو والأسعار
            </button>
            <button
              onClick={() => handleNavClick('mixes')}
              className="hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer"
            >
              الميكسات وطاجن الخميس
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className="hover:text-stone-100 transition-colors whitespace-nowrap cursor-pointer"
            >
              سر جزارة السماح
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className="hover:text-stone-100 transition-colors whitespace-nowrap cursor-pointer"
            >
              الفروع والاتصال
            </button>
          </nav>

          {/* Zone 3: Actions (Staff POS Portal + Hotline + Cart) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Staff / POS System Access Button */}
            <button
              onClick={onOpenStaffPortal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-300 hover:text-white bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/40 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-sm"
              title="دخول طاقم العمل: الإدارة، الكاشير، كابتن الصالة، طيار الدليفري"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">بوابة النظام POS</span>
              <span className="sm:hidden">POS</span>
            </button>

            {/* Quick Hotline Button */}
            <a
              href="tel:01070664278"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-stone-300 bg-stone-900 border border-stone-800 rounded-xl hover:text-amber-400 hover:border-amber-500 transition-colors whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono tabular-nums">01070664278</span>
            </a>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2 text-sm font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
              aria-label="سلة الطلبات"
            >
              <ShoppingBag className="w-4 h-4 text-black" />
              <span>الطلبات</span>
              {totalItemsCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-extrabold text-white bg-red-600 rounded-full tabular-nums">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-stone-400 hover:text-white rounded-lg border border-stone-800"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#161619] border-b border-stone-800 px-4 pt-3 pb-5 space-y-2 text-base">
          <button
            onClick={() => handleNavClick('hero')}
            className="w-full text-right py-2 text-stone-200 hover:text-amber-400 border-b border-stone-800/60"
          >
            الرئيسية
          </button>
          <button
            onClick={() => handleNavClick('menu')}
            className="w-full text-right py-2 text-stone-200 hover:text-amber-400 border-b border-stone-800/60"
          >
            المنيو الكامل والأسعار
          </button>
          <button
            onClick={() => handleNavClick('mixes')}
            className="w-full text-right py-2 text-stone-200 hover:text-amber-400 border-b border-stone-800/60"
          >
            ميكس نجم وطاجن ليلة الخميس
          </button>
          <button
            onClick={() => handleNavClick('about')}
            className="w-full text-right py-2 text-stone-200 hover:text-amber-400 border-b border-stone-800/60"
          >
            سر جزارة السماح
          </button>
          <button
            onClick={() => handleNavClick('contact')}
            className="w-full text-right py-2 text-stone-200 hover:text-amber-400 border-b border-stone-800/60"
          >
            العنوان وأرقام الدليفري
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenStaffPortal();
            }}
            className="w-full text-right py-2.5 text-amber-300 font-bold flex items-center justify-between bg-amber-950/30 px-3 rounded-lg border border-amber-500/30"
          >
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>دخول بوابة طاقم المطعم والـ POS</span>
            </div>
            <span className="text-[10px] bg-amber-500 text-black font-black px-2 py-0.5 rounded">إدارة وكاشير</span>
          </button>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href="tel:01070664278"
              className="flex items-center justify-center gap-2 py-2.5 bg-stone-800 text-amber-400 font-bold rounded-lg"
            >
              <Phone className="w-4 h-4" />
              <span>اتصل بالدليفري: 01070664278</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
