import React, { useState } from 'react';
import { 
  DollarSign, 
  Receipt, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Bike, 
  ChefHat, 
  Plus, 
  Minus, 
  ShoppingBag,
  Users,
  CreditCard,
  Smartphone,
  Banknote,
  Percent,
  XCircle,
  Lock,
  FileSpreadsheet
} from 'lucide-react';
import { useRestaurant, Order, PaymentMethod } from '../../context/RestaurantContext';
import { MENU_ITEMS, MENU_CATEGORIES } from '../../data/menuData';

export const CashierScreen: React.FC = () => {
  const { 
    orders, 
    busyTables, 
    createOrder, 
    updateOrderStatus, 
    payOrder, 
    voidOrderWithApproval,
    shiftSales, 
    shiftPaidCount,
    captains,
    drivers 
  } = useRestaurant();

  const [orderType, setOrderType] = useState<'hall' | 'takeaway' | 'delivery'>('hall');
  const [tableNum, setTableNum] = useState<number>(1);
  const [captainId, setCaptainId] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [cashierCart, setCashierCart] = useState<Record<string, { id: string; name: string; price: number; qty: number }>>({});
  
  // Payment method selection & Discount
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  const [discountPct, setDiscountPct] = useState<number>(0);

  // Void modal state
  const [voidModalOrderId, setVoidModalOrderId] = useState<number | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [managerPin, setManagerPin] = useState('');
  const [voidError, setVoidError] = useState('');

  // Shift Close (Z-Report) modal
  const [showZReport, setShowZReport] = useState(false);

  // Printing receipt state
  const [activePrintOrder, setActivePrintOrder] = useState<Order | null>(null);

  const filteredMenuItems = selectedDept === 'all' 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter((i) => i.category === selectedDept);

  const changeCartQty = (item: typeof MENU_ITEMS[0], delta: number) => {
    setCashierCart((prev) => {
      const current = prev[item.id] || { id: item.id, name: item.name, price: item.price, qty: 0 };
      const nextQty = current.qty + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      }
      return { ...prev, [item.id]: { ...current, qty: nextQty } };
    });
  };

  const cartItemsList = Object.values(cashierCart);
  const cartSubtotal = cartItemsList.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountVal = (cartSubtotal * discountPct) / 100;
  const cartTotal = Math.max(0, cartSubtotal - discountVal);

  const handleSubmitCashierOrder = () => {
    if (cartItemsList.length === 0) {
      alert('اختر صنفاً واحداً على الأقل!');
      return;
    }

    const selectedCap = captains.find((c) => c.id === Number(captainId));

    createOrder({
      orderType,
      tableNum: orderType === 'hall' ? tableNum : 0,
      captainId: selectedCap ? selectedCap.id : undefined,
      captainName: selectedCap ? selectedCap.name : 'الكاشير / طلب مباشر',
      paymentMethod: selectedPaymentMethod,
      items: cartItemsList,
      totalAmount: cartTotal,
      discountAmount: discountVal,
    });

    setCashierCart({});
    setDiscountPct(0);
    alert('تم إرسال الأوردر للمطبخ بنجاح!');
  };

  const handlePayAndPrint = (order: Order) => {
    payOrder(order.id, selectedPaymentMethod);
    setActivePrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleConfirmVoid = () => {
    if (!voidModalOrderId) return;
    if (!voidReason.trim()) {
      setVoidError('اكتب سبب الإلغاء');
      return;
    }
    const result = voidOrderWithApproval(voidModalOrderId, voidReason, managerPin);
    if (!result.success) {
      setVoidError(result.error || 'خطأ في كود المدير');
      return;
    }
    alert(`تم إلغاء طلب #${voidModalOrderId} بنجاح بموافقة الإدارة!`);
    setVoidModalOrderId(null);
    setVoidReason('');
    setManagerPin('');
    setVoidError('');
  };

  const activeOrders = orders.filter((o) => o.paymentStatus === 'pending' && !o.isVoided);
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid' && !o.isVoided);

  // Payment breakdown
  const cashTotal = paidOrders.filter((o) => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.totalAmount, 0);
  const instapayTotal = paidOrders.filter((o) => o.paymentMethod === 'instapay').reduce((sum, o) => sum + o.totalAmount, 0);
  const cardTotal = paidOrders.filter((o) => o.paymentMethod === 'card').reduce((sum, o) => sum + o.totalAmount, 0);
  const walletTotal = paidOrders.filter((o) => o.paymentMethod === 'wallet').reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="space-y-6 text-right font-['Cairo',sans-serif]">
      
      {/* Shift Overview Bar with Z-Report Trigger */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="p-2.5 bg-stone-950 rounded-lg border border-stone-800">
            <span className="text-stone-400 block mb-0.5">مبيعات الشيفت المحصلة:</span>
            <span className="text-xl font-black text-emerald-400 font-mono tabular-nums">
              {shiftSales.toFixed(2)} ج.م
            </span>
          </div>
          <div className="p-2.5 bg-stone-950 rounded-lg border border-stone-800">
            <span className="text-stone-400 block mb-0.5">نقدية الدرج (كاش):</span>
            <span className="text-xl font-black text-amber-400 font-mono tabular-nums">
              {cashTotal.toFixed(2)} ج.م
            </span>
          </div>
          <div className="p-2.5 bg-stone-950 rounded-lg border border-stone-800">
            <span className="text-stone-400 block mb-0.5">إنستاباي ومحافظ:</span>
            <span className="text-xl font-black text-teal-400 font-mono tabular-nums">
              {(instapayTotal + walletTotal).toFixed(2)} ج.م
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowZReport(true)}
          className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-amber-400 border border-amber-500/40 font-bold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <Receipt className="w-4 h-4 text-amber-400" />
          <span>تقفيل الشيفت وإصدار (Z-Report)</span>
        </button>
      </div>

      {/* 3 Columns Layout: POS Creator | Active Orders | Tables Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Col 1: POS Creator (5 cols) */}
        <div className="lg:col-span-5 bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <span>إنشاء أوردر كاشير سريع</span>
            </h3>
            <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
              POS كاشير
            </span>
          </div>

          {/* Type & Table */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-400 block mb-1">نوع الطلب:</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as any)}
                className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white"
              >
                <option value="hall">🍽️ صالة داخلية</option>
                <option value="takeaway">🛍️ تيك أواي سفري</option>
                <option value="delivery">🛵 ديليفري</option>
              </select>
            </div>

            {orderType === 'hall' && (
              <div>
                <label className="text-xs text-stone-400 block mb-1">رقم الطاولة (1-12):</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={tableNum}
                  onChange={(e) => setTableNum(Number(e.target.value))}
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-amber-400 font-mono font-bold"
                />
              </div>
            )}
          </div>

          {/* Payment Method Selector (Required in user request) */}
          <div>
            <label className="text-xs text-stone-400 block mb-1">طريقة الدفع:</label>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('cash')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                  selectedPaymentMethod === 'cash'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-stone-950 text-stone-400 border-stone-800'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>كاش نقدية</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('instapay')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                  selectedPaymentMethod === 'instapay'
                    ? 'bg-purple-600 text-white border-purple-500'
                    : 'bg-stone-950 text-stone-400 border-stone-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>إنستاباي</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('card')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                  selectedPaymentMethod === 'card'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-stone-950 text-stone-400 border-stone-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>فيزا / كارت</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('wallet')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                  selectedPaymentMethod === 'wallet'
                    ? 'bg-red-600 text-white border-red-500'
                    : 'bg-stone-950 text-stone-400 border-stone-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>محفظة كاش</span>
              </button>
            </div>
          </div>

          {/* Department scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {MENU_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedDept(cat.id)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                  selectedDept === cat.id
                    ? 'bg-amber-500 text-black'
                    : 'bg-stone-950 text-stone-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Menu items compact list */}
          <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 bg-stone-950/60 rounded-xl border border-stone-800/80">
            {filteredMenuItems.map((item) => {
              const currentQty = cashierCart[item.id]?.qty || 0;
              return (
                <div
                  key={item.id}
                  className="p-2 bg-stone-900 border border-stone-800 rounded-lg flex flex-col justify-between text-right"
                >
                  <span className="text-xs font-bold text-white truncate">{item.name}</span>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-amber-400 font-mono font-bold">
                      {item.price} ج
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => changeCartQty(item, -1)}
                        className="w-5 h-5 flex items-center justify-center bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-xs"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-bold w-4 text-center">
                        {currentQty}
                      </span>
                      <button
                        onClick={() => changeCartQty(item, 1)}
                        className="w-5 h-5 flex items-center justify-center bg-amber-500 text-black font-bold rounded text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cashier Discount Selector (5%, 10%) */}
          <div className="flex items-center justify-between bg-stone-950 p-2.5 rounded-xl border border-stone-800 text-xs">
            <span className="text-stone-400 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-amber-400" />
              <span>خصم الكاشير المسموح:</span>
            </span>
            <div className="flex items-center gap-1">
              {[0, 5, 10].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDiscountPct(pct)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                    discountPct === pct
                      ? 'bg-amber-500 text-black'
                      : 'bg-stone-900 text-stone-400'
                  }`}
                >
                  {pct === 0 ? 'بدون' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Cart Footer */}
          <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-400 block">الإجمالي بعد الخصم:</span>
              <span className="text-xl font-black text-emerald-400 font-mono tabular-nums">
                {cartTotal.toFixed(2)} ج.م
              </span>
            </div>
            <button
              onClick={handleSubmitCashierOrder}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <ChefHat className="w-4 h-4" />
              <span>إرسال الأوردر 🚀</span>
            </button>
          </div>
        </div>

        {/* Col 2: Active Orders & Void with Manager Approval (4 cols) */}
        <div className="lg:col-span-4 bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>الطلبات النشطة ({activeOrders.length})</span>
            </h3>
          </div>

          <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
            {activeOrders.length === 0 ? (
              <p className="text-center text-xs text-stone-500 py-10">لا توجد طلبات مفتوحة حالياً.</p>
            ) : (
              activeOrders.map((ord) => {
                const isHall = ord.orderType === 'hall';
                return (
                  <div
                    key={ord.id}
                    className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-2 border-r-4 border-r-amber-500 text-right"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        طلب #{ord.id} ({isHall ? `طاولة ${ord.tableNum}` : ord.orderType})
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">
                          {ord.paymentMethod === 'instapay'
                            ? 'إنستاباي'
                            : ord.paymentMethod === 'card'
                            ? 'فيزا'
                            : ord.paymentMethod === 'wallet'
                            ? 'محفظة'
                            : 'كاش'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            ord.orderStatus === 'ready'
                              ? 'bg-amber-500/20 text-amber-300'
                              : ord.orderStatus === 'on_the_way'
                              ? 'bg-teal-500/20 text-teal-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {ord.orderStatus === 'ready'
                            ? '✅ جاهز'
                            : ord.orderStatus === 'on_the_way'
                            ? '🛵 مع الطيار'
                            : '👨‍🍳 بالمطبخ'}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-400">{ord.captainName}</p>

                    {/* Items preview */}
                    <div className="p-2 bg-stone-900/60 rounded text-[11px] space-y-1">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-stone-300">
                          <span>{it.name} ({it.qty}x)</span>
                          <span className="font-mono text-emerald-400">
                            {(it.price * it.qty).toFixed(2)} ج
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-xs font-bold text-emerald-400 font-mono">
                        {ord.totalAmount.toFixed(2)} ج.م
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Void button with manager PIN */}
                        <button
                          onClick={() => setVoidModalOrderId(ord.id)}
                          className="px-2 py-1 bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-500/30 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          title="إلغاء الطلب يتطلب موافقة المدير"
                        >
                          <Lock className="w-3 h-3" />
                          <span>إلغاء</span>
                        </button>

                        <button
                          onClick={() => handlePayAndPrint(ord)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>تحصيل وشيك</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Col 3: Tables Monitor (3 cols) */}
        <div className="lg:col-span-3 bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              <span>مراقبة صالة الطاولات (1-12)</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((tNum) => {
              const busyInfo = busyTables[tNum];
              const isBusy = !!busyInfo;

              return (
                <div
                  key={tNum}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isBusy
                      ? 'bg-red-950/60 border-red-500/40 text-red-200'
                      : 'bg-emerald-950/50 border-emerald-500/30 text-emerald-200'
                  }`}
                >
                  <span className="text-xs font-black block">طاولة {tNum}</span>
                  <span className="text-[10px] opacity-80 block truncate mt-0.5">
                    {isBusy ? busyInfo.captainName : 'شاغرة'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Manager Void Approval Modal (Strict Security Rule) */}
      {voidModalOrderId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#161619] border border-red-500/50 rounded-2xl p-5 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <span className="text-xs text-red-400 font-bold flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-red-400" />
                <span>إذن موافقة المدير لإلغاء طلب #{voidModalOrderId}</span>
              </span>
              <button
                onClick={() => setVoidModalOrderId(null)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-300">
              قاعدة أمان المطعم: لا يمكن للكاشير إلغاء أي فاتورة بعد خروجها إلا بموافقة وباسوورد مدير المطعم (إسلام نجم).
            </p>

            <div>
              <label className="text-xs text-stone-400 block mb-1">سبب الإلغاء:</label>
              <input
                type="text"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="مثال: الزبون لغى، أو خطأ في التسجيل"
                className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-stone-400 block mb-1">رمز PIN المدير (1234):</label>
              <input
                type="password"
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
                placeholder="****"
                className="w-full p-2 bg-stone-950 border border-red-500/40 rounded-lg text-xs text-center font-mono text-white text-lg tracking-widest"
              />
              {voidError && <span className="text-[11px] text-red-400 mt-1 block">{voidError}</span>}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmVoid}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
              >
                تأكيد الإلغاء بموافقة الإدارة
              </button>
              <button
                type="button"
                onClick={() => setVoidModalOrderId(null)}
                className="px-3 py-2 bg-stone-800 text-stone-300 rounded-xl text-xs"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Z-Report Modal */}
      {showZReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#161619] border border-amber-500/40 rounded-2xl p-5 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <span className="text-sm font-black text-amber-400 flex items-center gap-1.5">
                <Receipt className="w-4 h-4" />
                <span>تقرير تقفيل الشيفت (Z-Report)</span>
              </span>
              <button onClick={() => setShowZReport(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-stone-950 rounded">
                <span className="text-stone-400">إجمالي المبيعات المحصلة:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{shiftSales.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between p-2 bg-stone-950 rounded">
                <span className="text-stone-400">التحصيل النقدي (كاش بالدرج):</span>
                <span className="font-mono font-bold text-amber-400">{cashTotal.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between p-2 bg-stone-950 rounded">
                <span className="text-stone-400">تحويلات إنستاباي:</span>
                <span className="font-mono font-bold text-purple-400">{instapayTotal.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between p-2 bg-stone-950 rounded">
                <span className="text-stone-400">كروت بنكية وفيزا:</span>
                <span className="font-mono font-bold text-blue-400">{cardTotal.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between p-2 bg-stone-950 rounded">
                <span className="text-stone-400">محافظ إلكترونية (فودافون كاش):</span>
                <span className="font-mono font-bold text-red-400">{walletTotal.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between p-2 bg-stone-950 rounded">
                <span className="text-stone-400">إجمالي الشيكات المقفلة:</span>
                <span className="font-mono font-bold text-white">{shiftPaidCount} شيك</span>
              </div>
            </div>

            <button
              onClick={() => {
                window.print();
                alert('تم اعتماد تقفيل الشيفت وطباعة تقرير Z-Report بنجاح!');
                setShowZReport(false);
              }}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs rounded-xl"
            >
              طباعة التقرير وتسليم الخزينة 🖨️
            </button>
          </div>
        </div>
      )}

      {/* Hidden Thermal Receipt Print Section (72mm print styling) */}
      {activePrintOrder && (
        <div id="receiptPrintArea" className="hidden print:block print:w-[72mm] print:text-black print:bg-white print:p-2 print:text-xs">
          <div className="text-center pb-2 border-b border-black">
            <h2 className="text-base font-bold">مطعم وجزارة نجم</h2>
            <p className="text-[10px]">جزارة السماح · أسم له تاريخ</p>
            <p className="text-[9px]">شارع ٢ من شارع طلعت حرب</p>
            <p className="text-[9px]">ت: 0237122328 / 01070664278</p>
          </div>
          <div className="text-center font-mono font-bold my-1 text-xs">
            INV-{String(activePrintOrder.id).padStart(6, '0')}
          </div>
          <div className="text-[10px] my-1">
            <p>النوع: {activePrintOrder.orderType === 'hall' ? `صالة طاولة ${activePrintOrder.tableNum}` : activePrintOrder.orderType}</p>
            <p>المسئول: {activePrintOrder.captainName}</p>
            <p>طريقة الدفع: {activePrintOrder.paymentMethod === 'instapay' ? 'إنستاباي' : activePrintOrder.paymentMethod === 'card' ? 'فيزا' : activePrintOrder.paymentMethod === 'wallet' ? 'محفظة' : 'نقدية'}</p>
            <p>التاريخ: {new Date().toLocaleString('ar-EG')}</p>
          </div>
          <hr className="border-t border-black my-1" />
          <table className="w-full text-right text-[10px]">
            <thead>
              <tr className="border-b border-black">
                <th>الصنف</th>
                <th className="text-center">الكمية</th>
                <th className="text-left">السعر</th>
              </tr>
            </thead>
            <tbody>
              {activePrintOrder.items.map((it, idx) => (
                <tr key={idx}>
                  <td>{it.name}</td>
                  <td className="text-center">{it.qty}</td>
                  <td className="text-left font-mono">{(it.price * it.qty).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr className="border-t border-black my-1" />
          <div className="flex justify-between font-bold text-xs my-1">
            <span>الإجمالي المستحق:</span>
            <span className="font-mono">{activePrintOrder.totalAmount.toFixed(2)} ج.م</span>
          </div>
          <p className="text-center text-[9px] mt-2">شكراً لزيارتكم مطعم وجزارة نجم!</p>
        </div>
      )}

    </div>
  );
};
