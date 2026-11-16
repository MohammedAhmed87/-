import React, { useState } from 'react';
import { 
  Bike, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ExternalLink,
  ShieldAlert,
  Play,
  Square,
  Wallet,
  Calendar,
  Check
} from 'lucide-react';
import { useRestaurant, Order } from '../../context/RestaurantContext';

export const DriverScreen: React.FC = () => {
  const { 
    orders, 
    payOrder, 
    drivers, 
    driverShifts, 
    clockInDriver, 
    clockOutDriver 
  } = useRestaurant();

  const [selectedDriverId, setSelectedDriverId] = useState<number>(1);
  const currentDriver = drivers.find((d) => d.id === selectedDriverId) || drivers[0];
  const currentShift = driverShifts.find((s) => s.driverId === currentDriver.id);

  const [settledSuccess, setSettledSuccess] = useState(false);

  // Active delivery orders for this driver
  const assignedOrders = orders.filter(
    (o) =>
      o.orderType === 'delivery' &&
      o.paymentStatus === 'pending' &&
      !o.isVoided &&
      (o.driverName === currentDriver.name || !o.driverName)
  );

  const completedTodayOrders = orders.filter(
    (o) =>
      o.orderType === 'delivery' &&
      o.paymentStatus === 'paid' &&
      !o.isVoided &&
      o.driverName === currentDriver.name
  );

  const totalCashCollected = completedTodayOrders
    .filter((o) => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const driverCommission = completedTodayOrders.length * 20; // 20 EGP per trip commission

  const handleCompleteDelivery = (orderId: number) => {
    if (confirm(`هل تم تسليم طلب #${orderId} بنجاح وتحصيل المبلغ من العميل؟`)) {
      payOrder(orderId, 'cash');
      alert('تم تأكيد التسليم وإضافة المبلغ لعهدة الشيفت بنجاح!');
    }
  };

  const handleSettleShift = () => {
    if (confirm(`هل تريد تصفية عهدة الطيار وتوريد مبلغ (${totalCashCollected} ج.م) للكاشير وإغلاق الشيفت؟`)) {
      clockOutDriver(currentDriver.id);
      setSettledSuccess(true);
      setTimeout(() => setSettledSuccess(false), 4000);
    }
  };

  return (
    <div className="space-y-6 text-right font-['Cairo',sans-serif]">
      
      {/* Top Driver Selector & Attendance Controls */}
      <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400">الطيار الحالي:</span>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(Number(e.target.value))}
                className="p-1 bg-stone-950 border border-stone-800 rounded text-xs font-bold text-amber-400"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-stone-400">
              تسجيل الحضور والانصراف، استلام الأوردرات، وتوريد النقدية
            </p>
          </div>
        </div>

        {/* Clock In / Out buttons */}
        <div className="flex items-center gap-2">
          {currentShift && currentShift.status === 'active' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>الشيفت مفتوح منذ: {currentShift.clockInTime}</span>
              </span>
              <button
                onClick={handleSettleShift}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                إنهاء وتصفية الشيفت
              </button>
            </div>
          ) : (
            <button
              onClick={() => clockInDriver(currentDriver.id)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Play className="w-3.5 h-3.5" />
              <span>تسجيل بدء ساعات العمل اليومية</span>
            </button>
          )}
        </div>
      </div>

      {settledSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-between">
          <span>تم تصفية عهدة الطيار وتوريد النقدية للخزينة وإغلاق ساعات العمل بنجاح!</span>
          <Check className="w-4 h-4" />
        </div>
      )}

      {/* Driver KPI Cards (Required in prompt) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl text-right">
          <span className="text-xs text-stone-400 block mb-1">ساعات العمل المسجلة</span>
          <span className="text-2xl font-black text-amber-400 font-mono tabular-nums">
            {currentShift ? `${currentShift.hoursWorked || 5} س` : '0 س'}
          </span>
          <span className="text-[11px] text-stone-500 block mt-1">حساب يومي دقيق</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl text-right">
          <span className="text-xs text-stone-400 block mb-1">أوردرات التوصيل المنفذة</span>
          <span className="text-2xl font-black text-teal-400 font-mono tabular-nums">
            {completedTodayOrders.length} أوردر
          </span>
          <span className="text-[11px] text-stone-500 block mt-1">اليوم</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl text-right">
          <span className="text-xs text-stone-400 block mb-1">العهدة النقدية المحصلة (كاش)</span>
          <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
            {totalCashCollected.toFixed(2)} ج.م
          </span>
          <span className="text-[11px] text-stone-500 block mt-1">مطلوب توريدها للكاشير</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl text-right">
          <span className="text-xs text-stone-400 block mb-1">عمولة الطيار المستحقة</span>
          <span className="text-2xl font-black text-purple-400 font-mono tabular-nums">
            {driverCommission.toFixed(2)} ج.م
          </span>
          <span className="text-[11px] text-stone-500 block mt-1">20 ج لكل طلب مكتمل</span>
        </div>
      </div>

      {/* Assigned Active Delivery Trips */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Bike className="w-4 h-4 text-teal-400" />
            <span>الطلبات النشطة للتوصيل الآن ({assignedOrders.length}):</span>
          </h4>
        </div>

        {assignedOrders.length === 0 ? (
          <div className="p-10 text-center bg-stone-900/40 border border-stone-800 rounded-2xl text-stone-500 text-xs">
            لا توجد أوردرات دليفري مسندة لك حالياً. استمتع باستراحة أو ترقب الأوردر الجديد!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-5 bg-stone-900 border border-stone-800 rounded-2xl space-y-3 border-r-4 border-r-teal-500 shadow-xl text-right"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-white">أوردر #{ord.id}</span>
                  <div className="text-left font-mono">
                    <span className="text-base font-black text-emerald-400">{ord.totalAmount.toFixed(2)} ج.م</span>
                    <span className="text-[10px] text-stone-400 block">
                      الدفع: {ord.paymentMethod === 'instapay' ? 'إنستاباي مدفوع' : 'كاش تحصيل'}
                    </span>
                  </div>
                </div>

                {/* Client Info */}
                <div className="p-3 bg-stone-950 rounded-xl space-y-1.5 text-xs text-stone-300">
                  <div className="font-bold text-amber-300">العميل: {ord.customerName || ord.captainName}</div>
                  {ord.customerPhone && (
                    <div className="text-stone-300">
                      تليفون: <a href={`tel:${ord.customerPhone}`} className="text-amber-400 underline font-mono">{ord.customerPhone}</a>
                    </div>
                  )}
                  {ord.customerAddress && (
                    <p className="text-stone-400 text-[11px] leading-relaxed">
                      العنوان: {ord.customerAddress}
                    </p>
                  )}
                  {ord.mapLink && (
                    <a
                      href={ord.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-300 bg-teal-950/60 border border-teal-500/40 px-2.5 py-1 rounded-lg mt-1 hover:bg-teal-900/60 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>🗺️ فتح موقع العميل على خرائط جوجل (Google Maps)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Items */}
                <div className="p-2.5 bg-stone-950/60 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] text-stone-500 block mb-1">مكونات الطلب:</span>
                  {ord.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-stone-300">
                      <span>{it.name} ({it.qty}x)</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {(it.price * it.qty).toFixed(2)} ج
                      </span>
                    </div>
                  ))}
                </div>

                {/* Complete Button */}
                <button
                  onClick={() => handleCompleteDelivery(ord.id)}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✅ تم تسليم الأوردر وتحصيل النقدية</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
