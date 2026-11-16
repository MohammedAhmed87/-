import React, { useState } from 'react';
import { 
  Calculator, 
  DollarSign, 
  Package, 
  FileText, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  FileSpreadsheet,
  Save
} from 'lucide-react';
import { useRestaurant, ExpenseVoucher } from '../../context/RestaurantContext';
import * as XLSX from 'xlsx';

export const AccountantScreen: React.FC = () => {
  const { 
    materials, 
    updateMaterial, 
    savePhysicalInventoryCount, 
    expenses, 
    addExpense, 
    orders, 
    shiftSales 
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'inventory' | 'expenses' | 'pnl'>('inventory');

  // Physical inventory temporary edits
  const [physicalCounts, setPhysicalCounts] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    materials.forEach((m) => {
      map[m.id] = m.physicalCount !== undefined ? m.physicalCount : m.stockQty;
    });
    return map;
  });

  const [inventorySavedAlert, setInventorySavedAlert] = useState(false);

  // New Expense form
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseVoucher['category']>('خضار وسوق');
  const [expAmount, setExpAmount] = useState('');
  const [expPaidTo, setExpPaidTo] = useState('');
  const [expNotes, setExpNotes] = useState('');

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = shiftSales - totalExpenses;

  // Inventory variance calculations
  const inventoryVariances = materials.map((m) => {
    const counted = physicalCounts[m.id] !== undefined ? physicalCounts[m.id] : m.stockQty;
    const diff = counted - m.stockQty;
    const diffCost = diff * m.costPerUnit;
    return {
      material: m,
      counted,
      diff,
      diffCost,
    };
  });

  const totalVarianceCost = inventoryVariances.reduce((sum, v) => sum + v.diffCost, 0);

  const handleSaveInventory = () => {
    savePhysicalInventoryCount(physicalCounts);
    setInventorySavedAlert(true);
    setTimeout(() => setInventorySavedAlert(false), 3000);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expAmount) return;
    addExpense({
      title: expTitle,
      category: expCategory,
      amount: Number(expAmount) || 0,
      paidTo: expPaidTo || 'مورد محلي',
      createdBy: 'المحاسب المالي',
      notes: expNotes,
    });
    setExpTitle('');
    setExpAmount('');
    setExpPaidTo('');
    setExpNotes('');
    alert('تم حفظ سند الصرف بنجاح وتحديث حسابات الخزينة!');
  };

  const handleExportAccountantExcel = () => {
    // Sheet 1: Daily P&L & Cash summary
    const summaryRows = [
      { 'البيان المالي': 'إجمالي مبيعات اليوم المحصلة', 'القيمة (ج.م)': shiftSales },
      { 'البيان المالي': 'إجمالي المصروفات وسندات الصرف', 'القيمة (ج.م)': totalExpenses },
      { 'البيان المالي': 'صافي الأرباح التشغيلية لليوم', 'القيمة (ج.م)': netProfit },
      { 'البيان المالي': 'فروقات جرد المخزن (هدر / عجز)', 'القيمة (ج.م)': totalVarianceCost },
      { 'البيان المالي': 'تاريخ التقرير', 'القيمة (ج.م)': new Date().toLocaleString('ar-EG') },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

    // Sheet 2: Inventory Audit
    const inventoryRows = inventoryVariances.map((v, idx) => ({
      'م': idx + 1,
      'اسم الخامة': v.material.name,
      'الوحدة': v.material.unit,
      'الرصيد الدفتري (السيستم)': v.material.stockQty,
      'الجرد الفعلي المحسوب': v.counted,
      'الفارق (عجز / زيادة)': v.diff,
      'تكلفة الكيلو (ج.م)': v.material.costPerUnit,
      'القيمة المالية للفارق (ج.م)': v.diffCost.toFixed(2),
      'حالة المخزون': v.diff === 0 ? 'مطابق تماماً' : v.diff < 0 ? 'عجز في المخزن' : 'زيادة في المخزن',
    }));
    const wsInventory = XLSX.utils.json_to_sheet(inventoryRows);

    // Sheet 3: Expenses list
    const expenseRows = expenses.map((e, idx) => ({
      'م': idx + 1,
      'بند الصرف': e.title,
      'التصنيف': e.category,
      'المبلغ (ج.م)': e.amount,
      'المستلم / الصراف': e.paidTo,
      'المسجل': e.createdBy,
      'التوقيت': e.date,
    }));
    const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, 'ملخص الأرباح والخزينة');
    XLSX.utils.book_append_sheet(wb, wsInventory, 'جرد المخزون الفعلي');
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'سندات المصروفات اليومية');

    XLSX.writeFile(wb, `تقرير_محاسب_مطعم_نجم_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6 text-right font-['Cairo',sans-serif]">
      
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl text-right">
          <span className="text-xs text-stone-400 block mb-1">إجمالي المبيعات المحصلة</span>
          <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
            {shiftSales.toFixed(2)} ج.م
          </span>
          <span className="text-[11px] text-stone-500 block mt-1">شيكات مغلقة ومسددة</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl text-right">
          <span className="text-xs text-stone-400 block mb-1">المصروفات وسندات الصرف</span>
          <span className="text-2xl font-black text-red-400 font-mono tabular-nums">
            {totalExpenses.toFixed(2)} ج.م
          </span>
          <span className="text-[11px] text-stone-500 block mt-1">{expenses.length} سندات صرف</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl text-right">
          <span className="text-xs text-stone-400 block mb-1">صافي أرباح اليوم</span>
          <span className={`text-2xl font-black font-mono tabular-nums ${netProfit >= 0 ? 'text-teal-400' : 'text-red-500'}`}>
            {netProfit.toFixed(2)} ج.م
          </span>
          <span className="text-[11px] text-stone-500 block mt-1">المبيعات - المصروفات</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl text-right flex flex-col justify-between">
          <span className="text-xs text-stone-400 block mb-1">شيت تقرير المحاسبة</span>
          <button
            onClick={handleExportAccountantExcel}
            className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>تصدير إكسيل المحاسب</span>
          </button>
          <span className="text-[10px] text-stone-500 block mt-1 text-center">جرد + مصروفات + أرباح</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-1">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'inventory'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>الجرد الفعلي للمخزون (اللحوم والخامات)</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'expenses'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>سندات المصروفات اليومية والنثريات</span>
        </button>
      </div>

      {/* Tab 1: Inventory Physical Count Audit */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-stone-900/60 p-3.5 rounded-xl border border-stone-800">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <span>مقارنة الرصيد الدفتري بالرصيد الفعلي (عجز / زيادة)</span>
              </h4>
              <p className="text-xs text-stone-400 mt-0.5">
                اكتب الكميات الفعلية الموجودة على أرض الواقع بثلاجات ومخزن المطعم، والسيستم هيحسب الهدر وتكلفته.
              </p>
            </div>

            <button
              onClick={handleSaveInventory}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>اعتماد وتحديث الجرد 💾</span>
            </button>
          </div>

          {inventorySavedAlert && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-between">
              <span>تم حفظ واعتماد الجرد الفعلي بنجاح! تم تسجيل الفروقات في شيت المحاسبة.</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}

          <div className="overflow-x-auto border border-stone-800 rounded-xl bg-stone-900/40">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-stone-950 text-stone-400 border-b border-stone-800 font-bold">
                  <th className="p-3">اسم الخامة / الصنف</th>
                  <th className="p-3 text-center">الوحدة</th>
                  <th className="p-3 text-center">الرصيد بالسيستم</th>
                  <th className="p-3 text-center bg-amber-500/10 text-amber-300 border-x border-amber-500/20">
                    الجرد الفعلي (عدل هنا)
                  </th>
                  <th className="p-3 text-center">الفارق</th>
                  <th className="p-3 text-center">تكلفة الكيلو</th>
                  <th className="p-3 text-center">تكلفة الفارق (ج.م)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {inventoryVariances.map((v) => {
                  const hasDiscrepancy = Math.abs(v.diff) > 0.01;
                  return (
                    <tr key={v.material.id} className="hover:bg-stone-800/30">
                      <td className="p-3 font-sans font-bold text-white">{v.material.name}</td>
                      <td className="p-3 text-center font-sans text-stone-400">{v.material.unit}</td>
                      <td className="p-3 text-center text-stone-300">{v.material.stockQty}</td>

                      <td className="p-2 text-center bg-amber-500/10 border-x border-amber-500/20">
                        <input
                          type="number"
                          step="0.5"
                          value={v.counted}
                          onChange={(e) =>
                            setPhysicalCounts({
                              ...physicalCounts,
                              [v.material.id]: Number(e.target.value),
                            })
                          }
                          className="w-20 px-2 py-1 bg-black border border-amber-500/60 rounded text-center text-amber-300 font-bold font-mono text-xs focus:outline-none"
                        />
                      </td>

                      <td className="p-3 text-center font-sans">
                        {hasDiscrepancy ? (
                          <span className={`font-bold ${v.diff < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {v.diff > 0 ? `+${v.diff}` : v.diff} {v.material.unit}
                          </span>
                        ) : (
                          <span className="text-stone-500">مطابق (0)</span>
                        )}
                      </td>

                      <td className="p-3 text-center text-stone-400">{v.material.costPerUnit} ج</td>

                      <td className="p-3 text-center font-bold">
                        <span className={v.diffCost < 0 ? 'text-red-400' : v.diffCost > 0 ? 'text-emerald-400' : 'text-stone-500'}>
                          {v.diffCost.toFixed(2)} ج.م
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

      {/* Tab 2: Expenses Vouchers */}
      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* New Expense Form (5 cols) */}
          <form onSubmit={handleAddExpense} className="lg:col-span-5 p-5 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-stone-800 pb-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>تسجيل سند صرف ومصروفات جديدة</span>
            </h4>

            <div>
              <label className="text-xs text-stone-400 block mb-1">بيان الصرف / البند:</label>
              <input
                type="text"
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
                placeholder="مثال: فاتورة خضروات أو صيانة شواية"
                className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-stone-400 block mb-1">التصنيف:</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white"
                >
                  <option value="خضار وسوق">خضار وسوق</option>
                  <option value="صيانة ومعدات">صيانة ومعدات</option>
                  <option value="نظافة ومستهلكات">نظافة ومستهلكات</option>
                  <option value="يوميات وبوفيه">يوميات وبوفيه</option>
                  <option value="فواتير وإيجار">فواتير وإيجار</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-stone-400 block mb-1">المبلغ (ج.م):</label>
                <input
                  type="number"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-stone-400 block mb-1">المستلم / اسم المورد:</label>
              <input
                type="text"
                value={expPaidTo}
                onChange={(e) => setExpPaidTo(e.target.value)}
                placeholder="مثال: مورد الخضار أو فني الصيانة"
                className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95"
            >
              تسجيل السند وخصم من الخزينة 💸
            </button>
          </form>

          {/* Expenses List (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <h4 className="text-xs font-bold text-stone-400">سندات الصرف المسجلة لليوم ({expenses.length}):</h4>
            <div className="overflow-x-auto border border-stone-800 rounded-xl bg-stone-900/40">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-950 text-stone-400 border-b border-stone-800 font-bold">
                    <th className="p-3">بند الصرف</th>
                    <th className="p-3">التصنيف</th>
                    <th className="p-3 text-center">المبلغ</th>
                    <th className="p-3">المستلم</th>
                    <th className="p-3">التوقيت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-stone-800/30">
                      <td className="p-3 font-sans font-bold text-white">{exp.title}</td>
                      <td className="p-3 font-sans text-stone-400">
                        <span className="px-2 py-0.5 rounded bg-stone-800 text-[10px]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-red-400">
                        -{exp.amount.toFixed(2)} ج
                      </td>
                      <td className="p-3 font-sans text-stone-300">{exp.paidTo}</td>
                      <td className="p-3 font-sans text-stone-500 text-[11px]">{exp.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
