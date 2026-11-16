import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  ArrowDownToLine, 
  Search, 
  TrendingDown, 
  SlidersHorizontal, 
  HelpCircle,
  ExternalLink,
  Store,
  Sparkles
} from 'lucide-react';
import { 
  COMPARISON_ITEMS, 
  COMPETITOR_NAMES, 
  CompetitorComparisonItem, 
  calculateComparisonStats 
} from '../data/competitorData';
import { exportCompetitorComparisonToExcel } from '../utils/exportExcel';

export const CompetitorSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [items, setItems] = useState<CompetitorComparisonItem[]>(COMPARISON_ITEMS);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch = item.name.includes(searchQuery) || item.notes.includes(searchQuery);
    return matchCat && matchSearch;
  });

  const stats = calculateComparisonStats(items);

  const categories = ['all', 'الحواوشي', 'الجريل', 'الطواجن', 'المشويات', 'الفتة والشوربة'];

  const handleExportExcel = () => {
    exportCompetitorComparisonToExcel(items);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const handlePriceChange = (id: string, newPrice: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, negmPrice: Math.max(1, newPrice) } : it))
    );
  };

  const resetPrices = () => {
    setItems(COMPARISON_ITEMS);
  };

  return (
    <section id="comparison" className="py-16 bg-[#121214] border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header & Excel Download Action */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-800 text-right">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-bold">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              <span>دراسة مقارنة أسعار السوق والوجبات الشعبية</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              مقارنة أسعار مطعم نجم مع كبار المنافسين
            </h2>
            <p className="text-stone-300 text-sm sm:text-base max-w-2xl">
              بنقارن أسعار أصنافنا يومياً مع أشهر محلات الحواوشي والمشويات في مصر (حواوشي الربيع، كبدة البرنس، مطعم الدهان، حواوشي الرفاعي) عشان نضمنلك أفضل جودة جزارة بأعدل سعر.
            </p>
          </div>

          {/* Export Excel Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
              className="px-4 py-3 text-xs sm:text-sm font-semibold text-stone-300 bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span>{isSimulatorOpen ? 'إغلاق المحاكي' : 'محاكي تسعير الإدارة'}</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-6 py-3 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-950/40 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-5 h-5 text-white" />
              <span>تصدير تقرير الإكسيل (.xlsx)</span>
              <ArrowDownToLine className="w-4 h-4 text-emerald-200" />
            </button>
          </div>
        </div>

        {/* Download Success Banner */}
        {downloadSuccess && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span className="font-bold">
                تم تنزيل ملف الإكسيل بنجاح! يحتوي الملف على شيت المقارنة مع المنافسين، المنيو الكامل، وبيانات التواصل.
              </span>
            </div>
          </div>
        )}

        {/* Quick Stats KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-xl text-right">
            <span className="text-xs text-stone-400 block mb-1">متوسط وفرك عن البرنس</span>
            <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
              {stats.averageSavingsVsPrince}%
            </span>
            <span className="text-[11px] text-stone-400 block mt-1">توفير ملحوظ في الكبدة والمشويات</span>
          </div>

          <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-xl text-right">
            <span className="text-xs text-stone-400 block mb-1">متوسط وفرك عن الربيع</span>
            <span className="text-2xl font-black text-amber-400 font-mono tabular-nums">
              {stats.averageSavingsVsRabie}%
            </span>
            <span className="text-[11px] text-stone-400 block mt-1">توفير في الحواوشي والطواجن</span>
          </div>

          <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-xl text-right">
            <span className="text-xs text-stone-400 block mb-1">متوسط وفرك عن السوق كله</span>
            <span className="text-2xl font-black text-teal-400 font-mono tabular-nums">
              {stats.averageSavingsVsMarket}%
            </span>
            <span className="text-[11px] text-stone-400 block mt-1">بفضل توريد جزارة السماح المباشر</span>
          </div>

          <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-xl text-right">
            <span className="text-xs text-stone-400 block mb-1">عدد الأصناف المقارنة</span>
            <span className="text-2xl font-black text-white font-mono tabular-nums">
              {items.length} صنفاً
            </span>
            <span className="text-[11px] text-stone-400 block mt-1">تغطي كل الأطباق الرئيسية</span>
          </div>
        </div>

        {/* Competitor Overview Legend */}
        <div className="bg-stone-900/60 border border-stone-800/80 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-stone-300">
            <Store className="w-4 h-4 text-amber-500" />
            <span>المنافسين المشمولين بالدراسة:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 font-medium">
            <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              مطعم نجم (جزارة السماح) - السعر المرجعي
            </span>
            <span className="px-2.5 py-1 rounded bg-stone-800 text-stone-300 border border-stone-700">
              حواوشي الربيع (إمبابة)
            </span>
            <span className="px-2.5 py-1 rounded bg-stone-800 text-stone-300 border border-stone-700">
              كبدة البرنس (إمبابة / الشيخ زايد)
            </span>
            <span className="px-2.5 py-1 rounded bg-stone-800 text-stone-300 border border-stone-700">
              مطعم الدهان (Darshr)
            </span>
            <span className="px-2.5 py-1 rounded bg-stone-800 text-stone-300 border border-stone-700">
              حواوشي الرفاعي (عابدين)
            </span>
          </div>
        </div>

        {/* Owner Simulator Panel (Toggleable) */}
        {isSimulatorOpen && (
          <div className="p-5 bg-amber-950/20 border border-amber-500/40 rounded-2xl space-y-3 text-right">
            <div className="flex items-center justify-between">
              <button
                onClick={resetPrices}
                className="text-xs text-amber-400 underline hover:text-amber-300 cursor-pointer"
              >
                إعادة ضبط الأسعار للأسعار الأصلية
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-300">محاكي اختبار أسعار مطعم نجم</span>
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <p className="text-xs text-stone-400">
              يمكنك تعديل أسعار مطعم نجم في الجدول مباشرة بالأسفل لمعاينة تأثير التسعير الجديد على نسب التوفير التنافسية وتصديرها للإكسيل فوراً.
            </p>
          </div>
        )}

        {/* Filter Controls & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-900 border border-stone-800 rounded-xl overflow-x-auto w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'جميع الأقسام' : cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن صنف (عكاوي، كبدة، كفتة...)"
              className="w-full pl-3 pr-10 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>

        </div>

        {/* Comparison Data Table */}
        <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-900/60 shadow-xl">
          <table className="w-full text-right border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-stone-950 text-stone-400 border-b border-stone-800 font-bold whitespace-nowrap">
                <th className="p-3.5 sm:p-4">الصنف والوصف</th>
                <th className="p-3.5 sm:p-4 text-center bg-amber-500/10 text-amber-300 border-x border-amber-500/20">
                  مطعم نجم (أنت)
                </th>
                <th className="p-3.5 sm:p-4 text-center">حواوشي الربيع</th>
                <th className="p-3.5 sm:p-4 text-center">كبدة البرنس</th>
                <th className="p-3.5 sm:p-4 text-center">مطعم الدهان</th>
                <th className="p-3.5 sm:p-4 text-center">حواوشي الرفاعي</th>
                <th className="p-3.5 sm:p-4 text-center text-emerald-400">أقل سعر بالسوق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {filteredItems.map((item) => {
                const diffVsRabie = item.alRabiePrice - item.negmPrice;
                const diffVsPrince = item.elPrincePrice - item.negmPrice;
                const minPrice = Math.min(
                  item.negmPrice,
                  item.alRabiePrice,
                  item.elPrincePrice,
                  item.darshPrice,
                  item.elRefaiePrice
                );
                const isNegmCheapest = item.negmPrice <= minPrice;

                return (
                  <tr key={item.id} className="hover:bg-stone-800/40 transition-colors">
                    {/* Item Name & Details */}
                    <td className="p-3.5 sm:p-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">{item.name}</span>
                        <span className="text-[10px] text-stone-400 bg-stone-800 px-1.5 py-0.5 rounded">
                          {item.unit}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 max-w-sm">{item.notes}</p>
                    </td>

                    {/* Negm Price (Highlighted) */}
                    <td className="p-3.5 sm:p-4 text-center bg-amber-500/10 border-x border-amber-500/20 font-black font-mono tabular-nums text-base text-amber-300">
                      {isSimulatorOpen ? (
                        <input
                          type="number"
                          value={item.negmPrice}
                          onChange={(e) => handlePriceChange(item.id, Number(e.target.value))}
                          className="w-20 px-2 py-1 bg-black border border-amber-500 rounded text-center text-amber-300 font-mono text-sm"
                        />
                      ) : (
                        <span>{item.negmPrice} ج.م</span>
                      )}
                    </td>

                    {/* Al-Rabie */}
                    <td className="p-3.5 sm:p-4 text-center font-mono tabular-nums text-stone-300">
                      <div>{item.alRabiePrice} ج.م</div>
                      {diffVsRabie > 0 && (
                        <span className="text-[10px] text-emerald-400 block font-sans">
                          وفرت {diffVsRabie} ج
                        </span>
                      )}
                    </td>

                    {/* El Prince */}
                    <td className="p-3.5 sm:p-4 text-center font-mono tabular-nums text-stone-300">
                      <div>{item.elPrincePrice} ج.م</div>
                      {diffVsPrince > 0 && (
                        <span className="text-[10px] text-emerald-400 block font-sans">
                          وفرت {diffVsPrince} ج
                        </span>
                      )}
                    </td>

                    {/* Darsh / El Dahan */}
                    <td className="p-3.5 sm:p-4 text-center font-mono tabular-nums text-stone-300">
                      {item.darshPrice} ج.م
                    </td>

                    {/* El Refaie */}
                    <td className="p-3.5 sm:p-4 text-center font-mono tabular-nums text-stone-300">
                      {item.elRefaiePrice} ج.م
                    </td>

                    {/* Best Value Badge */}
                    <td className="p-3.5 sm:p-4 text-center">
                      {isNegmCheapest ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-1 rounded-md">
                          <Sparkles className="w-3 h-3" />
                          مطعم نجم الأوفر
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-400 font-medium">سعر منافس جداً</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Callout about Excel Export */}
        <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 text-right">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>جاهز تشارك الإكسيل مع الإدارة أو الحسابات؟</span>
            </h4>
            <p className="text-xs sm:text-sm text-stone-400">
              ملف الإكسيل مهيأ بالكامل ويحتوي على أوراق عمل متعددة: مقارنة المنافسين بالمعادلات، المنيو الكامل بكل الأصناف، وأرقام التواصل.
            </p>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-6 py-3 text-sm font-bold text-black bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>تحميل ملف الإكسيل الآن</span>
          </button>
        </div>

      </div>
    </section>
  );
};
