import React from 'react';
import { Flame, ArrowDown, PhoneCall, ShieldCheck, MapPin, Send } from 'lucide-react';

interface HeroProps {
  onOpenMenu: () => void;
  onOpenCart: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenMenu, onOpenCart }) => {
  return (
    <section id="hero" className="relative overflow-hidden pt-8 pb-16 lg:py-20 bg-gradient-to-b from-[#121214] via-[#17161a] to-[#121214]">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/4 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Content Column (7 cols) - Left side on desktop in RTL */}
          <div className="lg:col-span-7 space-y-6 text-right order-1 lg:order-2">
            
            {/* Heritage Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs sm:text-sm font-bold">
              <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>جزارة السماح ومطعم نجم · نجم .. أسم له تاريخ</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              أصل الحواوشي والمشويات البلدي <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-red-500">
                من الفحم والجريل لمائدتك
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-stone-300 leading-relaxed max-w-2xl">
              بنقدملك في مطعم نجم الطعم المصري الأصيل: لحمة بلدي طازة يومياً من مذابح جزارة السماح، عيش بلدي مقرمش متبل بسر الخلطة، طواجن فخار مسبكة على الهادي، ومشويات تفوح بريحة الفحم البلدي.
            </p>

            {/* Key Quality Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs sm:text-sm text-stone-300">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-stone-900/60 border border-stone-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>لحوم بلدي طازة 100%</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-stone-900/60 border border-stone-800">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <span>شوي فحم حطب وجريل بلدي</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-stone-900/60 border border-stone-800">
                <PhoneCall className="w-4 h-4 text-amber-400 shrink-0" />
                <span>دليفري سريع حتى 4 فجراً</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={onOpenMenu}
                className="px-6 py-3.5 text-base font-bold text-black bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>استعرض المنيو والأسعار</span>
                <ArrowDown className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenCart}
                className="px-6 py-3.5 text-base font-bold text-stone-100 bg-stone-800/90 hover:bg-stone-700/90 border border-stone-700 hover:border-amber-400 rounded-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer group"
              >
                <Send className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>اطلب أونلاين عبر الواتساب</span>
              </button>

              <a
                href="tel:01070664278"
                className="px-5 py-3.5 text-sm font-semibold text-amber-400 hover:text-white bg-amber-950/20 hover:bg-amber-900/40 border border-amber-700/30 rounded-xl transition-colors flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4 text-amber-400" />
                <span>الخط الساخن: 01070664278</span>
              </a>
            </div>

            {/* Branch address tag */}
            <div className="pt-2 flex items-center gap-2 text-xs text-stone-400 font-medium">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>العنوان: شارع ٢ من شارع طلعت حرب · توصيل لجميع المناطق المحيطة</span>
            </div>
          </div>

          {/* Visual Showcase Column (5 cols) - Moved to right side on desktop in RTL */}
          <div className="lg:col-span-5 relative order-2 lg:order-1">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer decorative ring */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500 via-red-500 to-amber-600 rounded-2xl blur-md opacity-30 group-hover:opacity-60 transition duration-1000"></div>

              {/* Main Image Card */}
              <div className="relative rounded-2xl overflow-hidden border border-stone-700/80 bg-stone-900 shadow-2xl">
                <img
                  src="/src/assets/images/hero_hawawshi_grill_1792728857748.jpg"
                  alt="حواوشي بلدي على الفحم في مطعم نجم"
                  referrerPolicy="no-referrer"
                  className="w-full h-80 sm:h-96 object-cover hover:scale-105 transition-transform duration-700"
                />

                {/* Gradient Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6 text-right">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-500/40 px-2.5 py-1 rounded-md">
                      أشهر رغيف في مصر
                    </span>
                    <span className="text-lg font-black text-white font-mono tabular-nums">
                      90 ج.م فقط
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-2 text-right">
                    حواوشي نجم البلدي المخصوص
                  </h3>
                  <p className="text-xs text-stone-300 mt-1 line-clamp-2 text-right">
                    عيش بلدي طازة محشي بلحمة بلدي دسمة ومتبلة ومقرمش من على الفحم مباشرة.
                  </p>
                </div>
              </div>

              {/* Floating Mini Highlight Card */}
              <div className="absolute -bottom-5 -right-4 sm:-right-6 bg-stone-900/95 border border-amber-500/40 p-3.5 rounded-xl shadow-xl flex items-center gap-3 backdrop-blur-md">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-lg">
                  🥩
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-400">جزارة السماح</p>
                  <p className="text-sm font-extrabold text-amber-400">لحوم بلدية طازة يومياً</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
