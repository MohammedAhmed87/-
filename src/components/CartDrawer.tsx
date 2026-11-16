import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  Send, 
  PhoneCall, 
  ShoppingBag, 
  MapPin, 
  CheckCircle, 
  Navigation, 
  Coins, 
  Sparkles 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useRestaurant } from '../context/RestaurantContext';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  const { getCustomerByPhone, redeemCustomerPoints, calculateDeliveryFee, createOrder } = useRestaurant();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  
  // GPS & Delivery Fee state
  const [customerLat, setCustomerLat] = useState<number | null>(null);
  const [customerLng, setCustomerLng] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(20); // default min fee
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatusText, setGpsStatusText] = useState('');

  // Loyalty Points state
  const [activeCustomer, setActiveCustomer] = useState<{ activePoints: number; pointsValueEgp: number } | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  
  const [orderSent, setOrderSent] = useState(false);

  if (!isCartOpen) return null;

  // Phone lookup for loyalty
  const handlePhoneChange = (phone: string) => {
    setCustomerPhone(phone);
    if (phone.length >= 10) {
      const cust = getCustomerByPhone(phone, customerName);
      setActiveCustomer({
        activePoints: cust.activePoints,
        pointsValueEgp: cust.pointsValueEgp,
      });
    } else {
      setActiveCustomer(null);
      setUsePoints(false);
    }
  };

  // GPS Location handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('المتصفح لا يدعم تحديد الموقع الجغرافي');
      return;
    }
    setGpsLoading(true);
    setGpsStatusText('جاري تحديد موقعك بدقة...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCustomerLat(lat);
        setCustomerLng(lng);
        const calc = calculateDeliveryFee(lat, lng);
        setDistanceKm(calc.km);
        setDeliveryFee(calc.fee);
        setGpsLoading(false);
        setGpsStatusText(`✅ تم تحديد الموقع: المسافة ${calc.km} كم | خدمة التوصيل: ${calc.fee} ج.م`);
      },
      (err) => {
        setGpsLoading(false);
        setGpsStatusText('تعذر جلب موقع GPS، تم تطبيق الحد الأدنى للتوصيل (20 ج.م)');
        setDeliveryFee(20);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Discount calculation
  const pointsDiscount = usePoints && activeCustomer ? Math.min(totalPrice + deliveryFee, activeCustomer.pointsValueEgp) : 0;
  const finalTotal = Math.max(0, totalPrice + deliveryFee - pointsDiscount);

  const handleSendWhatsApp = () => {
    if (!customerPhone.trim() || !customerAddress.trim()) {
      alert('من فضلك اكتب رقم التليفون والعنوان عشان نقدر نوصلك الطلب');
      return;
    }

    const mapLink = customerLat && customerLng 
      ? `https://www.google.com/maps?q=${customerLat},${customerLng}` 
      : '';

    // Create order in Restaurant System
    createOrder({
      orderType: 'delivery',
      tableNum: 0,
      captainName: `عميل أونلاين: ${customerName || 'عميل المحل'} (${customerPhone})`,
      customerPhone,
      customerAddress,
      mapLink,
      items: cart.map((ci) => ({ id: ci.item.id, name: ci.item.name, price: ci.item.price, qty: ci.quantity })),
      totalAmount: finalTotal,
      discountAmount: pointsDiscount,
    });

    if (usePoints && pointsDiscount > 0) {
      redeemCustomerPoints(customerPhone, Math.floor(pointsDiscount * 10));
    }

    // WhatsApp Message
    let message = `*طلب دليفري جديد من مطعم وجزارة نجم (أسم له تاريخ)* 🌟\n\n`;
    message += `👤 *العميل:* ${customerName.trim() || 'عميل المحل'}\n`;
    message += `📞 *رقم التليفون:* ${customerPhone.trim()}\n`;
    message += `📍 *العنوان:* ${customerAddress.trim()}\n`;
    if (mapLink) {
      message += `🗺️ *رابط لوكيشن الخريطة:* ${mapLink}\n`;
    }
    if (customerNotes.trim()) {
      message += `📝 *ملاحظات:* ${customerNotes.trim()}\n`;
    }
    message += `\n*تفاصيل الأوردر:*\n`;

    cart.forEach((item, index) => {
      const itemSub = item.item.price * item.quantity;
      message += `${index + 1}. ${item.item.name} × ${item.quantity} = ${itemSub} ج.م\n`;
    });

    message += `\n🛵 *خدمة التوصيل:* ${deliveryFee} ج.م ${distanceKm ? `(${distanceKm} كم)` : ''}\n`;
    if (pointsDiscount > 0) {
      message += `🎁 *خصم نقاط الولاء:* -${pointsDiscount.toFixed(2)} ج.م\n`;
    }
    message += `💰 *إجمالي الحساب المطلوب:* ${finalTotal.toFixed(2)} ج.م\n`;
    message += `\n⏰ تم التجهيز عبر موقع وتطبيق مطعم وجزارة نجم`;

    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/201070664278?text=${encoded}`;

    window.open(whatsappUrl, '_blank');
    setOrderSent(true);
    setTimeout(() => {
      setOrderSent(false);
      clearCart();
      setIsCartOpen(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-['Cairo',sans-serif]">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 left-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#161619] border-r border-stone-800 shadow-2xl flex flex-col justify-between text-right">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between">
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="إغلاق السلة"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white">سلة الطلبات والدليفري</span>
              <ShoppingBag className="w-5 h-5 text-amber-500" />
            </div>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            
            {orderSent ? (
              <div className="p-8 text-center space-y-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-black text-white">تم إرسال طلبك وتسجيله بالسيستم!</h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  تم فتح محادثة الواتساب مع كاشير ودليفري مطعم نجم (01070664278) عشان يوصلك الأكل سخن فريش.
                </p>
              </div>
            ) : cart.length === 0 ? (
              <div className="p-10 text-center space-y-3 text-stone-400">
                <ShoppingBag className="w-12 h-12 mx-auto text-stone-600" />
                <p className="text-sm font-bold text-stone-300">سلتك لسه فاضية</p>
                <p className="text-xs">تصفح المنيو واختار اللي يعجبك من الحواوشي والمشويات والطواجن البلدي.</p>
              </div>
            ) : (
              <>
                {/* Loyalty Wallet Card (From customer.html) */}
                {activeCustomer && (
                  <div className="p-3 bg-gradient-to-r from-amber-950/40 via-stone-900 to-amber-950/40 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-stone-400 block text-[11px]">نقاط الولاء المتاحة:</span>
                      <span className="font-bold text-amber-400 text-sm font-mono tabular-nums">
                        {activeCustomer.activePoints} نقطة
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-stone-400 block text-[11px]">قيمة الخصم المستحق:</span>
                      <span className="font-bold text-emerald-400 text-sm font-mono tabular-nums">
                        {activeCustomer.pointsValueEgp.toFixed(2)} ج.م
                      </span>
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <button
                      onClick={clearCart}
                      className="text-red-400 hover:text-red-300 underline cursor-pointer"
                    >
                      تفريغ السلة
                    </button>
                    <span>الأصناف المختارة ({cart.length})</span>
                  </div>

                  {cart.map((cartItem) => (
                    <div
                      key={cartItem.item.id}
                      className="p-3 bg-stone-900 border border-stone-800 rounded-xl space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          onClick={() => removeFromCart(cartItem.item.id)}
                          className="text-stone-500 hover:text-red-400 transition-colors p-1"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-white">{cartItem.item.name}</h4>
                          <span className="text-[11px] text-stone-400 font-mono tabular-nums">
                            {cartItem.item.price} ج.م للطلب
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-stone-800/60">
                        <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                          الإجمالي: {cartItem.item.price * cartItem.quantity} ج.م
                        </span>

                        <div className="flex items-center gap-1.5 bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                          <button
                            onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity - 1)}
                            className="text-stone-400 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-bold text-white w-4 text-center">
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                            className="text-stone-400 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Customer Details & GPS Delivery Fee Form */}
                <div className="pt-3 border-t border-stone-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-400">بيانات العميل وموقع التوصيل</h4>

                  <div>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="رقم الموبايل (مثال: 010xxxxxxxx)"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 font-mono text-left"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="الاسم بالكامل"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="العنوان التفصيلي (المنطقة - الشارع - رقم العمارة - الشقة)"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* GPS Button (From customer.html) */}
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={gpsLoading}
                      className="w-full py-2 bg-teal-950/60 hover:bg-teal-900/60 border border-teal-500/40 text-teal-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                      <span>{gpsLoading ? 'جاري تحديد المسافة...' : '📍 تحديد موقعي الحالي عبر GPS لحساب التوصيل'}</span>
                    </button>
                    {gpsStatusText && (
                      <p className="text-[10px] text-amber-400 text-center font-medium">
                        {gpsStatusText}
                      </p>
                    )}
                  </div>

                  {/* Loyalty Points Redemption Checkbox */}
                  {activeCustomer && activeCustomer.activePoints > 0 && (
                    <div className="flex items-center gap-2 p-2.5 bg-stone-900 border border-emerald-500/30 rounded-lg">
                      <input
                        type="checkbox"
                        id="redeemPts"
                        checked={usePoints}
                        onChange={(e) => setUsePoints(e.target.checked)}
                        className="rounded border-stone-700 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="redeemPts" className="text-xs text-emerald-300 font-bold cursor-pointer">
                        استخدام نقاط الولاء لخصم {activeCustomer.pointsValueEgp.toFixed(2)} ج.م من الفاتورة
                      </label>
                    </div>
                  )}

                  <div>
                    <input
                      type="text"
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="أي ملاحظة؟ (مثال: عيش مقرمش، شطة خفيفة)"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Footer Subtotal & Action */}
          {cart.length > 0 && !orderSent && (
            <div className="p-4 sm:p-5 border-t border-stone-800 bg-stone-950/90 space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-stone-400">
                  <span>إجمالي الوجبات:</span>
                  <span className="font-mono tabular-nums">{totalPrice.toFixed(2)} ج.م</span>
                </div>
                <div className="flex items-center justify-between text-teal-400">
                  <span>خدمة التوصيل {distanceKm ? `(${distanceKm} كم)` : ''}:</span>
                  <span className="font-mono tabular-nums">{deliveryFee.toFixed(2)} ج.م</span>
                </div>
                {pointsDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>خصم نقاط الولاء:</span>
                    <span className="font-mono tabular-nums">-{pointsDiscount.toFixed(2)} ج.م</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-black text-white pt-2 border-t border-stone-800">
                  <span>الإجمالي المطلوب:</span>
                  <span className="text-xl font-black text-amber-400 font-mono tabular-nums">
                    {finalTotal.toFixed(2)} <span className="text-xs font-sans">ج.م</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-1">
                <button
                  onClick={handleSendWhatsApp}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-95 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال الطلب عبر الواتساب فوراً</span>
                </button>

                <a
                  href="tel:01070664278"
                  className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>أو اطلب تليفونياً: 01070664278</span>
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
