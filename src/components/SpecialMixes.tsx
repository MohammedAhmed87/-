import React from 'react';
import { Flame, Star, ShoppingBag, Users, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { MenuItem } from '../data/menuData';

export const SpecialMixes: React.FC = () => {
  const { addToCart, setIsCartOpen } = useCart();

  const signatureDeals: {
    item: MenuItem;
    highlight: string;
    image: string;
    badge: string;
    serves: string;
    details: string[];
  }[] = [
    {
      item: {
        id: 'm-8',
        name: 'ميكس نجم ع الفحم (وجبة المشكل الفاخر)',
        category: 'mashweyat',
        categoryLabel: 'مشويات ع الفحم',
        price: 600,
        description: '٣ قطع فراخ مشوية + ٢ قطعة كباب ضاني + ٤ أصابع سجق بلدي + ٣ قطع كفتة مشوية + ٢ قطعة طرب.',
        isPopular: true,
        isSpecial: true,
      },
      highlight: 'الوجبة الأكتر طلباً للمشويات البلدي على الفحم',
      image: '/src/assets/images/kebab_kofta_grill_1792728859230.jpg',
      badge: 'الأكثر مبيعاً',
      serves: 'يكفي 2 - 3 أفراد',
      details: ['3 قطع دجاج فحم', '2 قطعة كباب ضاني', '4 أصابع سجق', '3 كفتة', '2 طرب'],
    },
    {
      item: {
        id: 't-11',
        name: 'طاجن ليلة الخميس (وليمة الملوك)',
        category: 'tawajin',
        categoryLabel: 'طواجن الفرن',
        price: 800,
        description: 'كوارع بلدي + عكاوي + محاشي مشكلة + فريك باللحمة + مخاصي + حلويات لحوم.. تكفي عيلة كاملة.',
        isPopular: true,
        isSpecial: true,
      },
      highlight: 'وليمة الطاقة والرمامة الشعبية المصرية على أصولها',
      image: '/src/assets/images/tagine_clay_casserole_1792728858604.jpg',
      badge: 'صنف حصري لنجم',
      serves: 'يكفي 4 أفراد بالتمام',
      details: ['كوارع بلدي دايبة', 'عكاوي مكرملة', 'محاشي مشكلة', 'فريك باللحمة', 'مخاصي وحلويات'],
    },
    {
      item: {
        id: 'g-20',
        name: 'ميكس نجم جريل (فواكه اللحوم)',
        category: 'grill',
        categoryLabel: 'الجريل البلدي',
        price: 375,
        description: 'تشكيلة مشوحة على الجريل الساخن: كبدة بلدي + قلب + كلاوي + مخاصي + سجق شرقي مع الثوم والفلفل.',
        isPopular: true,
        isSpecial: true,
      },
      highlight: 'شغل الجريل الساخن ودقة التوم والليمون بالعيش السخن',
      image: '/src/assets/images/fatteh_kaware_soup_1792728859366.jpg',
      badge: 'خلطة الجزارة الحصرية',
      serves: 'يكفي 1 - 2 فرد',
      details: ['كبدة بلدي طازة', 'كلاوي وقلب', 'مخاصي بالزبدة', 'سجق بلدي شرقي'],
    },
  ];

  const handleOrderDeal = (item: MenuItem) => {
    addToCart(item, 1);
    setIsCartOpen(true);
  };

  return (
    <section id="mixes" className="py-16 bg-[#161619] border-y border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/40 border border-red-500/30 rounded-lg text-red-400 text-xs font-bold">
            <Flame className="w-4 h-4 text-red-500" />
            <span>عروض الميكسات والولائم الحصرية</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            تشكيلات نجم اللي ملهاش منافس
          </h2>
          <p className="text-stone-300 text-sm sm:text-base">
            صواني وطواجن مجمعة بأفضل أنواع اللحوم البلدي عشان تدوق كل حاجة بسعر موفر وجودة تشرفك في أي لِمة.
          </p>
        </div>

        {/* 3 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {signatureDeals.map((deal) => (
            <div
              key={deal.item.id}
              className="bg-stone-900 rounded-2xl border border-stone-800 hover:border-amber-500/40 overflow-hidden shadow-xl flex flex-col group transition-all duration-300"
            >
              {/* Image Frame */}
              <div className="relative h-56 overflow-hidden bg-stone-950">
                <img
                  src={deal.image}
                  alt={deal.item.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent"></div>
                
                {/* Badges */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className="text-xs font-bold bg-amber-500 text-black px-2.5 py-1 rounded-md shadow-md">
                    {deal.badge}
                  </span>
                </div>

                <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-xs text-stone-300">
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>{deal.serves}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 font-bold bg-black/60 px-2.5 py-1 rounded-md">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>شغل معلم</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4 text-right">
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                    {deal.item.name}
                  </h3>
                  <p className="text-xs text-amber-400/90 font-medium">
                    {deal.highlight}
                  </p>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {deal.item.description}
                  </p>

                  {/* Components Tag List */}
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {deal.details.map((d, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded border border-stone-700/60"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price & Action */}
                <div className="pt-4 border-t border-stone-800 flex items-center justify-between gap-4">
                  <div className="text-right">
                    <span className="text-xs text-stone-400 block">السعر شامل الخبز</span>
                    <span className="text-2xl font-black text-white font-mono tabular-nums">
                      {deal.item.price}{' '}
                      <span className="text-xs font-bold text-amber-400 font-sans">ج.م</span>
                    </span>
                  </div>

                  <button
                    onClick={() => handleOrderDeal(deal.item)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>أضف للطلب</span>
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
