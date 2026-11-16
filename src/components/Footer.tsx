import React from 'react';
import { MapPin, Phone, Clock, FileSpreadsheet, ShieldCheck, Lock } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  return (
    <footer id="contact" className="bg-[#0e0e10] border-t border-stone-800 text-right pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          
          {/* Col 1: Brand Info (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center font-black text-xl text-black">
                ن
              </div>
              <div>
                <span className="text-xl font-black text-white block">
                  مطعم وجزارة نجم
                </span>
                <span className="text-xs text-amber-400 font-semibold">
                  جزارة السماح · نجم .. أسم له تاريخ
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-sm">
              أصل الحواوشي والمشويات البلدي على الفحم والجريل في القاهرة. لحوم بلدية 100% طازجة يومياً من مذابح جزارة السماح بأفضل جودة وخلطات متوارثة.
            </p>

            <div className="pt-2">
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs text-stone-500 hover:text-amber-400 bg-stone-900 hover:bg-stone-800/80 border border-stone-800/80 rounded-lg transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>بوابة الإدارة والمدير (تحليل الأسعار والإكسيل)</span>
              </button>
            </div>
          </div>

          {/* Col 2: Addresses & Working Hours (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              العنوان والمواعيد
            </h4>
            <div className="space-y-2 text-xs text-stone-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>شارع ٢ من شارع طلعت حرب (وسط البلد / إمبابة)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>يومياً من 12:00 ظهراً حتى 4:00 فجراً</span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>توصيل دليفري سريع لكافة المناطق المجاورة</span>
              </div>
            </div>
          </div>

          {/* Col 3: Direct Phone Numbers & Delivery (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              أرقام الطلبات والدليفري
            </h4>
            <div className="space-y-2 text-xs">
              <a
                href="tel:0237122328"
                className="flex items-center justify-between p-2.5 bg-stone-900 border border-stone-800 hover:border-amber-500 rounded-lg text-stone-200 transition-colors"
              >
                <span className="text-stone-400">التليفون الأرضي:</span>
                <span className="font-mono font-bold text-amber-400 text-sm tabular-nums">0237122328</span>
              </a>

              <a
                href="tel:01070664278"
                className="flex items-center justify-between p-2.5 bg-stone-900 border border-stone-800 hover:border-amber-500 rounded-lg text-stone-200 transition-colors"
              >
                <span className="text-stone-400">موبايل وواتساب 1:</span>
                <span className="font-mono font-bold text-amber-400 text-sm tabular-nums">01070664278</span>
              </a>

              <a
                href="tel:01070664279"
                className="flex items-center justify-between p-2.5 bg-stone-900 border border-stone-800 hover:border-amber-500 rounded-lg text-stone-200 transition-colors"
              >
                <span className="text-stone-400">موبايل للطلبات 2:</span>
                <span className="font-mono font-bold text-amber-400 text-sm tabular-nums">01070664279</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} مطعم وجزارة نجم (جزارة السماح).
          </div>
          <div className="flex items-center gap-4">
            <span>نجم .. أسم له تاريخ</span>
            <span>·</span>
            <span>أفضل جودة لحوم بلدي</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
