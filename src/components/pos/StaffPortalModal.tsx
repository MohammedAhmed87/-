import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Receipt, 
  ChefHat, 
  Bike, 
  Calculator,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { useRestaurant, StaffUser } from '../../context/RestaurantContext';
import { CashierScreen } from './CashierScreen';
import { CaptainScreen } from './CaptainScreen';
import { DriverScreen } from './DriverScreen';
import { AccountantScreen } from './AccountantScreen';
import { AdminDashboard } from '../AdminDashboard';

interface StaffPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: StaffUser['role'];
}

export const StaffPortalModal: React.FC<StaffPortalModalProps> = ({ isOpen, onClose, defaultRole }) => {
  const { currentUser, loginUser, logoutUser } = useRestaurant();
  const [activeScreen, setActiveScreen] = useState<StaffUser['role']>(
    defaultRole || currentUser?.role || 'admin'
  );

  if (!isOpen) return null;

  const handleRoleSelect = (role: StaffUser['role']) => {
    loginUser(role);
    setActiveScreen(role);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 text-right font-['Cairo',sans-serif]">
      <div className="relative w-full max-w-6xl bg-[#141417] border border-stone-800 rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Top Bar */}
        <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="إغلاق البوابة"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-xs text-stone-400 hover:text-amber-400 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة للواجهة الرئيسية</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
                  منظومة نجم ERP & POS
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  بوابة إدارة وتشغيل مطعم وجزارة نجم
                </h3>
              </div>
              <p className="text-[11px] text-stone-400">
                إدارة الصلاحيات: المدير العام · المحاسب المالي · الكاشير · كابتن الصالة · طيار الدليفري
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center font-black text-black">
              ن
            </div>
          </div>
        </div>

        {/* 5 RBAC Role Switcher Tabs */}
        <div className="p-3 bg-stone-900 border-b border-stone-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRoleSelect('admin')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeScreen === 'admin'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-stone-950 text-stone-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>👑 المدير العام (إسلام نجم)</span>
            </button>

            <button
              onClick={() => handleRoleSelect('accountant')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeScreen === 'accountant'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-stone-950 text-stone-400 hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>📊 المحاسب والجرد المالي</span>
            </button>

            <button
              onClick={() => handleRoleSelect('cashier')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeScreen === 'cashier'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-stone-950 text-stone-400 hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>💻 الكاشير (POS والشيكات)</span>
            </button>

            <button
              onClick={() => handleRoleSelect('captain')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeScreen === 'captain'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-stone-950 text-stone-400 hover:text-white'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>🍽️ كابتن الصالة (الموبايل)</span>
            </button>

            <button
              onClick={() => handleRoleSelect('driver')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeScreen === 'driver'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-stone-950 text-stone-400 hover:text-white'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>🛵 طيار الدليفري والحساب</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-stone-400 hidden xl:inline">
              المستخدم الحالي: <strong className="text-amber-400">{currentUser?.fullName || 'إسلام نجم'}</strong>
            </span>
          </div>
        </div>

        {/* Screen View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeScreen === 'admin' && (
            <AdminDashboard isOpen={true} onClose={onClose} isEmbedded={true} />
          )}

          {activeScreen === 'accountant' && <AccountantScreen />}

          {activeScreen === 'cashier' && <CashierScreen />}

          {activeScreen === 'captain' && <CaptainScreen />}

          {activeScreen === 'driver' && <DriverScreen />}
        </div>

      </div>
    </div>
  );
};
