import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  ArrowDownToLine, 
  Search, 
  ShieldCheck, 
  Store, 
  TrendingUp, 
  RotateCcw,
  Users,
  Bike,
  Package,
  Gift,
  BarChart3,
  Plus,
  Star
} from 'lucide-react';
import { 
  COMPARISON_ITEMS, 
  CompetitorComparisonItem, 
  calculateComparisonStats 
} from '../data/competitorData';
import { MENU_ITEMS } from '../data/menuData';
import { exportCompetitorComparisonToExcel } from '../utils/exportExcel';
import { useRestaurant, Material } from '../context/RestaurantContext';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  isEmbedded?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose, isEmbedded = false }) => {
  const { 
    captains, 
    addCaptain, 
    drivers, 
    addDriver, 
    materials, 
    updateMaterial, 
    promotions, 
    addPromotion,
    orders 
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'competitors' | 'kpis' | 'promos' | 'captains' | 'drivers' | 'stock' | 'menu' | 'reviews'>('competitors');
  
  // Competitor comparison items
  const [items, setItems] = useState<CompetitorComparisonItem[]>(COMPARISON_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // New item inputs
  const [newPromoTitle, setNewPromoTitle] = useState('');
  const [newPromoDesc, setNewPromoDesc] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('10');

  const [newCapName, setNewCapName] = useState('');
  const [newCapPhone, setNewCapPhone] = useState('');
  const [newCapTarget, setNewCapTarget] = useState('50000');
  const [newCapBaseRate, setNewCapBaseRate] = useState('2');
  const [newCapAccRate, setNewCapAccRate] = useState('4');

  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');

  if (!isOpen) return null;

  const stats = calculateComparisonStats(items);

  const filteredItems = items.filter((item) => {
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch = item.name.includes(searchQuery) || item.notes.includes(searchQuery);
    return matchCat && matchSearch;
  });

  const categories = ['all', 'الحواوشي', 'الجريل', 'الطواجن', 'المشويات', 'الفتة والشوربة'];

  const handlePriceChange = (id: string, newPrice: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, negmPrice: Math.max(1, newPrice) } : it))
    );
  };

  const handleExportExcel = () => {
    exportCompetitorComparisonToExcel(items);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const resetPrices = () => {
    setItems(COMPARISON_ITEMS);
  };

  // KPI Calculations for Captains
  const kpiData = captains.map((cap) => {
    const capOrders = orders.filter((o) => o.captainId === cap.id && o.paymentStatus === 'paid');
    const totalSales = capOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const target = cap.monthlyTarget;
    const base = cap.baseCommissionRate;
    const acc = cap.acceleratorRate;
    let comm = 0;
    if (target > 0 && totalSales > target) {
      comm = (target * (base / 100)) + ((totalSales - target) * (acc / 100));
    } else {
      comm = totalSales * (base / 100);
    }
    const achPct = target > 0 ? ((totalSales / target) * 100).toFixed(1) : '0';
    return {
      name: cap.name,
      target,
      totalSales,
      achPct,
      comm: comm.toFixed(2),
    };
  });

  const handleAddPromotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoTitle) return;
    addPromotion({
      title: newPromoTitle,
      description: newPromoDesc,
      imageUrl: '',
      discountPct: Number(newPromoDiscount) || 0,
    });
    setNewPromoTitle('');
    setNewPromoDesc('');
    alert('تم نشر العرض بنجاح على النظام!');
  };

  const handleAddCaptain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCapName) return;
    addCaptain({
      name: newCapName,
      phone: newCapPhone,
      monthlyTarget: Number(newCapTarget) || 0,
      baseCommissionRate: Number(newCapBaseRate) || 0,
      acceleratorRate: Number(newCapAccRate) || 0,
    });
    setNewCapName('');
    setNewCapPhone('');
    alert('تم حفظ الكابتن بنجاح!');
  };

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName) return;
    addDriver(newDriverName, newDriverPhone);
    setNewDriverName('');
    setNewDriverPhone('');
    alert('تم حفظ الطيار بنجاح!');
  };

  const content = (
    <div className="space-y-6 text-right font-['Cairo',sans-serif]">
      
      {/* Top Banner & Excel Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-950 p-4 rounded-2xl border border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">
              لوحة الإدارة الشاملة والتشغيل · إسلام نجم
            </h3>
            <p className="text-xs text-stone-400">
              مقارنة المنافسين، شيتات الإكسيل، حسابات العمولات، إدارة المخزن والكباتن والطيارين
            </p>
          </div>
        </div>

        <button
          onClick={handleExportExcel}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>تصدير تقرير الإكسيل الرسمي (.xlsx)</span>
          <ArrowDownToLine className="w-3.5 h-3.5" />
        </button>
      </div>

      {downloadSuccess && (
        <div className="bg-emerald-950/90 border border-emerald-500/50 p-3 rounded-xl text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>تم تنزيل ملف الإكسيل بنجاح! يحتوي على دراسة المنافسين، المنيو الكامل، وبيانات المطعم.</span>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-800 scrollbar-none">
        <button
          onClick={() => setActiveTab('competitors')}
          className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'competitors'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>مقارنة المنافسين والإكسيل</span>
        </button>

        <button
          onClick={() => setActiveTab('kpis')}
          className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'kpis'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>عمولات وتارجت الكباتن (KPIs)</span>
        </button>

        <button
          onClick={() => setActiveTab('promos')}
          className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'promos'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>العروض والبنرات</span>
        </button>

        <button
          onClick={() => setActiveTab('captains')}
          className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'captains'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>إدارة الكباتن</span>
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'drivers'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>إدارة الطيارين</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'stock'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>المخزن والخامات (جزارة السماح)</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'menu'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <span>المنيو الداخلي ({MENU_ITEMS.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'reviews'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>تقييمات العملاء ({orders.filter(o => o.rating).length})</span>
        </button>
      </div>

      {/* Tab 1: Competitors */}
      {activeTab === 'competitors' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-stone-900 border border-stone-800 p-3.5 rounded-xl text-right">
              <span className="text-[11px] text-stone-400 block mb-0.5">وفرك عن كبدة البرنس</span>
              <span className="text-xl font-black text-emerald-400 font-mono tabular-nums">
                {stats.averageSavingsVsPrince}% أرخص
              </span>
            </div>
            <div className="bg-stone-900 border border-stone-800 p-3.5 rounded-xl text-right">
              <span className="text-[11px] text-stone-400 block mb-0.5">وفرك عن حواوشي الربيع</span>
              <span className="text-xl font-black text-amber-400 font-mono tabular-nums">
                {stats.averageSavingsVsRabie}% أرخص
              </span>
            </div>
            <div className="bg-stone-900 border border-stone-800 p-3.5 rounded-xl text-right">
              <span className="text-[11px] text-stone-400 block mb-0.5">وفرك عن متوسط السوق</span>
              <span className="text-xl font-black text-teal-400 font-mono tabular-nums">
                {stats.averageSavingsVsMarket}% أقل
              </span>
            </div>
            <div className="bg-stone-900 border border-stone-800 p-3.5 rounded-xl text-right flex items-center justify-between">
              <div>
                <span className="text-[11px] text-stone-400 block mb-0.5">شيت الإكسيل</span>
                <span className="text-xs font-bold text-white">3 أوراق جاهزة</span>
              </div>
              <button
                onClick={handleExportExcel}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                تنزيل .xlsx
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-black'
                      : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                  }`}
                >
                  {cat === 'all' ? 'جميع الأقسام' : cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن صنف للمقارنة..."
                className="w-full pl-3 pr-9 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-stone-800 rounded-xl bg-stone-900/40">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-stone-950 text-stone-400 border-b border-stone-800 font-bold whitespace-nowrap">
                  <th className="p-3">الصنف</th>
                  <th className="p-3 text-center bg-amber-500/15 text-amber-300 border-x border-amber-500/20">
                    سعر نجم (اضغط للتعديل)
                  </th>
                  <th className="p-3 text-center">حواوشي الربيع</th>
                  <th className="p-3 text-center">كبدة البرنس</th>
                  <th className="p-3 text-center">مطعم الدهان</th>
                  <th className="p-3 text-center">حواوشي الرفاعي</th>
                  <th className="p-3 text-center text-teal-400">متوسط السوق</th>
                  <th className="p-3 text-center text-emerald-400">التوفير لصالحك</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {filteredItems.map((item) => {
                  const marketAvg = Math.round(
                    (item.alRabiePrice + item.elPrincePrice + item.darshPrice + item.elRefaiePrice) / 4
                  );
                  const diffVsMarket = marketAvg - item.negmPrice;
                  const savingsPct = Math.round((diffVsMarket / marketAvg) * 100);

                  return (
                    <tr key={item.id} className="hover:bg-stone-800/30">
                      <td className="p-3 font-sans">
                        <span className="font-bold text-white block">{item.name}</span>
                        <span className="text-[10px] text-stone-500">{item.unit} · {item.notes}</span>
                      </td>

                      <td className="p-2 text-center bg-amber-500/10 border-x border-amber-500/20">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={item.negmPrice}
                            onChange={(e) => handlePriceChange(item.id, Number(e.target.value))}
                            className="w-16 px-1.5 py-1 bg-black border border-amber-500/50 rounded text-center text-amber-300 font-bold font-mono text-xs focus:border-amber-400 focus:outline-none"
                          />
                          <span className="text-[10px] text-stone-400 font-sans">ج</span>
                        </div>
                      </td>

                      <td className="p-3 text-center text-stone-300">{item.alRabiePrice} ج</td>
                      <td className="p-3 text-center text-stone-300">{item.elPrincePrice} ج</td>
                      <td className="p-3 text-center text-stone-300">{item.darshPrice} ج</td>
                      <td className="p-3 text-center text-stone-300">{item.elRefaiePrice} ج</td>
                      <td className="p-3 text-center text-teal-400 font-bold">{marketAvg} ج</td>
                      <td className="p-3 text-center font-sans">
                        <span className="text-emerald-400 font-bold text-xs">
                          {diffVsMarket > 0 ? `+${diffVsMarket} ج (${savingsPct}%)` : `${diffVsMarket} ج`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: KPIs & Commissions */}
      {activeTab === 'kpis' && (
        <div className="space-y-4">
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>نظام تقرير الأداء المبيعاتي والعمولات الشهري للكباتن</span>
            </h4>
            <p className="text-xs text-stone-400">
              يتم احتساب العمولة بناءً على نسبة العمولة الأساسية، وفي حالة تخطي التارجت الشهري يتم تطبيق نسبة البونص (Accelerator) على المبيعات الإضافية تلقائياً.
            </p>
          </div>

          <div className="overflow-x-auto border border-stone-800 rounded-xl bg-stone-900/40">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-stone-950 text-stone-400 border-b border-stone-800 font-bold">
                  <th className="p-3">اسم الكابتن</th>
                  <th className="p-3 text-center">التارجت الشهري</th>
                  <th className="p-3 text-center">المبيعات المحققة</th>
                  <th className="p-3 text-center">نسبة التحقيق (%)</th>
                  <th className="p-3 text-center text-amber-400">العمولة المستحقة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {kpiData.map((cap, idx) => (
                  <tr key={idx} className="hover:bg-stone-800/30">
                    <td className="p-3 font-sans font-bold text-white">{cap.name}</td>
                    <td className="p-3 text-center">{cap.target.toLocaleString()} ج.م</td>
                    <td className="p-3 text-center text-emerald-400 font-bold">
                      {cap.totalSales.toFixed(2)} ج.م
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-200">
                        {cap.achPct}%
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-amber-400 text-sm">
                      {cap.comm} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Promotions */}
      {activeTab === 'promos' && (
        <div className="space-y-6">
          <form onSubmit={handleAddPromotion} className="p-5 bg-stone-900 border border-stone-800 rounded-2xl space-y-3 max-w-xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400" />
              <span>نشر عرض جديد على أبلكيشن وموقع العملاء</span>
            </h4>
            <div>
              <label className="text-xs text-stone-400 block mb-1">عنوان العرض:</label>
              <input
                type="text"
                value={newPromoTitle}
                onChange={(e) => setNewPromoTitle(e.target.value)}
                placeholder="مثال: عرض طاجن ليلة الخميس الملكي"
                className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs text-stone-400 block mb-1">وصف وتفاصيل العرض:</label>
              <input
                type="text"
                value={newPromoDesc}
                onChange={(e) => setNewPromoDesc(e.target.value)}
                placeholder="مثال: خصم 15% على جميع الطواجن والمشويات البلدي"
                className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95"
            >
              نشر العرض على الأبلكيشن 🚀
            </button>
          </form>

          <div className="space-y-3">
            <h5 className="text-xs font-bold text-stone-400">العروض المنشورة حالياً:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {promotions.map((p: any) => (
                <div key={p.id} className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">{p.title}</span>
                    <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                      نشط ✅
                    </span>
                  </div>
                  <p className="text-xs text-stone-300">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Captains Management */}
      {activeTab === 'captains' && (
        <div className="space-y-6">
          <form onSubmit={handleAddCaptain} className="p-5 bg-stone-900 border border-stone-800 rounded-2xl space-y-3 max-w-xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>إضافة كابتن صالة جديد</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-stone-400 block mb-1">اسم الكابتن:</label>
                <input
                  type="text"
                  value={newCapName}
                  onChange={(e) => setNewCapName(e.target.value)}
                  placeholder="مثال: كابتن حسام"
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-stone-400 block mb-1">رقم الهاتف:</label>
                <input
                  type="tel"
                  value={newCapPhone}
                  onChange={(e) => setNewCapPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-stone-400 block mb-1">التارجت الشهري:</label>
                <input
                  type="number"
                  value={newCapTarget}
                  onChange={(e) => setNewCapTarget(e.target.value)}
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-stone-400 block mb-1">العمولة (%):</label>
                <input
                  type="number"
                  value={newCapBaseRate}
                  onChange={(e) => setNewCapBaseRate(e.target.value)}
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-stone-400 block mb-1">البونص (%):</label>
                <input
                  type="number"
                  value={newCapAccRate}
                  onChange={(e) => setNewCapAccRate(e.target.value)}
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white font-mono"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95"
            >
              حفظ الكابتن 💾
            </button>
          </form>

          <div className="overflow-x-auto border border-stone-800 rounded-xl bg-stone-900/40">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-stone-950 text-stone-400 border-b border-stone-800 font-bold">
                  <th className="p-3">اسم الكابتن</th>
                  <th className="p-3">رقم الهاتف</th>
                  <th className="p-3 text-center">التارجت الشهري</th>
                  <th className="p-3 text-center">النسبة الأساسية</th>
                  <th className="p-3 text-center">نسبة البونص</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {captains.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-800/30">
                    <td className="p-3 font-sans font-bold text-white">{c.name}</td>
                    <td className="p-3 text-stone-400">{c.phone || '-'}</td>
                    <td className="p-3 text-center">{c.monthlyTarget.toLocaleString()} ج.م</td>
                    <td className="p-3 text-center text-emerald-400">{c.baseCommissionRate}%</td>
                    <td className="p-3 text-center text-amber-400">{c.acceleratorRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Drivers Management */}
      {activeTab === 'drivers' && (
        <div className="space-y-6">
          <form onSubmit={handleAddDriver} className="p-5 bg-stone-900 border border-stone-800 rounded-2xl space-y-3 max-w-xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Bike className="w-4 h-4 text-teal-400" />
              <span>إضافة طيار ديليفري جديد</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-stone-400 block mb-1">اسم الطيار:</label>
                <input
                  type="text"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  placeholder="مثال: علي دليفري"
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-stone-400 block mb-1">رقم الهاتف:</label>
                <input
                  type="tel"
                  value={newDriverPhone}
                  onChange={(e) => setNewDriverPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95"
            >
              حفظ الطيار 💾
            </button>
          </form>

          <div className="overflow-x-auto border border-stone-800 rounded-xl bg-stone-900/40">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-stone-950 text-stone-400 border-b border-stone-800 font-bold">
                  <th className="p-3">اسم الطيار</th>
                  <th className="p-3">رقم الهاتف</th>
                  <th className="p-3 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-stone-800/30">
                    <td className="p-3 font-bold text-white">{d.name}</td>
                    <td className="p-3 text-stone-400 font-mono">{d.phone || '-'}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-[10px]">
                        متاح للتوصيل ✅
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Materials & Inventory */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span>مخزون وخامات جزارة السماح للمطعم</span>
            </h4>
            <p className="text-xs text-stone-400">
              متابعة الأرصدة الحالية، تكلفة الكيلو، وتنبيهات حد الأمان لمنع أي عجز أثناء التشغيل.
            </p>
          </div>

          <div className="overflow-x-auto border border-stone-800 rounded-xl bg-stone-900/40">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-stone-950 text-stone-400 border-b border-stone-800 font-bold">
                  <th className="p-3">اسم الخامة</th>
                  <th className="p-3 text-center">الوحدة</th>
                  <th className="p-3 text-center">سعر التكلفة (ج.م)</th>
                  <th className="p-3 text-center">الرصيد المتاح</th>
                  <th className="p-3 text-center">حد الأمان</th>
                  <th className="p-3 text-center">حالة المخزن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {materials.map((m) => {
                  const isLow = m.stockQty <= m.minLimit;
                  return (
                    <tr key={m.id} className="hover:bg-stone-800/30">
                      <td className="p-3 font-sans font-bold text-white">{m.name}</td>
                      <td className="p-3 text-center font-sans text-stone-400">{m.unit}</td>
                      <td className="p-3 text-center">{m.costPerUnit} ج</td>
                      <td className="p-3 text-center font-bold text-emerald-400 text-sm">
                        {m.stockQty} {m.unit}
                      </td>
                      <td className="p-3 text-center text-stone-400">{m.minLimit} {m.unit}</td>
                      <td className="p-3 text-center font-sans">
                        {isLow ? (
                          <span className="px-2 py-0.5 rounded bg-red-950/70 text-red-300 border border-red-500/40 text-[10px]">
                            ⚠️ قرب يخلص
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-[10px]">
                            رصيد آمن ✅
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: Full Internal Menu */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-stone-800 rounded-xl bg-stone-900/40">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-stone-950 text-stone-400 border-b border-stone-800 font-bold">
                  <th className="p-3">اسم الصنف</th>
                  <th className="p-3">التصنيف</th>
                  <th className="p-3 text-center">السعر الرسمي</th>
                  <th className="p-3">الوحدة</th>
                  <th className="p-3">ملاحظات ومميزات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {MENU_ITEMS.map((dish) => (
                  <tr key={dish.id} className="hover:bg-stone-800/30">
                    <td className="p-3 font-bold text-white">{dish.name}</td>
                    <td className="p-3 text-stone-400">{dish.categoryLabel}</td>
                    <td className="p-3 text-center font-mono font-bold text-amber-400 tabular-nums">
                      {dish.price} ج.م
                    </td>
                    <td className="p-3 text-stone-400">{dish.unit || 'طلب'}</td>
                    <td className="p-3">
                      {dish.isSpecial ? (
                        <span className="text-[10px] bg-red-950/70 text-red-300 border border-red-500/30 px-2 py-0.5 rounded">
                          صنف حصري
                        </span>
                      ) : dish.isPopular ? (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                          الأكثر طلباً
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-500">صنف أساسي</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 8: Customer Reviews & Ratings */}
      {activeTab === 'reviews' && (
        <div className="space-y-5">
          {/* Summary KPIs */}
          {(() => {
            const ratedOrders = orders.filter((o) => o.rating);
            const avgFood = ratedOrders.length > 0 
              ? (ratedOrders.reduce((sum, o) => sum + (o.rating?.foodRating || 0), 0) / ratedOrders.length).toFixed(1)
              : '5.0';
            const avgDriver = ratedOrders.length > 0
              ? (ratedOrders.reduce((sum, o) => sum + (o.rating?.driverRating || 0), 0) / ratedOrders.length).toFixed(1)
              : '5.0';
            const happyPct = ratedOrders.length > 0
              ? Math.round((ratedOrders.filter((o) => (o.rating?.foodRating || 0) >= 4).length / ratedOrders.length) * 100)
              : 100;

            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-right">
                  <div className="bg-stone-900 border border-stone-800 p-3.5 rounded-xl">
                    <span className="text-[11px] text-stone-400 block mb-0.5">متوسط تقييم جودة الأكل</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <span className="text-xl font-black text-amber-400 font-mono">{avgFood}</span>
                      <span className="text-xs text-stone-500 font-sans">/ 5</span>
                    </div>
                  </div>

                  <div className="bg-stone-900 border border-stone-800 p-3.5 rounded-xl">
                    <span className="text-[11px] text-stone-400 block mb-0.5">متوسط تقييم سرعة الطيارين</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-lg">🛵</span>
                      <span className="text-xl font-black text-cyan-400 font-mono">{avgDriver}</span>
                      <span className="text-xs text-stone-500 font-sans">/ 5</span>
                    </div>
                  </div>

                  <div className="bg-stone-900 border border-stone-800 p-3.5 rounded-xl">
                    <span className="text-[11px] text-stone-400 block mb-0.5">نسبة رضا العملاء</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xl font-black text-emerald-400 font-mono">{happyPct}%</span>
                      <span className="text-[11px] text-stone-400 font-sans">تقييم إيجابي</span>
                    </div>
                  </div>

                  <div className="bg-stone-900 border border-stone-800 p-3.5 rounded-xl">
                    <span className="text-[11px] text-stone-400 block mb-0.5">إجمالي التقييمات المسجلة</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xl font-black text-white font-mono">{ratedOrders.length}</span>
                      <span className="text-xs text-stone-400 font-sans">تقييم عميل</span>
                    </div>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-black text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>سجل آراء وتقييمات العملاء المسجلة في تطبيق نجم</span>
                  </h4>

                  {ratedOrders.length === 0 ? (
                    <div className="py-8 text-center text-stone-400 space-y-2">
                      <p className="text-xs">لا توجد تقييمات مدخلة حتى الآن.</p>
                      <p className="text-[11px] text-stone-500">
                        بإمكانك تجربة شاشة التقييم الآن من خلال فتح تطبيق العميل ونقل الأوردر إلى حالة "تم التسليم بنجاح".
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ratedOrders.map((ord) => (
                        <div key={ord.id} className="p-3.5 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
                          <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-amber-400">طلب #{ord.id}</span>
                              <span className="text-stone-300 text-xs font-semibold">({ord.customerName || 'عميل التطبيق'})</span>
                              {ord.customerPhone && (
                                <span className="text-[10px] font-mono text-stone-500">({ord.customerPhone})</span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-stone-400">{ord.rating?.createdAt || ord.createdAt}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1.5 bg-stone-900/60 p-2 rounded-lg">
                              <span className="text-[11px] text-stone-400">جودة الأكل:</span>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: ord.rating?.foodRating || 5 }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                              <span className="font-mono text-stone-300 mr-1">({ord.rating?.foodRating}/5)</span>
                            </div>

                            <div className="flex items-center gap-1.5 bg-stone-900/60 p-2 rounded-lg">
                              <span className="text-[11px] text-stone-400">الطيار ({ord.driverName || 'كابتن التوصيل'}):</span>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: ord.rating?.driverRating || 5 }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                              <span className="font-mono text-stone-300 mr-1">({ord.rating?.driverRating}/5)</span>
                            </div>
                          </div>

                          {ord.rating?.comment && (
                            <div className="p-2 bg-stone-900/80 rounded-lg text-xs border border-stone-800/50">
                              <span className="text-[10px] text-stone-400 block mb-0.5">ملاحظات العميل:</span>
                              <p className="text-stone-200 text-[11px] leading-relaxed">
                                {ord.rating.comment}
                              </p>
                            </div>
                          )}

                          <div className="text-[10px] text-stone-500 flex items-center justify-between pt-1">
                            <span>الأصناف: {ord.items.map((it) => `${it.name} (x${it.qty})`).join('، ')}</span>
                            <span className="font-mono text-amber-400">{ord.totalAmount} ج.م</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 text-right">
      <div className="relative w-full max-w-6xl bg-[#141417] border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-white">لوحة الإدارة والتحكم</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {content}
        </div>
      </div>
    </div>
  );
};
