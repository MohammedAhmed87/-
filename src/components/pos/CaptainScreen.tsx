import React, { useState } from 'react';
import { ChefHat, ShoppingBag, Plus, Minus, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MENU_ITEMS, MENU_CATEGORIES } from '../../data/menuData';

export const CaptainScreen: React.FC = () => {
  const { busyTables, createOrder, captains } = useRestaurant();

  const [selectedCaptainId, setSelectedCaptainId] = useState<number>(1);
  const [selectedTable, setSelectedTable] = useState<number>(1);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [captainCart, setCaptainCart] = useState<Record<string, { id: string; name: string; price: number; qty: number }>>({});
  const [orderSentMessage, setOrderSentMessage] = useState(false);

  const currentCaptain = captains.find((c) => c.id === selectedCaptainId) || captains[0];

  const handleSelectTable = (tNum: number) => {
    const busyInfo = busyTables[tNum];
    if (busyInfo && busyInfo.captainId && busyInfo.captainId !== selectedCaptainId) {
      alert(`عفواً! هذه الطاولة محجوزة بواسطة (${busyInfo.captainName}). لا يمكنك التعديل عليها.`);
      return;
    }
    setSelectedTable(tNum);
  };

  const changeQty = (item: typeof MENU_ITEMS[0], delta: number) => {
    setCaptainCart((prev) => {
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

  const cartList = Object.values(captainCart);
  const total = cartList.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleSendOrder = () => {
    if (cartList.length === 0) {
      alert('اختر صنفاً واحداً على الأقل!');
      return;
    }

    createOrder({
      orderType: 'hall',
      tableNum: selectedTable,
      captainId: currentCaptain.id,
      captainName: currentCaptain.name,
      items: cartList,
      totalAmount: total,
    });

    setCaptainCart({});
    setOrderSentMessage(true);
    setTimeout(() => setOrderSentMessage(false), 3000);
  };

  const filteredItems = selectedDept === 'all'
    ? MENU_ITEMS
    : MENU_ITEMS.filter((i) => i.category === selectedDept);

  return (
    <div className="space-y-6 text-right font-['Cairo',sans-serif]">
      
      {/* Top Captain Bar */}
      <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400">الكابتن الحالي:</span>
          <select
            value={selectedCaptainId}
            onChange={(e) => setSelectedCaptainId(Number(e.target.value))}
            className="p-1.5 bg-stone-950 border border-stone-800 rounded-lg text-xs font-bold text-amber-400"
          >
            {captains.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-300 font-bold">شاشة كابتن الصالة المباشرة</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </div>

      {/* Success Alert */}
      {orderSentMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-between">
          <span>تم إرسال طلب طاولة {selectedTable} للمطبخ والكاشير بنجاح! 🚀</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
      )}

      {/* Tables Grid */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-amber-400 block">خريطة طاولات الصالة (اختر الطاولة):</span>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((tNum) => {
            const busyInfo = busyTables[tNum];
            const isBusy = !!busyInfo;
            const isSelected = selectedTable === tNum;

            return (
              <button
                key={tNum}
                onClick={() => handleSelectTable(tNum)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-amber-400 scale-105 shadow-lg'
                    : ''
                } ${
                  isBusy
                    ? 'bg-red-950/60 border-red-500/50 text-red-200'
                    : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                }`}
              >
                <span className="text-xs font-black block">طاولة {tNum}</span>
                <span className="text-[9px] opacity-80 block truncate">
                  {isBusy ? busyInfo.captainName : 'فارغة'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Departments Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {MENU_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedDept(cat.id)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer transition-colors ${
              selectedDept === cat.id
                ? 'bg-amber-500 text-black'
                : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredItems.map((item) => {
          const qty = captainCart[item.id]?.qty || 0;
          return (
            <div
              key={item.id}
              className="p-3 bg-stone-900 border border-stone-800 rounded-xl flex flex-col justify-between space-y-2 text-right"
            >
              <div>
                <h4 className="text-xs font-bold text-white line-clamp-1">{item.name}</h4>
                <span className="text-xs font-bold text-emerald-400 font-mono tabular-nums">
                  {item.price} ج.م
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-stone-800">
                <button
                  onClick={() => changeQty(item, -1)}
                  className="w-7 h-7 flex items-center justify-center bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-sm font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="text-xs font-mono font-bold text-white">{qty}</span>
                <button
                  onClick={() => changeQty(item, 1)}
                  className="w-7 h-7 flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl flex items-center justify-between shadow-2xl">
        <div className="text-right">
          <div className="text-xs text-stone-400">
            طاولة رقم: <span className="font-bold text-amber-400 font-mono">{selectedTable}</span> · الأصناف: <span className="font-mono">{cartList.length}</span>
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono tabular-nums">
            الإجمالي: {total.toFixed(2)} ج.م
          </div>
        </div>

        <button
          onClick={handleSendOrder}
          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>إرسال الطلب للمطبخ 🚀</span>
        </button>
      </div>

    </div>
  );
};
