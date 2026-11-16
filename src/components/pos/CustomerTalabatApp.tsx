import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  Navigation, 
  Sparkles, 
  Clock, 
  Flame, 
  Star, 
  ArrowRight, 
  CheckCircle2, 
  PhoneCall, 
  Send, 
  Coins, 
  CreditCard, 
  Smartphone, 
  Banknote,
  RotateCcw,
  Check,
  Bell,
  Volume2,
  X,
  Play,
  Pause,
  AlertCircle,
  ThumbsUp,
  MessageSquare,
  Award,
  Heart,
  Timer,
  FastForward,
  Gauge,
  Map as MapIcon,
  Compass,
  Layers,
  BellOff,
  Package,
  GripVertical,
  FileDown,
  Printer,
  ArrowUp,
  ArrowDown,
  Trash2,
  Filter,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';
import { MENU_ITEMS, MENU_CATEGORIES, MenuItem } from '../../data/menuData';
import { useRestaurant, PaymentMethod, Order } from '../../context/RestaurantContext';
import { 
  LiveOrderTrackingMap, 
  ROUTE_WAYPOINTS, 
  getPositionAlongRoute, 
  calculateGeodesicDistanceMeters 
} from './LiveOrderTrackingMap';

interface CustomerTalabatAppProps {
  onBackToWebsite: () => void;
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  status: Order['orderStatus'] | 'proximity_alert';
  icon: string;
  time: string;
  isSilent?: boolean;
  distanceMeters?: number;
}

// High-fidelity food photography placeholder mapping for Egyptian grill & butchery items
const CATEGORY_PLACEHOLDERS: Record<string, { image: string; emoji: string }> = {
  hawawshi: {
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=320&q=80',
    emoji: '🥩',
  },
  grill: {
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=320&q=80',
    emoji: '🔥',
  },
  tawajin: {
    image: 'https://images.unsplash.com/photo-1547928576-a4a33237cbc3?auto=format&fit=crop&w=320&q=80',
    emoji: '🍲',
  },
  mashweyat: {
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=320&q=80',
    emoji: '🍢',
  },
  fatteh: {
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=320&q=80',
    emoji: '🍚',
  },
  pasta: {
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=320&q=80',
    emoji: '🍝',
  },
  rice_soup: {
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=320&q=80',
    emoji: '🥣',
  },
  salads: {
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=320&q=80',
    emoji: '🥗',
  },
};

const FALLBACK_FOOD_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%231c1917'/%3E%3Ccircle cx='50' cy='50' r='36' fill='%23292524' stroke='%23d97706' stroke-width='3' stroke-dasharray='4 2'/%3E%3Ctext x='50' y='58' font-size='32' text-anchor='middle'%3E🥩%3C/text%3E%3C/svg%3E";

const getItemPlaceholderImage = (item: MenuItem): string => {
  if (item.image) return item.image;
  return CATEGORY_PLACEHOLDERS[item.category]?.image || CATEGORY_PLACEHOLDERS.grill.image;
};

const getCategoryEmoji = (category: string): string => {
  return CATEGORY_PLACEHOLDERS[category]?.emoji || '🥩';
};

export const CustomerTalabatApp: React.FC<CustomerTalabatAppProps> = ({ onBackToWebsite }) => {
  const { 
    createOrder, 
    orders, 
    updateOrderStatus,
    submitOrderRating,
    getCustomerByPhone, 
    redeemCustomerPoints, 
    calculateDeliveryFee, 
    promotions 
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'home' | 'menu' | 'favorites' | 'track' | 'wallet'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Favorites State with persistence
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('negm_customer_favorites');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['h1', 'g1', 't1']; // Initial delicious favorites: حواوشي مخصوص، كبدة بلدي، طاجن عكاوي
  });

  // Drag and drop state for favorites list reordering
  const [draggedFavIdx, setDraggedFavIdx] = useState<number | null>(null);
  const [dragOverFavIdx, setDragOverFavIdx] = useState<number | null>(null);
  const [showFavoritesPDFModal, setShowFavoritesPDFModal] = useState<boolean>(false);
  const [favoriteCategoryFilter, setFavoriteCategoryFilter] = useState<string>('all');
  const [favoriteSortBy, setFavoriteSortBy] = useState<'custom' | 'price_asc' | 'price_desc' | 'alphabetical'>('custom');

  useEffect(() => {
    try {
      localStorage.setItem('negm_customer_favorites', JSON.stringify(favoriteIds));
    } catch {}
  }, [favoriteIds]);

  // Reorder favorites list on drag & drop or button click
  const handleReorderFavorites = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
    setFavoriteSortBy('custom');
    setFavoriteIds((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      return copy;
    });

    playOrderChime('ready');
    const newToast: ToastNotification = {
      id: `${Date.now()}-reorder`,
      title: '✨ تم إعادة ترتيب قائمتك المفضلة!',
      message: 'تم حفظ ترتيبك المخصص للأصناف تلقائياً.',
      status: 'ready',
      icon: '↕️',
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 2)]);
    setTimeout(() => removeToast(newToast.id), 3500);
  };

  const moveFavorite = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= favoriteIds.length) return;
    handleReorderFavorites(index, targetIdx);
  };

  const toggleFavorite = (itemId: string, itemName?: string) => {
    const isFav = favoriteIds.includes(itemId);
    const updated = isFav ? favoriteIds.filter((id) => id !== itemId) : [...favoriteIds, itemId];
    setFavoriteIds(updated);

    // Audio sound wave feedback
    playOrderChime(isFav ? 'pending' : 'preparing');

    const newToast: ToastNotification = {
      id: `${Date.now()}-fav`,
      title: isFav ? 'تمت الإزالة من المفضلة' : '❤️ أضيف إلى المفضلة!',
      message: isFav
        ? `تمت إزالة ${itemName || 'الصنف'} من قائمتك المفضلة.`
        : `تم حفظ ${itemName || 'الصنف'} في المفضلة لطلب أسرع في أي وقت!`,
      status: 'ready',
      icon: isFav ? '🤍' : '❤️',
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setToasts((prev) => [newToast, ...prev.slice(0, 3)]);
    setTimeout(() => {
      removeToast(newToast.id);
    }, 4500);
  };

  const addAllFavoritesToCart = () => {
    const favoriteItems = MENU_ITEMS.filter((i) => favoriteIds.includes(i.id));
    if (favoriteItems.length === 0) return;

    setAppCart((prev) => {
      const copy = { ...prev };
      favoriteItems.forEach((item) => {
        const current = copy[item.id] || { item, qty: 0 };
        copy[item.id] = { item, qty: current.qty + 1 };
      });
      return copy;
    });

    playOrderChime('ready');
    const newToast: ToastNotification = {
      id: `${Date.now()}-all-favs`,
      title: '🛒 تم إضافة كل المفضلات إلى السلة!',
      message: `تم إضافة ${favoriteItems.length} صنف مفضل إلى سلة طلبك بنجاح!`,
      status: 'ready',
      icon: '🎉',
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 3)]);
    setTimeout(() => removeToast(newToast.id), 4500);
  };
  
  // App Cart
  const [appCart, setAppCart] = useState<Record<string, { item: MenuItem; qty: number }>>({});
  
  // Customer details
  const [phone, setPhone] = useState('01070664278');
  const [name, setName] = useState('محمد أحمد');
  const [address, setAddress] = useState('شارع طلعت حرب - عمارة 12 الدور الرابع');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [usePoints, setUsePoints] = useState(false);

  // GPS Customer Destination Coordinates (Downtown Cairo - Talaat Harb)
  const [lat, setLat] = useState<number | null>(30.05920);
  const [lng, setLng] = useState<number | null>(31.23350);
  const proximityAlertFiredRef = useRef<Record<number, boolean>>({});
  const [deliveryInfo, setDeliveryInfo] = useState({ km: 2.5, fee: 20, estimatedMinutes: 30 });
  const [orderPlacedId, setOrderPlacedId] = useState<number | null>(102);

  // Toast Notifications & Audio
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Dynamic Progress Bar States (Elapsed time in seconds)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(720); // 12 mins default for demo view
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [timerMultiplier, setTimerMultiplier] = useState<number>(1); // 1x or 10x speed multiplier
  const [trackViewMode, setTrackViewMode] = useState<'map' | 'progress' | 'both'>('both');

  // Quick Rating Screen states
  const [foodRating, setFoodRating] = useState<number>(5);
  const [driverRating, setDriverRating] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submittedRatingOrderId, setSubmittedRatingOrderId] = useState<number | null>(null);
  const [isEditingRating, setIsEditingRating] = useState<boolean>(false);

  const customerProfile = getCustomerByPhone(phone, name);

  // Audio Chime generator using Web Audio API
  const playOrderChime = (status: Order['orderStatus']) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      let freqs = [523.25, 659.25, 783.99]; // Default C major triad
      if (status === 'preparing') {
        freqs = [440, 554.37, 659.25, 880]; // Lively grilling theme
      } else if (status === 'on_the_way') {
        freqs = [587.33, 739.99, 880, 1174.66]; // Fast motorcycle theme
      } else if (status === 'delivered') {
        freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // Fanfare
      }

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.2, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.5);
      });
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Silent Proximity Alert Trigger (< 500 meters from customer lat/lng)
  const triggerProximitySilentAlert = (distanceM: number) => {
    if (!trackingOrder) return;
    proximityAlertFiredRef.current[trackingOrder.id] = true;

    // 1. Silent Haptic Vibration for mobile devices (strictly no audio sound)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([160, 70, 160]);
      } catch {}
    }

    // 2. Silent Web Browser Notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🔕 تنبيه اقتراب صامت من مطعم وجزارة نجم', {
          body: `كابتن التوصيل ${trackingOrder.driverName || 'أحمد سعيد'} أصبح على بُعد ${distanceM} متر فقط من موقعك! جهز نفسك للاستلام.`,
          icon: '/favicon.ico',
          silent: true,
        });
      } catch {}
    }

    // 3. Silent Floating Toast Notification (no playOrderChime called!)
    const newToast: ToastNotification = {
      id: `prox-${trackingOrder.id}-${Date.now()}`,
      title: '🔕 تنبيه اقتراب صامت (أقل من 500 متر)',
      message: `كابتن التوصيل ${trackingOrder.driverName || 'أحمد سعيد'} أصبح على بُعد ${distanceM} متر فقط من عنوانك المحدد (${address.slice(0, 30)}). جهز نفسك لاستلام طلبك ساخناً!`,
      status: 'proximity_alert',
      icon: '🔕',
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isSilent: true,
      distanceMeters: distanceM,
    };

    setToasts((prev) => [newToast, ...prev]);
    setTimeout(() => {
      removeToast(newToast.id);
    }, 8000);
  };

  const cartList = Object.values(appCart);
  const subtotal = cartList.reduce((sum, ci) => sum + ci.item.price * ci.qty, 0);
  const pointsDiscount = usePoints ? Math.min(subtotal + deliveryInfo.fee, customerProfile.pointsValueEgp) : 0;
  const totalDue = Math.max(0, subtotal + deliveryInfo.fee - pointsDiscount);

  const addToCart = (item: MenuItem) => {
    setAppCart((prev) => {
      const current = prev[item.id] || { item, qty: 0 };
      return { ...prev, [item.id]: { item, qty: current.qty + 1 } };
    });
  };

  const updateQty = (itemId: string, delta: number) => {
    setAppCart((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      const nextQty = current.qty + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: { ...current, qty: nextQty } };
    });
  };

  const handlePlaceOrder = () => {
    if (cartList.length === 0) {
      alert('اختر وجبة واحدة على الأقل');
      return;
    }

    const newOrd = createOrder({
      orderType: 'delivery',
      tableNum: 0,
      captainName: `أبلكيشن نجم: ${name} (${phone})`,
      customerName: name,
      customerPhone: phone,
      customerAddress: address,
      paymentMethod: selectedPayment,
      totalAmount: totalDue,
      discountAmount: pointsDiscount,
      items: cartList.map((c) => ({ id: c.item.id, name: c.item.name, price: c.item.price, qty: c.qty })),
      estimatedDeliveryMinutes: deliveryInfo.estimatedMinutes,
      mapLink: lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : undefined,
    });

    if (usePoints && pointsDiscount > 0) {
      redeemCustomerPoints(phone, Math.floor(pointsDiscount * 10));
    }

    setOrderPlacedId(newOrd.id);
    setAppCart({});
    setElapsedSeconds(60); // Reset timer for new active order
    setIsTimerPaused(false);
    setActiveTab('track');
    alert('تم إرسال طلبك بنجاح! يمكنك الآن تتبع خط سير الأوردر لحظة بلحظة.');
  };

  // Find tracking order
  const trackingOrder = orders.find((o) => o.id === orderPlacedId) || orders[0];

  // Listen for order status transitions and pop Toast with Chime
  const prevStatusRef = useRef<string | undefined>(trackingOrder?.orderStatus);

  useEffect(() => {
    if (!trackingOrder) return;
    const currentStatus = trackingOrder.orderStatus;
    
    // Trigger notification if status actually changed
    if (prevStatusRef.current && prevStatusRef.current !== currentStatus) {
      let title = 'تحديث حالة الأوردر';
      let message = 'تم تحديث حالة طلبك من إدارة مطعم نجم';
      let icon = '🔔';

      if (currentStatus === 'preparing') {
        title = '🔥 الأوردر في الفرن وعلى شواية الفحم البلدي!';
        message = 'الشيف نزل طلبك على الفحم البلدي الحامي، التتبيلة والريحة طالعة تجنن وسخن مولع!';
        icon = '🔥';
      } else if (currentStatus === 'ready') {
        title = '📦 استوا واتغلف بالسلوفان الحراري!';
        message = 'طلبك جاهز ومعبأ بعناية ومحفوظ حرارياً في انتظار استلام كابتن التوصيل.';
        icon = '📦';
      } else if (currentStatus === 'on_the_way') {
        title = '🛵 كابتن التوصيل استلم الأوردر وفي الطريق إليك!';
        message = trackingOrder.driverName 
          ? `الكابتن ${trackingOrder.driverName} استلم البوكس الحراري ودور الموتوسيكل وفي اتجاهه إليك!`
          : 'الطيار استلم الطلب وفي طريقه لعنوانك بأسرع وقت!';
        icon = '🛵';
      } else if (currentStatus === 'delivered') {
        title = '🎉 تم تسليم الأوردر وبالهنا والشفا!';
        message = 'تم تسليم الأوردر، نتمنى لك وجبة شهية مع مطعم وجزارة نجم! ننتظر تقييمك.';
        icon = '🎉';
      }

      playOrderChime(currentStatus);

      const newToast: ToastNotification = {
        id: `${Date.now()}-${Math.random()}`,
        title,
        message,
        status: currentStatus,
        icon,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };

      setToasts((prev) => [newToast, ...prev]);

      // Auto dismiss after 6.5 seconds
      const timer = setTimeout(() => {
        removeToast(newToast.id);
      }, 6500);

      return () => clearTimeout(timer);
    }

    prevStatusRef.current = currentStatus;
  }, [trackingOrder?.orderStatus, trackingOrder?.driverName]);

  // Live ticking counter for order elapsed time
  useEffect(() => {
    if (isTimerPaused || trackingOrder?.orderStatus === 'delivered') return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + timerMultiplier);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isTimerPaused, timerMultiplier, trackingOrder?.orderStatus]);

  // Automated simulation demo tour
  useEffect(() => {
    if (!isSimulating || !trackingOrder) return;

    const stages: { status: Order['orderStatus']; driver?: string; delay: number; targetSecs: number }[] = [
      { status: 'preparing', delay: 2500, targetSecs: 600 },
      { status: 'ready', delay: 6000, targetSecs: 1200 },
      { status: 'on_the_way', driver: 'أحمد سعيد (طيار دليفري)', delay: 10000, targetSecs: 1680 },
      { status: 'delivered', driver: 'أحمد سعيد (طيار دليفري)', delay: 14500, targetSecs: (trackingOrder.estimatedDeliveryMinutes || 35) * 60 },
    ];

    const timers = stages.map((s) =>
      setTimeout(() => {
        updateOrderStatus(trackingOrder.id, s.status, s.driver);
        setElapsedSeconds(s.targetSecs);
        if (s.status === 'delivered') {
          setIsSimulating(false);
        }
      }, s.delay)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isSimulating, trackingOrder?.id]);

  // Dynamic Progress Bar Calculations
  const totalDeliveryMinutes = trackingOrder?.estimatedDeliveryMinutes || 35;
  const totalDeliverySeconds = totalDeliveryMinutes * 60;
  const isDelivered = trackingOrder?.orderStatus === 'delivered';

  // Calculate dynamic percentage
  const calculatedPercentage = isDelivered 
    ? 100 
    : Math.min(99, Math.max(4, Math.round((elapsedSeconds / totalDeliverySeconds) * 100)));

  // Proximity Alert Geofencing Effect using customer lat/lng state
  useEffect(() => {
    if (!trackingOrder) return;

    // Reset proximity alert flag when order is pending or preparing so it fires fresh next time
    if (trackingOrder.orderStatus === 'pending' || trackingOrder.orderStatus === 'preparing') {
      if (proximityAlertFiredRef.current[trackingOrder.id]) {
        proximityAlertFiredRef.current[trackingOrder.id] = false;
      }
      return;
    }

    if (trackingOrder.orderStatus !== 'on_the_way') return;
    if (proximityAlertFiredRef.current[trackingOrder.id]) return;

    const custLat = lat ?? 30.05920;
    const custLng = lng ?? 31.23350;

    const dynamicWaypoints = [...ROUTE_WAYPOINTS];
    dynamicWaypoints[dynamicWaypoints.length - 1] = [custLat, custLng];
    const travelRatio = Math.max(0.1, Math.min(0.96, calculatedPercentage / 100));
    const driverPos = getPositionAlongRoute(dynamicWaypoints, travelRatio);

    const distMeters = calculateGeodesicDistanceMeters(driverPos[0], driverPos[1], custLat, custLng);

    if (distMeters <= 500) {
      triggerProximitySilentAlert(distMeters);
    }
  }, [calculatedPercentage, trackingOrder?.orderStatus, trackingOrder?.id, lat, lng]);

  const elapsedMins = Math.floor(elapsedSeconds / 60);
  const elapsedSecsRem = elapsedSeconds % 60;
  const remainingSeconds = Math.max(0, totalDeliverySeconds - elapsedSeconds);
  const remainingMins = Math.ceil(remainingSeconds / 60);

  // Dynamic stages based on elapsed time and percentage
  const getProgressStageInfo = () => {
    if (isDelivered || calculatedPercentage >= 100) {
      return {
        stageTitle: 'تم استلام وتوصيل الطلب بنجاح',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        gradientBar: 'from-emerald-500 via-teal-400 to-emerald-300',
        glowStyle: 'shadow-[0_0_25px_rgba(16,185,129,0.55)]',
        emoji: '🎉',
        label: 'وصل الطلب بالهنا والشفا',
        note: 'تم تسليم وجبتك ساخنة وطازة من الشواية لبابك!',
        themeBorder: 'border-emerald-500/50',
        cardGlow: 'rgba(16,185,129,0.15)',
        phaseNumber: 'المرحلة 4 من 4 (مكتمل)',
        statusTag: 'تم التسليم 100%',
        tipPulseColor: 'bg-emerald-400',
      };
    }
    if (calculatedPercentage < 25) {
      return {
        stageTitle: 'تأكيد واستلام الطلب وتجهيز التتبيلة',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        gradientBar: 'from-amber-500 via-amber-400 to-yellow-400',
        glowStyle: 'shadow-[0_0_18px_rgba(245,158,11,0.45)]',
        emoji: '🥩',
        label: 'استلام وتجهيز لحوم بلدي طازة',
        note: 'الكاشير أكد طلبك وبدأ الشيف تحضير قطع اللحم وتتبيلة نجم الخاصة',
        themeBorder: 'border-amber-500/30',
        cardGlow: 'rgba(245,158,11,0.12)',
        phaseNumber: 'المرحلة 1 من 4 (البداية)',
        statusTag: 'تجهيز وتحضير',
        tipPulseColor: 'bg-amber-400',
      };
    }
    if (calculatedPercentage < 65) {
      return {
        stageTitle: 'الأوردر على الجريل والشواية البلدي',
        badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        gradientBar: 'from-amber-500 via-orange-500 to-red-500',
        glowStyle: 'shadow-[0_0_24px_rgba(249,115,22,0.6)]',
        emoji: '🔥',
        label: 'شوي على الفحم وتسوية ممتازة',
        note: 'الكفتة والحواوشي والطواجن في الفرن والريحة البلدي طالعة تفرح',
        themeBorder: 'border-orange-500/40',
        cardGlow: 'rgba(249,115,22,0.15)',
        phaseNumber: 'المرحلة 2 من 4 (الشواء)',
        statusTag: 'تسوية على الفحم',
        tipPulseColor: 'bg-orange-400',
      };
    }
    if (calculatedPercentage < 88) {
      return {
        stageTitle: 'تغليف حراري وانطلاق الطيار',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        gradientBar: 'from-orange-500 via-cyan-400 to-blue-500',
        glowStyle: 'shadow-[0_0_25px_rgba(6,182,212,0.65)]',
        emoji: '🛵',
        label: 'الطيار استلم البوكس وفي الطريق إليك',
        note: trackingOrder?.driverName 
          ? `الكابتن ${trackingOrder.driverName} انطلق بأقصى سرعة وأمان نحو عنوانك` 
          : 'الطيار استلم الأوردر في البوكس الحراري وهو في الطريق لعنوانك',
        themeBorder: 'border-cyan-500/40',
        cardGlow: 'rgba(6,182,212,0.15)',
        phaseNumber: 'المرحلة 3 من 4 (في الطريق)',
        statusTag: 'الطيار في الطريق',
        tipPulseColor: 'bg-cyan-400',
      };
    }
    return {
      stageTitle: 'الطيار على وشك الوصول لبابك',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      gradientBar: 'from-cyan-400 via-emerald-400 to-lime-300',
      glowStyle: 'shadow-[0_0_26px_rgba(52,211,153,0.7)]',
      emoji: '📍',
      label: 'الطيار في شارعك وقريب جداً من الباب!',
      note: 'جهز الشوك والمعالق.. دقائق معدودة وهيرن جرس الباب!',
      themeBorder: 'border-emerald-500/40',
      cardGlow: 'rgba(16,185,129,0.15)',
      phaseNumber: 'المرحلة 4 من 4 (اقتراب الوصول)',
      statusTag: 'دقائق وتستلم',
      tipPulseColor: 'bg-lime-400',
    };
  };

  const stageInfo = getProgressStageInfo();

  // Dynamic order status icon & state indicator for bottom navigation track tab
  const getBottomNavTrackTabConfig = () => {
    const status = trackingOrder?.orderStatus || 'pending';
    const isActive = activeTab === 'track';

    if (status === 'preparing') {
      return {
        icon: (
          <div className="relative flex items-center justify-center">
            {/* Animated moving and flickering flame icon for grilling / preparation */}
            <div className={`transition-all duration-300 ${isActive ? 'animate-flame-flicker scale-125' : 'animate-bounce'}`}>
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.9)]" />
            </div>
            {/* Spark ember dot */}
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping pointer-events-none" />
          </div>
        ),
        label: isActive ? 'على الشواية 🔥' : 'تتبع الأوردر',
        activeColor: 'text-orange-400 font-black',
        statusBadge: 'على الشواية 🔥',
        containerStyle: isActive 
          ? 'bg-gradient-to-t from-orange-500/20 to-orange-500/5 text-orange-400 ring-1 ring-orange-500/40 rounded-xl px-2.5 py-1 -my-1 shadow-md shadow-orange-950/50' 
          : 'text-orange-400'
      };
    }

    if (status === 'ready') {
      return {
        icon: (
          <div className="relative flex items-center justify-center">
            <div className={`transition-all duration-300 ${isActive ? 'scale-115 animate-pulse text-amber-400' : 'text-stone-400'}`}>
              <Package className="w-5 h-5 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
            </div>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping pointer-events-none" />
          </div>
        ),
        label: isActive ? 'تغليف وجاهز 📦' : 'تتبع الأوردر',
        activeColor: 'text-amber-400 font-black',
        statusBadge: 'جاهز للتسليم 📦',
        containerStyle: isActive 
          ? 'bg-gradient-to-t from-amber-500/20 to-amber-500/5 text-amber-400 ring-1 ring-amber-500/40 rounded-xl px-2.5 py-1 -my-1 shadow-md shadow-amber-950/50' 
          : 'text-amber-400'
      };
    }

    if (status === 'on_the_way') {
      return {
        icon: (
          <div className="relative flex items-center justify-center">
            {/* Animated riding motorcycle with ride-bounce */}
            <span className={`text-lg transition-transform duration-300 ${isActive ? 'scale-125 animate-ride inline-block' : 'animate-pulse'}`}>
              🛵
            </span>
            <span className="absolute -bottom-0.5 -left-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping pointer-events-none" />
          </div>
        ),
        label: isActive ? 'في الطريق 🛵' : 'تتبع الأوردر',
        activeColor: 'text-cyan-400 font-black',
        statusBadge: 'في الطريق 🛵',
        containerStyle: isActive 
          ? 'bg-gradient-to-t from-cyan-500/20 to-cyan-500/5 text-cyan-400 ring-1 ring-cyan-500/40 rounded-xl px-2.5 py-1 -my-1 shadow-md shadow-cyan-950/50' 
          : 'text-cyan-400'
      };
    }

    if (status === 'delivered') {
      return {
        icon: (
          <div className="relative flex items-center justify-center">
            <CheckCircle2 className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-emerald-400 scale-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'text-emerald-500'}`} />
            <span className="absolute -top-1.5 -right-1.5 text-[11px] animate-bounce">🎉</span>
          </div>
        ),
        label: isActive ? 'تم التسليم 🎉' : 'تتبع الأوردر',
        activeColor: 'text-emerald-400 font-black',
        statusBadge: 'تم التسليم ✨',
        containerStyle: isActive 
          ? 'bg-gradient-to-t from-emerald-500/20 to-emerald-500/5 text-emerald-400 ring-1 ring-emerald-500/40 rounded-xl px-2.5 py-1 -my-1 shadow-md shadow-emerald-950/50' 
          : 'text-emerald-400'
      };
    }

    // Default / Pending stage
    return {
      icon: (
        <div className="relative flex items-center justify-center">
          <Clock className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-amber-400 animate-spin scale-110' : 'text-stone-400'}`} style={isActive ? { animationDuration: '4s' } : undefined} />
          {isActive && (
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping pointer-events-none" />
          )}
        </div>
      ),
      label: isActive ? 'تتبع الأوردر ⏱️' : 'تتبع الأوردر',
      activeColor: 'text-amber-400 font-bold',
      statusBadge: 'قيد التأكيد 📋',
      containerStyle: isActive 
        ? 'bg-gradient-to-t from-amber-500/15 to-amber-500/5 text-amber-400 ring-1 ring-amber-500/30 rounded-xl px-2.5 py-1 -my-1' 
        : 'text-stone-400'
    };
  };

  const filteredDishes = MENU_ITEMS.filter((i) => {
    const matchCat = selectedCategory === 'all' || i.category === selectedCategory;
    const matchSearch = i.name.includes(searchQuery) || i.description.includes(searchQuery);
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#0e0e11] text-stone-100 font-['Cairo',sans-serif] text-right flex flex-col justify-between">
      
      {/* Top App Header */}
      <header className="sticky top-0 z-40 bg-[#141418]/95 backdrop-blur-md border-b border-stone-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={onBackToWebsite}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-white px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded-xl cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>الموقع الرسمي</span>
          </button>

          <div className="text-center">
            <span className="text-xs text-stone-400 block flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-amber-500" />
              <span>التوصيل إلى: {address.slice(0, 24)}...</span>
            </span>
            <h1 className="text-sm font-black text-white">تطبيق مطعم وجزارة نجم</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center gap-1 px-2.5 py-1 border rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'favorites'
                  ? 'bg-red-500/20 border-red-500 text-red-400'
                  : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-red-400'
              }`}
              title="قائمتك المفضلة"
            >
              <Heart className={`w-3.5 h-3.5 ${favoriteIds.length > 0 ? 'fill-red-500 text-red-500' : 'text-stone-400'}`} />
              <span className="font-mono">{favoriteIds.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('wallet')}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-400 cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono">{customerProfile.activePoints}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Real-time Floating Toast Notifications Container */}
      <div className="fixed top-16 left-4 right-4 z-50 pointer-events-none flex flex-col items-center gap-2 max-w-lg mx-auto">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full p-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 flex items-start justify-between gap-3 ${
              toast.isSilent || toast.status === 'proximity_alert'
                ? 'bg-gradient-to-r from-teal-950/95 via-stone-900/95 to-cyan-950/95 border-cyan-400/80 shadow-cyan-950/60 ring-2 ring-cyan-400/40 animate-in fade-in slide-in-from-top-3'
                : toast.status === 'preparing'
                ? 'bg-gradient-to-r from-orange-950/95 via-stone-900/95 to-amber-950/95 border-orange-500/50 shadow-orange-900/30 ring-1 ring-orange-500/30'
                : toast.status === 'ready'
                ? 'bg-gradient-to-r from-amber-950/95 via-stone-900/95 to-yellow-950/95 border-amber-500/50 shadow-amber-900/30 ring-1 ring-amber-500/30'
                : toast.status === 'on_the_way'
                ? 'bg-gradient-to-r from-blue-950/95 via-stone-900/95 to-cyan-950/95 border-cyan-500/50 shadow-cyan-900/30 ring-1 ring-cyan-500/30'
                : toast.status === 'delivered'
                ? 'bg-gradient-to-r from-emerald-950/95 via-stone-900/95 to-green-950/95 border-emerald-500/50 shadow-emerald-900/30 ring-1 ring-emerald-500/30'
                : 'bg-stone-900/95 border-stone-700 shadow-black'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0 p-1 bg-black/40 rounded-xl">{toast.icon}</span>
              <div className="space-y-1 text-right">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">{toast.title}</span>
                  {toast.isSilent && (
                    <span className="text-[9px] font-bold text-cyan-300 bg-cyan-900/60 border border-cyan-500/40 px-1.5 py-0.5 rounded-full">
                      صامت 🔕
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-stone-400 bg-stone-950/70 px-1.5 py-0.5 rounded">
                    {toast.time}
                  </span>
                </div>
                <p className="text-[11px] text-stone-200 leading-relaxed">{toast.message}</p>
                {toast.isSilent ? (
                  <div className="flex items-center gap-1.5 pt-0.5 text-[9px] text-cyan-300 font-bold">
                    <BellOff className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>إشعار صامت تلقائي (بدون رنة إزعاج) • داخل نطاق الـ 500 متر ({toast.distanceMeters ? `${toast.distanceMeters}م` : 'أقل من 500م'})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 pt-0.5 text-[9px] text-amber-400 font-bold">
                    <Volume2 className="w-3 h-3 text-amber-400 animate-pulse shrink-0" />
                    <span>تنبيه فوري حي + رنة صوتية</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Main App Canvas */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-6 pb-28">
        
        {/* Tab 1: Home View */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            
            {/* Promo Banner Slider (Talabat Style Exclusive for Negm) */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-red-600 to-amber-700 p-5 text-white shadow-xl">
              <div className="space-y-2 max-w-xs">
                <span className="text-[10px] font-bold bg-black/40 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  عرض الأسبوع الحصري
                </span>
                <h2 className="text-lg font-black leading-tight">
                  طاجن ليلة الخميس الملكي + 4 حواوشي بلدي
                </h2>
                <p className="text-xs text-amber-100">
                  كوارع وعكاوي ومحاشي تكفي لِمة عيلة كاملة بخصم خاص لمستخدمي الأبلكيشن!
                </p>
                <button
                  onClick={() => {
                    const dish = MENU_ITEMS.find((i) => i.id === 't-11') || MENU_ITEMS[0];
                    addToCart(dish);
                  }}
                  className="px-3 py-1.5 bg-black text-amber-400 hover:text-white rounded-lg text-xs font-bold shadow cursor-pointer transition-colors"
                >
                  اطلب العرض الآن 🔥
                </button>
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-black/20 rounded-full blur-xl pointer-events-none"></div>
            </div>

            {/* Loyalty Strip */}
            <div className="p-3.5 bg-stone-900 border border-stone-800 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">محفظة نقاط الولاء التلقائية</span>
                  <span className="text-[11px] text-stone-400">مع كل أوردر بتكسب 10% نقاط كاش باك</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('wallet')}
                className="text-amber-400 text-xs font-bold underline cursor-pointer"
              >
                رصيدي: {customerProfile.pointsValueEgp.toFixed(2)} ج
              </button>
            </div>

            {/* Quick Categories Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400">الأقسام الرئيسية</span>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="text-xs text-amber-400 font-bold hover:underline"
                >
                  عرض الكل
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {MENU_CATEGORIES.slice(1, 5).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setActiveTab('menu');
                    }}
                    className="p-3 bg-stone-900 border border-stone-800 hover:border-amber-500/40 rounded-xl text-center space-y-1 transition-all cursor-pointer"
                  >
                    <span className="text-lg block">🥩</span>
                    <span className="text-[11px] font-bold text-stone-200 block truncate">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Best Sellers Feed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-500" />
                  <span>الأكثر طلباً على فحم وجريل نجم</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MENU_ITEMS.filter((i) => i.isPopular).slice(0, 6).map((item) => {
                  const inCart = appCart[item.id]?.qty || 0;
                  const isFav = favoriteIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 bg-stone-900/80 border border-stone-800 rounded-2xl flex items-center justify-between gap-3 text-right group hover:border-amber-500/30 transition-all"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleFavorite(item.id, item.name)}
                            className="p-1 -mr-1 rounded-full hover:bg-stone-800 transition-transform active:scale-125 cursor-pointer"
                            title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                          >
                            <Heart
                              className={`w-4 h-4 transition-colors ${
                                isFav
                                  ? 'fill-red-500 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                                  : 'text-stone-500 hover:text-red-400'
                              }`}
                            />
                          </button>
                          <span className="text-xs font-bold text-white block">{item.name}</span>
                        </div>
                        <p className="text-[10px] text-stone-400 line-clamp-1">{item.description}</p>
                        <span className="text-xs font-black text-amber-400 font-mono tabular-nums">
                          {item.price} ج.م
                        </span>
                      </div>

                      <div className="shrink-0">
                        {inCart > 0 ? (
                          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800">
                            <button
                              onClick={() => updateQty(item.id, -1)}
                              className="w-5 h-5 flex items-center justify-center bg-stone-800 rounded text-xs"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{inCart}</span>
                            <button
                              onClick={() => updateQty(item.id, 1)}
                              className="w-5 h-5 flex items-center justify-center bg-amber-500 text-black font-bold rounded text-xs"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95"
                          >
                            + أضف
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Full Menu & Search */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن أكلتك المفضلة (حواوشي، عكاوي، كوارع، كفتة...)"
                className="w-full pl-3 pr-10 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Category horizontal scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {MENU_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-black'
                      : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Items list */}
            <div className="space-y-2.5">
              {filteredDishes.map((item) => {
                const inCart = appCart[item.id]?.qty || 0;
                const isFav = favoriteIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-stone-900 border border-stone-800 hover:border-amber-500/20 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(item.id, item.name)}
                          className="p-1 -mr-1 rounded-full hover:bg-stone-800 transition-transform active:scale-125 cursor-pointer"
                          title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                        >
                          <Heart
                            className={`w-4 h-4 transition-colors ${
                              isFav
                                ? 'fill-red-500 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                                : 'text-stone-500 hover:text-red-400'
                            }`}
                          />
                        </button>
                        <span className="text-xs font-bold text-white">{item.name}</span>
                        {item.isSpecial && (
                          <span className="text-[9px] bg-red-950 text-red-300 border border-red-500/30 px-1.5 py-0.2 rounded">
                            مخصوص
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-400 line-clamp-1">{item.description}</p>
                      <span className="text-xs font-black text-amber-400 font-mono tabular-nums">
                        {item.price} ج.م
                      </span>
                    </div>

                    <div className="shrink-0">
                      {inCart > 0 ? (
                        <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="w-5 h-5 flex items-center justify-center bg-stone-800 rounded text-xs"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{inCart}</span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="w-5 h-5 flex items-center justify-center bg-amber-500 text-black font-bold rounded text-xs"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95"
                        >
                          + أضف
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* Tab 3: Favorites & Quick Reorder */}
        {activeTab === 'favorites' && (
          <div className="favorites-tab-content space-y-4">
            {/* Header banner */}
            <div className="p-4 bg-gradient-to-r from-red-950/70 via-stone-900 to-amber-950/40 border border-red-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-red-950/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">❤️</span>
                  <h3 className="text-sm font-black text-white">قائمة أطباقك المفضلة</h3>
                  <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-bold">
                    {favoriteIds.length} أصناف
                  </span>
                </div>
                <p className="text-[11px] text-stone-300">
                  أكلاتك المفضلة من جزارة ومطعم نجم في مكان واحد لتكرار طلبها فوراً بضغطة زر، مع إمكانية الترتيب بالسحب والإفلات.
                </p>
              </div>

              {favoriteIds.length > 0 && (
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                  {/* Export PDF Button */}
                  <button
                    type="button"
                    onClick={() => setShowFavoritesPDFModal(true)}
                    className="px-3 py-2 bg-stone-900/90 hover:bg-stone-800 text-amber-300 border border-amber-500/50 hover:border-amber-400 font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                    title="تصدير وتحميل قائمة المفضلات كملف PDF رسمي"
                  >
                    <FileDown className="w-3.5 h-3.5 text-amber-400" />
                    <span>تصدير المفضلة PDF 📄</span>
                  </button>

                  {/* Add All to Cart Button */}
                  <button
                    type="button"
                    onClick={addAllFavoritesToCart}
                    className="px-3 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-lg shadow-red-900/30 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>طلب الكل 🛒</span>
                  </button>
                </div>
              )}
            </div>

            {/* List or Empty State */}
            {(() => {
              const allFavoriteItems = favoriteIds
                .map((id) => MENU_ITEMS.find((i) => i.id === id))
                .filter((item): item is MenuItem => item !== undefined);

              if (allFavoriteItems.length === 0) {
                return (
                  <div className="p-8 text-center bg-stone-900/60 border border-stone-800 rounded-2xl space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-full bg-stone-800 flex items-center justify-center text-3xl">
                      🤍
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">لسة ما ضفتش أصناف لقائمتك المفضلة</h4>
                      <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
                        اضغط على علامة القلب (❤️) بجانب أي وجبة في المنيو أو في الرئيسية، وهتتحفظ هنا عشان تطلبها بضغطة واحدة وترتبها بالسحب والإفلات!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('menu')}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-lg shadow-amber-500/20"
                    >
                      تصفح المنيو واكتشف الأكلات 📋
                    </button>
                  </div>
                );
              }

              // 1. Filter items based on selected category pill
              const filteredItems = favoriteCategoryFilter === 'all'
                ? allFavoriteItems
                : allFavoriteItems.filter((item) => item.category === favoriteCategoryFilter);

              // 2. Sort items based on favoriteSortBy option
              const displayedItems = [...filteredItems].sort((a, b) => {
                if (favoriteSortBy === 'price_asc') {
                  return a.price - b.price;
                }
                if (favoriteSortBy === 'price_desc') {
                  return b.price - a.price;
                }
                if (favoriteSortBy === 'alphabetical') {
                  return a.name.localeCompare(b.name, 'ar');
                }
                return 0; // 'custom' maintains user's drag & drop manual order
              });

              return (
                <div className="space-y-3">
                  {/* Category Pill Buttons & 'Sort by' Dropdown Menu */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* Category Filter Pills (Scrollable) */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => setFavoriteCategoryFilter('all')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                          favoriteCategoryFilter === 'all'
                            ? 'bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/25 ring-2 ring-amber-400/40'
                            : 'bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        <span>✨ الكل</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none ${
                          favoriteCategoryFilter === 'all' ? 'bg-stone-950/20 text-stone-950 font-bold' : 'bg-stone-800 text-stone-400'
                        }`}>
                          {allFavoriteItems.length}
                        </span>
                      </button>

                      {MENU_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                        const count = allFavoriteItems.filter((i) => i.category === cat.id).length;
                        if (count === 0) return null;
                        const isSelected = favoriteCategoryFilter === cat.id;

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFavoriteCategoryFilter(cat.id)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/25 ring-2 ring-amber-400/40'
                                : 'bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 hover:border-stone-700'
                            }`}
                          >
                            <span>{getCategoryEmoji(cat.id)}</span>
                            <span>{cat.label}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none ${
                              isSelected ? 'bg-stone-950/20 text-stone-950 font-bold' : 'bg-stone-800 text-stone-400'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* 'Sort by' Dropdown Menu */}
                    <div className="shrink-0 self-end sm:self-auto">
                      <div className="relative inline-flex items-center">
                        <div className="flex items-center gap-1.5 bg-stone-900/95 hover:bg-stone-800/90 border border-stone-800 hover:border-amber-500/40 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 transition-all shadow-sm">
                          <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-[11px] text-stone-400 font-bold">ترتيب حسب:</span>
                          <select
                            value={favoriteSortBy}
                            onChange={(e) => setFavoriteSortBy(e.target.value as any)}
                            className="bg-transparent text-amber-300 font-black text-xs focus:outline-none cursor-pointer pr-1 appearance-none py-0.5"
                            aria-label="ترتيب الأصناف المفضلة"
                          >
                            <option value="custom" className="bg-stone-900 text-stone-200">الترتيب المخصص (السحب والإفلات)</option>
                            <option value="price_asc" className="bg-stone-900 text-stone-200">السعر: من الأقل للأعلى</option>
                            <option value="price_desc" className="bg-stone-900 text-stone-200">السعر: من الأعلى للأقل</option>
                            <option value="alphabetical" className="bg-stone-900 text-stone-200">أبجدياً (أ - ي)</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-stone-400 pointer-events-none -mr-0.5 shrink-0" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Bar for Reordering and Actions */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-stone-400 px-1 gap-2 bg-stone-900/40 p-2 rounded-xl border border-stone-800/60">
                    <span className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                      <GripVertical className="w-3.5 h-3.5 text-amber-400 inline shrink-0" />
                      <span>
                        {favoriteSortBy === 'price_asc' && 'الترتيب: السعر من الأقل للأعلى 💵'}
                        {favoriteSortBy === 'price_desc' && 'الترتيب: السعر من الأعلى للأقل 💎'}
                        {favoriteSortBy === 'alphabetical' && 'الترتيب: أبجدياً (أ - ي) 🔤'}
                        {favoriteSortBy === 'custom' && (
                          favoriteCategoryFilter === 'all'
                            ? 'اسحب وأفلت الأصناف أو استخدم ⬆️ ⬇️ لإعادة ترتيب مفضلاتك:'
                            : `المعروض: ${displayedItems.length} من أصل ${allFavoriteItems.length} صنف مفضل:`
                        )}
                      </span>
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowFavoritesPDFModal(true)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>معاينة PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFavoriteIds([])}
                        className="text-[11px] text-stone-500 hover:text-red-400 underline cursor-pointer"
                      >
                        تفريغ المفضلة
                      </button>
                    </div>
                  </div>

                  {/* Filtered Empty State */}
                  {displayedItems.length === 0 ? (
                    <div className="p-8 text-center bg-stone-900/40 border border-stone-800 rounded-2xl space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-stone-800 flex items-center justify-center text-2xl">
                        🔍
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">لا توجد أصناف في هذا القسم بالمفضلة</h4>
                        <p className="text-xs text-stone-400">
                          يمكنك اختيار قسم آخر أو العودة لعرض كل أطباقك المفضلة.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFavoriteCategoryFilter('all')}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-md shadow-amber-500/20"
                      >
                        عرض كل المفضلة ({allFavoriteItems.length})
                      </button>
                    </div>
                  ) : (
                    displayedItems.map((item, idx) => {
                      const inCart = appCart[item.id]?.qty || 0;
                      const globalIdx = favoriteIds.indexOf(item.id);
                      const isDraggingThis = draggedFavIdx === globalIdx;
                      const isDragOverThis = dragOverFavIdx === globalIdx;

                      return (
                        <div
                          key={`${favoriteCategoryFilter}-${favoriteSortBy}-${item.id}`}
                          style={{ animationDelay: `${idx * 60}ms` }}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', String(globalIdx));
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggedFavIdx(globalIdx);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (dragOverFavIdx !== globalIdx) setDragOverFavIdx(globalIdx);
                          }}
                          onDragLeave={() => {
                            if (dragOverFavIdx === globalIdx) setDragOverFavIdx(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedFavIdx !== null) {
                              handleReorderFavorites(draggedFavIdx, globalIdx);
                            }
                          }}
                          onDragEnd={() => {
                            setDraggedFavIdx(null);
                            setDragOverFavIdx(null);
                          }}
                          className={`p-3.5 bg-stone-900 border rounded-xl flex items-center justify-between gap-3 transition-all duration-200 select-none animate-favorite-enter ${
                            isDraggingThis
                              ? 'opacity-35 border-dashed border-amber-400 scale-[0.98] bg-stone-950'
                              : isDragOverThis
                              ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/50 translate-y-0.5'
                              : 'border-stone-800 hover:border-red-500/30'
                          }`}
                        >
                          {/* Drag Handle & Mobile Reordering Arrows */}
                          <div className="flex items-center gap-1.5 shrink-0 bg-stone-950/70 p-1 rounded-lg border border-stone-800">
                            <div 
                              className="cursor-grab active:cursor-grabbing p-1 text-stone-500 hover:text-amber-400 transition-colors"
                              title="اسحب للإفلات في ترتيب جديد"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>

                            <div className="flex flex-col -space-y-1">
                              <button
                                type="button"
                                disabled={globalIdx <= 0}
                                onClick={() => moveFavorite(globalIdx, -1)}
                                className="p-0.5 text-stone-400 hover:text-amber-400 disabled:opacity-20 disabled:hover:text-stone-600 transition-colors cursor-pointer"
                                title="تقديم الصنف لأعلى"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={globalIdx >= favoriteIds.length - 1}
                                onClick={() => moveFavorite(globalIdx, 1)}
                                className="p-0.5 text-stone-400 hover:text-amber-400 disabled:opacity-20 disabled:hover:text-stone-600 transition-colors cursor-pointer"
                                title="تأخير الصنف لأسفل"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Dish Placeholder Image Column */}
                          <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-stone-800 bg-stone-950 shadow-md group">
                            <img
                              src={getItemPlaceholderImage(item)}
                              alt={item.name}
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = FALLBACK_FOOD_IMAGE;
                              }}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />
                            <span 
                              className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded-md bg-stone-950/85 text-amber-300 font-bold border border-amber-500/20 backdrop-blur-xs flex items-center justify-center leading-none shadow-xs"
                              title={item.categoryLabel}
                            >
                              {getCategoryEmoji(item.category)}
                            </span>
                          </div>

                          {/* Item Details */}
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => toggleFavorite(item.id, item.name)}
                                className="p-1 -mr-1 rounded-full hover:bg-stone-800 transition-transform active:scale-125 cursor-pointer shrink-0"
                                title="إزالة من المفضلة"
                              >
                                <Heart className="w-4 h-4 fill-red-500 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                              </button>
                              <span className="text-xs font-bold text-white truncate">{item.name}</span>
                              <span className="text-[10px] text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">
                                {item.categoryLabel}
                              </span>
                            </div>
                            <p className="text-[10px] text-stone-400 line-clamp-1">{item.description}</p>
                            <span className="text-xs font-black text-amber-400 font-mono tabular-nums block">
                              {item.price} ج.م
                            </span>
                          </div>

                          {/* Actions: Cart Controls & Dedicated Small Remove Button */}
                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {inCart > 0 ? (
                              <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800">
                                <button
                                  type="button"
                                  onClick={() => updateQty(item.id, -1)}
                                  className="w-5 h-5 flex items-center justify-center bg-stone-800 hover:bg-stone-700 rounded text-xs cursor-pointer text-white"
                                >
                                  -
                                </button>
                                <span className="text-xs font-bold w-4 text-center">{inCart}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQty(item.id, 1)}
                                  className="w-5 h-5 flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-xs cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addToCart(item)}
                                className="px-2.5 sm:px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                              >
                                <span>+ أضف</span>
                              </button>
                            )}

                            {/* Small Remove from Favorites Button */}
                            <button
                              type="button"
                              onClick={() => toggleFavorite(item.id, item.name)}
                              className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-red-500/15 rounded-lg border border-stone-800/80 hover:border-red-500/40 transition-all cursor-pointer group/remove"
                              title={`إزالة ${item.name} من المفضلة`}
                              aria-label={`إزالة ${item.name} من المفضلة`}
                            >
                              <Trash2 className="w-4 h-4 transition-transform group-hover/remove:scale-110" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Tab 3: Live Order Tracking (Interactive GPS Map & Dynamic Progress Bar) */}
        {activeTab === 'track' && (
          <div className="space-y-6">

            {/* View Mode Switcher Header */}
            <div className="p-3 sm:p-4 bg-gradient-to-r from-stone-900 via-stone-900/95 to-amber-950/40 border border-stone-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Navigation className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>تتبع خط سير الأوردر الحقيقي</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  </h3>
                  <p className="text-[11px] text-stone-400">خريطة تفاعلية تعرض موقع كابتن التوصيل والمسار لحظة بلحظة</p>
                </div>
              </div>

              {/* View Switcher Segmented Control */}
              <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs self-stretch sm:self-auto justify-between sm:justify-start">
                <button
                  type="button"
                  onClick={() => setTrackViewMode('map')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    trackViewMode === 'map'
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>الخريطة الحية 🗺️</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTrackViewMode('progress')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    trackViewMode === 'progress'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>شريط التقدم ⏱️</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTrackViewMode('both')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    trackViewMode === 'both'
                      ? 'bg-gradient-to-r from-amber-500 to-cyan-500 text-black font-black shadow-md'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>العرض الشامل 🌟</span>
                </button>
              </div>
            </div>

            {/* INTERACTIVE LEAFLET GPS MAP */}
            {(trackViewMode === 'map' || trackViewMode === 'both') && (
              <LiveOrderTrackingMap
                order={trackingOrder}
                progressPercentage={calculatedPercentage}
                elapsedSeconds={elapsedSeconds}
                estimatedTotalMinutes={totalDeliveryMinutes}
                customerLat={lat}
                customerLng={lng}
                onDriverDistanceUpdate={(distMeters) => {
                  if (distMeters <= 500 && trackingOrder?.orderStatus === 'on_the_way' && !proximityAlertFiredRef.current[trackingOrder.id]) {
                    triggerProximitySilentAlert(distMeters);
                  }
                }}
              />
            )}

            {/* DYNAMIC PROGRESS BAR CARD */}
            {(trackViewMode === 'progress' || trackViewMode === 'both') && (
              <div 
                className={`p-4 sm:p-5 bg-gradient-to-br from-[#17171d] via-[#121217] to-[#1a1412] border ${stageInfo.themeBorder} rounded-2xl shadow-2xl relative overflow-hidden transition-all duration-700`}
              >
              {/* Dynamic ambient color glow in background */}
              <div 
                className="absolute -top-14 -right-14 w-44 h-44 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-25"
                style={{ backgroundColor: stageInfo.cardGlow }}
              />

              {/* Progress Bar Header: Status Title & Live Stopwatch */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl border ${stageInfo.themeBorder} bg-stone-900/90 shadow-md`}>
                    {stageInfo.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">{stageInfo.stageTitle}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${stageInfo.badgeColor}`}>
                        {stageInfo.statusTag}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-400 block mt-0.5">
                      {stageInfo.note}
                    </span>
                  </div>
                </div>

                {/* Digital Live Timer & Percent Badge */}
                <div className="flex items-center gap-3 self-end sm:self-center font-mono">
                  {/* Elapsed Timer */}
                  <div className="text-right px-2.5 py-1 bg-stone-950/80 border border-stone-800 rounded-xl">
                    <span className="text-[9px] text-stone-400 block font-sans">الوقت المنقضي:</span>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                      <Clock className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                      <span>{String(elapsedMins).padStart(2, '0')}:{String(elapsedSecsRem).padStart(2, '0')}</span>
                    </div>
                  </div>

                  {/* Remaining Time */}
                  <div className="text-right px-2.5 py-1 bg-stone-950/80 border border-stone-800 rounded-xl">
                    <span className="text-[9px] text-stone-400 block font-sans">المتبقي تقريباً:</span>
                    <span className="text-xs font-bold text-white">
                      {isDelivered ? '0 د' : `~ ${remainingMins} د`}
                    </span>
                  </div>

                  {/* Percentage Pill */}
                  <div className={`px-2.5 py-1.5 rounded-xl border ${stageInfo.badgeColor} flex items-center justify-center font-black text-sm min-w-[50px] shadow-sm`}>
                    {calculatedPercentage}%
                  </div>
                </div>
              </div>

              {/* Dynamic Interactive Progress Bar Track */}
              <div className="py-4 space-y-2 relative z-10">
                <div className="relative w-full h-6 sm:h-7 bg-stone-950 rounded-full border border-stone-800/90 p-1 shadow-inner overflow-visible flex items-center">
                  
                  {/* Progress Fill Bar */}
                  <div
                    className={`h-full rounded-full bg-gradient-to-l ${stageInfo.gradientBar} animate-stripes ${stageInfo.glowStyle} transition-all duration-500 ease-out relative flex items-center justify-end`}
                    style={{ width: `${calculatedPercentage}%` }}
                  >
                    {/* Top glass gleam highlight */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/20 rounded-full pointer-events-none" />

                    {/* Leading Edge Glow & Indicator Pin */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                      <div className="relative flex items-center justify-center">
                        <div className={`w-8 h-8 rounded-full bg-stone-950 border-2 border-white shadow-xl flex items-center justify-center text-sm transition-transform hover:scale-110 ${stageInfo.tipPulseColor ? 'ring-4 ring-amber-400/30' : ''}`}>
                          {stageInfo.emoji}
                        </div>
                        {/* Ping radar wave for active stages */}
                        {!isDelivered && (
                          <div className="absolute -inset-1 rounded-full bg-amber-400/30 animate-ping pointer-events-none" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Background Milestone Reference Dots */}
                  <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-700/60" title="0%" />
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-700/60" title="30%" />
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-700/60" title="70%" />
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-700/60" title="100%" />
                  </div>
                </div>

                {/* 4 Stage Milestones Labels Row */}
                <div className="grid grid-cols-4 gap-1 text-center pt-1">
                  {[
                    { pct: 0, label: 'استلام الأوردر', icon: '📋' },
                    { pct: 30, label: 'شوي وفحم بلدي', icon: '🔥' },
                    { pct: 70, label: 'انطلاق الطيار', icon: '🛵' },
                    { pct: 100, label: 'تم التسليم', icon: '🎉' },
                  ].map((m, idx) => {
                    const isReached = calculatedPercentage >= m.pct;
                    const isCurrent = 
                      (idx === 0 && calculatedPercentage < 30) ||
                      (idx === 1 && calculatedPercentage >= 30 && calculatedPercentage < 70) ||
                      (idx === 2 && calculatedPercentage >= 70 && calculatedPercentage < 100) ||
                      (idx === 3 && calculatedPercentage >= 100);

                    return (
                      <div key={idx} className="flex flex-col items-center">
                        <span className={`text-[11px] block transition-all ${isCurrent ? 'scale-110 drop-shadow' : ''}`}>
                          {m.icon}
                        </span>
                        <span
                          className={`text-[10px] mt-0.5 font-bold transition-colors ${
                            isCurrent
                              ? 'text-amber-400 font-black'
                              : isReached
                              ? 'text-stone-300'
                              : 'text-stone-600'
                          }`}
                        >
                          {m.label}
                        </span>
                        <span className="text-[9px] text-stone-500 font-mono">
                          {m.pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Time & Speed Simulator Controls for Admin/Customer */}
              <div className="mt-3 pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-xs relative z-10">
                <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
                  <Timer className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-stone-300">تحكم سريع في التوقيت للاختبار:</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setElapsedSeconds((s) => Math.max(60, s - 300))}
                    className="px-2 py-1 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                    title="الرجوع 5 دقائق في التوقيت"
                  >
                    <span>-5 دقائق ⏪</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setElapsedSeconds((s) => Math.min(totalDeliverySeconds, s + 300))}
                    className="px-2 py-1 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                    title="تقديم 5 دقائق في التوقيت"
                  >
                    <span>+5 دقائق ⏩</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimerMultiplier((m) => (m === 1 ? 10 : 1))}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      timerMultiplier > 1
                        ? 'bg-amber-500 text-black border-amber-400 shadow'
                        : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-amber-500/40'
                    }`}
                  >
                    <FastForward className="w-3 h-3" />
                    <span>{timerMultiplier > 1 ? 'سرعة 10x ⚡' : 'سرعة 1x'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTimerPaused(!isTimerPaused)}
                    className="px-2 py-1 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                  >
                    {isTimerPaused ? '▶️ استئناف' : '⏸️ إيقاف'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setElapsedSeconds(180);
                      setIsTimerPaused(false);
                      if (trackingOrder) {
                        proximityAlertFiredRef.current[trackingOrder.id] = false;
                      }
                      updateOrderStatus(trackingOrder.id, 'pending');
                    }}
                    className="px-2 py-1 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                    title="إعادة تعيين التوقيت للبداية"
                  >
                    <RotateCcw className="w-3 h-3 inline ml-1" />
                    <span>تصفير</span>
                  </button>

                  {/* Quick Proximity Alert Simulator Test */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!trackingOrder) return;
                      if (trackingOrder.orderStatus !== 'on_the_way') {
                        updateOrderStatus(trackingOrder.id, 'on_the_way', trackingOrder.driverName || 'أحمد سعيد (طيار دليفري)');
                      }
                      setElapsedSeconds(Math.round(totalDeliverySeconds * 0.88));
                      setIsTimerPaused(false);
                      proximityAlertFiredRef.current[trackingOrder.id] = false;
                      setTimeout(() => {
                        triggerProximitySilentAlert(360);
                      }, 250);
                    }}
                    className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/50 rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                    title="تجربة تنبيه الاقتراب الصامت عند الوصول لمسافة أقل من 500 متر"
                  >
                    <span>🔕 تجربة تنبيه الـ 500م (صامت)</span>
                  </button>
                </div>
              </div>
            </div>
            )}

            <div className="p-5 bg-stone-900 border border-stone-800 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                <div>
                  <span className="text-[11px] text-stone-400 block">رقم الطلب النشط:</span>
                  <span className="text-base font-black text-white font-mono">#{trackingOrder.id}</span>
                </div>

                {/* GPS Destination & Proximity Zone indicator */}
                <div className="flex items-center gap-2 bg-stone-950/80 px-2.5 py-1 rounded-xl border border-stone-800">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <div className="text-right">
                    <span className="text-[9px] text-stone-400 block">إحداثيات العميل المسجلة:</span>
                    <span className="text-[10px] font-mono text-cyan-300 font-bold">
                      {lat?.toFixed(4)}° N, {lng?.toFixed(4)}° E <span className="text-stone-400 font-sans">• نطاق 500م</span>
                    </span>
                  </div>
                </div>

                <div className="text-left font-mono">
                  <span className="text-xs text-amber-400 block">وقت الوصول المتوقع:</span>
                  <span className="text-sm font-bold text-white">~ {trackingOrder.estimatedDeliveryMinutes || 35} دقيقة</span>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="space-y-3 py-2">
                {[
                  { status: 'pending', title: 'تم استلام الأوردر في المطعم', desc: 'الكاشير أكد طلبك وبدأ الإرسال للمطبخ' },
                  { status: 'preparing', title: 'الأوردر على الجريل والفحم البلدي', desc: 'الشيف بيجهز طلبك فريش بسخونية النار' },
                  { status: 'on_the_way', title: 'الطيار استلم الأوردر وفي الطريق إليك', desc: 'الطيار في طريقه لعنوانك الآن' },
                  { status: 'delivered', title: 'تم تسليم الأوردر وبالهنا والشفا', desc: 'شكراً لطلبك من مطعم وجزارة نجم' },
                ].map((step, idx) => {
                  const currentIdx = 
                    trackingOrder.orderStatus === 'pending' ? 0 :
                    trackingOrder.orderStatus === 'preparing' || trackingOrder.orderStatus === 'ready' ? 1 :
                    trackingOrder.orderStatus === 'on_the_way' ? 2 : 3;
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                            isDone
                              ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                              : 'bg-stone-800 text-stone-500'
                          }`}
                        >
                          {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>
                        {idx < 3 && <div className={`w-0.5 h-6 ${isDone ? 'bg-emerald-500' : 'bg-stone-800'}`} />}
                      </div>

                      <div className="space-y-0.5 pt-0.5">
                        <span className={`text-xs font-bold block ${isCurrent ? 'text-amber-400 font-black' : isDone ? 'text-white' : 'text-stone-500'}`}>
                          {step.title}
                        </span>
                        <span className="text-[11px] text-stone-400 block">{step.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Driver info if assigned */}
              {trackingOrder.driverName && (
                <div className="p-3 bg-stone-950 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛵</span>
                    <div>
                      <span className="text-white font-bold block">كابتن التوصيل: {trackingOrder.driverName}</span>
                      <span className="text-stone-400 text-[10px]">طيار دليفري معتمد من مطعم نجم</span>
                    </div>
                  </div>
                  <a
                    href="tel:01070664278"
                    className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg font-bold text-xs"
                  >
                    اتصال بالفرع
                  </a>
                </div>
              )}
            </div>

            {/* Quick Rating Screen for Delivered Orders */}
            {trackingOrder.orderStatus === 'delivered' && (
              <div className="p-5 bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/40 border border-amber-500/40 rounded-2xl shadow-xl space-y-4 animate-in fade-in-50">
                {(trackingOrder.rating || (submittedRatingOrderId === trackingOrder.id && !isEditingRating)) ? (
                  /* Thank you State */
                  <div className="space-y-3 text-center py-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl">
                      🌟
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">تم استلام تقييمك بنجاح!</h4>
                      <p className="text-xs text-stone-300 mt-1">
                        شكراً لذوقك ودعمك لمطعم وجزارة نجم.. ملاحظاتك بتوصل للشيف وللإدارة مباشرة لتطوير الخدمة!
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-stone-950/80 p-3 rounded-xl border border-stone-800">
                      <div>
                        <span className="text-stone-400 block text-[10px]">تقييم الأكل:</span>
                        <div className="flex items-center justify-center gap-1 text-amber-400 font-bold mt-0.5">
                          {Array.from({ length: trackingOrder.rating?.foodRating || foodRating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                          <span className="text-xs font-mono mr-1">({trackingOrder.rating?.foodRating || foodRating}/5)</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-stone-400 block text-[10px]">تقييم الطيار:</span>
                        <div className="flex items-center justify-center gap-1 text-amber-400 font-bold mt-0.5">
                          {Array.from({ length: trackingOrder.rating?.driverRating || driverRating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                          <span className="text-xs font-mono mr-1">({trackingOrder.rating?.driverRating || driverRating}/5)</span>
                        </div>
                      </div>
                    </div>

                    {(trackingOrder.rating?.comment || ratingComment || selectedTags.length > 0) && (
                      <div className="p-2.5 bg-stone-950/60 rounded-xl border border-stone-800 text-right text-xs">
                        <span className="text-stone-400 text-[10px] block mb-1">تعليقك المسجل:</span>
                        <p className="text-stone-200 text-[11px] leading-relaxed">
                          {trackingOrder.rating?.comment || [selectedTags.join(' - '), ratingComment].filter(Boolean).join(' | ')}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <Award className="w-4 h-4 text-emerald-400" />
                        <span>+20 نقطة ولاء إضافية أضيفت لمحفظتك تقديراً لوقتك</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setIsEditingRating(true)}
                        className="text-xs text-amber-400 hover:text-white underline cursor-pointer"
                      >
                        تعديل التقييم
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Interactive Rating Form */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🌟</span>
                        <div>
                          <h4 className="text-xs font-black text-amber-400">تقييم تجربة طلبك من مطعم وجزارة نجم</h4>
                          <span className="text-[10px] text-stone-400">رأيك يهمنا في تحسين الجودة والخدمة</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                        طلب رقم #{trackingOrder.id}
                      </span>
                    </div>

                    {/* 1. Food Rating */}
                    <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span>1. طعم وجودة الأكل والمشويات:</span>
                        </span>
                        <span className="text-[11px] font-bold text-amber-400">
                          {foodRating === 5 ? 'بلدي فاخر على أصوله! 🔥' :
                           foodRating === 4 ? 'لذيذ وممتاز جداً 😋' :
                           foodRating === 3 ? 'جيد ومقبول 🙂' :
                           foodRating === 2 ? 'متوسط 😐' : 'يحتاج تحسين 😕'}
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-2 py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFoodRating(star)}
                            className="p-1 hover:scale-125 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${
                                star <= foodRating
                                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                  : 'text-stone-700 hover:text-amber-500/50'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Driver Rating */}
                    <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span className="text-base">🛵</span>
                          <span>2. سرعة وأسلوب كابتن التوصيل ({trackingOrder.driverName || 'الطيار'}):</span>
                        </span>
                        <span className="text-[11px] font-bold text-amber-400">
                          {driverRating === 5 ? 'سريع وقمة في الذوق والأمانة! ⚡' :
                           driverRating === 4 ? 'سريع ومحترم 👍' :
                           driverRating === 3 ? 'جيد 🙂' :
                           driverRating === 2 ? 'متأخر شوية ⏳' : 'غير مرضي 👎'}
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-2 py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setDriverRating(star)}
                            className="p-1 hover:scale-125 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${
                                star <= driverRating
                                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                  : 'text-stone-700 hover:text-amber-500/50'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Tags Chips */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-stone-400 block font-bold">إيه أكتر حاجة عجبتك؟ (اختياري):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'الأكل سخن مولع 🔥',
                          'التتبيلة والبهارات مظبوطة 🤤',
                          'تغليف حراري ممتاز 📦',
                          'الطيار محترم وسريع 🛵',
                          'السلطات والطحينة طازة 🥗',
                          'كمية الوجبة مشبعة 🥩',
                        ].map((tag) => {
                          const isSelected = selectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                setSelectedTags((prev) =>
                                  isSelected ? prev.filter((t) => t !== tag) : [...prev, tag]
                                );
                              }}
                              className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500 text-black border-amber-400 font-bold'
                                  : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-amber-500/40'
                              }`}
                            >
                              {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Comment text area */}
                    <div className="space-y-1">
                      <label className="text-[11px] text-stone-400 block font-bold flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                        <span>ملاحظات إضافية للشيف أو الإدارة (اختياري):</span>
                      </label>
                      <textarea
                        rows={2}
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        placeholder="اكتب هنا أي تعليق أو طلب خاص للمرات القادمة..."
                        className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-white text-xs placeholder:text-stone-600 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const fullComment = [
                          ...selectedTags,
                          ratingComment.trim() ? ratingComment.trim() : null,
                        ]
                          .filter(Boolean)
                          .join(' | ');

                        submitOrderRating(trackingOrder.id, foodRating, driverRating, fullComment);
                        setSubmittedRatingOrderId(trackingOrder.id);
                        setIsEditingRating(false);
                        playOrderChime('delivered');

                        // Celebration toast
                        const newToast: ToastNotification = {
                          id: `${Date.now()}-rating`,
                          title: '⭐ شكراً لتقييمك الغالي!',
                          message: 'تم إرسال تقييمك للشيف والإدارة، وتمت إضافة +20 نقطة ولاء لمحفظتك 🎁',
                          status: 'delivered',
                          icon: '🎉',
                          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
                        };
                        setToasts((prev) => [newToast, ...prev]);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                      <span>إرسال التقييم واعتماد نقاط المكافأة ⭐</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Live Notifications Simulator & Interactive Controller */}
            <div className="p-4 bg-gradient-to-br from-stone-900 to-stone-950 border border-amber-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-black text-amber-400">محاكي إشعارات العميل الفورية (Live Toast Demo)</span>
                </div>
                <button
                  onClick={() => playOrderChime('delivered')}
                  className="flex items-center gap-1 text-[11px] text-stone-300 hover:text-amber-400 px-2 py-1 bg-stone-900 rounded-lg border border-stone-800 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>اختبر الصوت</span>
                </button>
              </div>

              <p className="text-[11px] text-stone-400 leading-relaxed">
                اضغط على أي مرحلة لتجربة ظهور الإشعار الفوري (Toast) مع الرنة الصوتية المميزة كما تظهر لهاتف العميل الحقيقي:
              </p>

              {/* Step manual clickers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setElapsedSeconds(600); // 10 mins (prep stage)
                    updateOrderStatus(trackingOrder.id, 'preparing');
                  }}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                    trackingOrder.orderStatus === 'preparing'
                      ? 'bg-orange-600/20 border-orange-500 text-orange-300 font-bold'
                      : 'bg-stone-950/80 border-stone-800 hover:border-orange-500/40 text-stone-300'
                  }`}
                >
                  <div className="text-base mb-1">🔥</div>
                  <div className="text-xs font-bold">في الفرن والفحم</div>
                  <div className="text-[10px] text-stone-400">ريحة الشوي طالعة</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setElapsedSeconds(1200); // 20 mins (ready stage)
                    updateOrderStatus(trackingOrder.id, 'ready');
                  }}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                    trackingOrder.orderStatus === 'ready'
                      ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-stone-950/80 border-stone-800 hover:border-amber-500/40 text-stone-300'
                  }`}
                >
                  <div className="text-base mb-1">📦</div>
                  <div className="text-xs font-bold">جاهز وتغليف حراري</div>
                  <div className="text-[10px] text-stone-400">حفظ السخونة</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setElapsedSeconds(1680); // 28 mins (on the way)
                    updateOrderStatus(trackingOrder.id, 'on_the_way', 'أحمد سعيد (طيار دليفري)');
                  }}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                    trackingOrder.orderStatus === 'on_the_way'
                      ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-stone-950/80 border-stone-800 hover:border-cyan-500/40 text-stone-300'
                  }`}
                >
                  <div className="text-base mb-1">🛵</div>
                  <div className="text-xs font-bold">الطيار في الطريق</div>
                  <div className="text-[10px] text-stone-400">استلم وبدأ التحرك</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setElapsedSeconds(totalDeliverySeconds); // 100% delivered
                    updateOrderStatus(trackingOrder.id, 'delivered', 'أحمد سعيد (طيار دليفري)');
                  }}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                    trackingOrder.orderStatus === 'delivered'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-stone-950/80 border-stone-800 hover:border-emerald-500/40 text-stone-300'
                  }`}
                >
                  <div className="text-base mb-1">🎉</div>
                  <div className="text-xs font-bold">تم التسليم بنجاح</div>
                  <div className="text-[10px] text-stone-400">بالهنا والشفا</div>
                </button>
              </div>

              {/* Auto Tour Simulation button */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setElapsedSeconds(180);
                    updateOrderStatus(trackingOrder.id, 'pending');
                    setIsSimulating(true);
                  }}
                  disabled={isSimulating}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    isSimulating
                      ? 'bg-amber-600/40 text-amber-200 border border-amber-500/40 animate-pulse'
                      : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                  }`}
                >
                  {isSimulating ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>جاري تشغيل محاكاة رحلة الأوردر تلقائياً...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>▶️ تجربة رحلة الأوردر التلقائية (من الفرن حتى وصول الطيار)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setElapsedSeconds(180);
                    setIsTimerPaused(false);
                    updateOrderStatus(trackingOrder.id, 'pending');
                  }}
                  className="text-[11px] text-stone-400 hover:text-stone-200 underline cursor-pointer"
                >
                  إعادة تعيين للبداية
                </button>
              </div>
            </div>

            {/* Notification History Log */}
            {toasts.length > 0 && (
              <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-300">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span>سجل الإشعارات التي وصلت للعميل خلال هذه الجلسة ({toasts.length})</span>
                </div>
                <div className="divide-y divide-stone-800">
                  {toasts.map((t) => (
                    <div key={t.id} className="py-2 flex items-start justify-between text-xs gap-2">
                      <div className="flex items-start gap-2">
                        <span>{t.icon}</span>
                        <div>
                          <span className="font-bold text-white block">{t.title}</span>
                          <span className="text-[10px] text-stone-400">{t.message}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-stone-500 shrink-0">{t.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Wallet & Profile */}
        {activeTab === 'wallet' && (
          <div className="space-y-5">
            <div className="p-5 bg-gradient-to-br from-amber-950/60 via-stone-900 to-stone-950 border border-amber-500/30 rounded-2xl space-y-3">
              <span className="text-xs text-amber-400 font-bold block">محفظة نجم الذكية (Negm Wallet)</span>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-400 block">رصيد نقاط الولاء:</span>
                  <span className="text-3xl font-black text-amber-400 font-mono tabular-nums">
                    {customerProfile.activePoints} <span className="text-sm font-sans">نقطة</span>
                  </span>
                </div>
                <div className="text-left font-mono">
                  <span className="text-xs text-stone-400 block">القيمة الشرائية:</span>
                  <span className="text-2xl font-black text-emerald-400 tabular-nums">
                    {customerProfile.pointsValueEgp.toFixed(2)} ج.م
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-stone-300 pt-1 border-t border-stone-800">
                كل 100 جنيه بتطلبها من مطعم نجم بتتحول لـ 10 جنيه رصيد خصم في محفظتك تقدر تخصمها من أي أوردر قادم!
              </p>
            </div>

            {/* Profile fields */}
            <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3 text-xs">
              <h4 className="font-bold text-white">بيانات حسابك</h4>
              <div>
                <label className="text-stone-400 block mb-1">الاسم:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-stone-400 block mb-1">رقم التليفون المسجل:</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-white font-mono text-left"
                />
              </div>
              <div>
                <label className="text-stone-400 block mb-1">العنوان الافتراضي للتوصيل:</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Floating Bottom Cart Bar if items exist */}
      {cartList.length > 0 && activeTab !== 'track' && (
        <div className="fixed bottom-16 left-0 right-0 p-3 z-30">
          <div className="max-w-xl mx-auto bg-stone-900 border border-amber-500/40 rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">الوجبات ({cartList.length}) + توصيل ({deliveryInfo.fee} ج):</span>
              <span className="text-base font-black text-amber-400 font-mono tabular-nums">
                {totalDue.toFixed(2)} ج.م
              </span>
            </div>

            {/* Payment method selector */}
            <div className="flex items-center justify-between gap-1 text-[11px]">
              {[
                { id: 'cash', label: 'كاش' },
                { id: 'instapay', label: 'إنستاباي' },
                { id: 'card', label: 'كارت' },
                { id: 'wallet', label: 'محفظة' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedPayment(m.id as any)}
                  className={`flex-1 py-1 rounded text-center cursor-pointer font-bold ${
                    selectedPayment === m.id
                      ? 'bg-amber-500 text-black'
                      : 'bg-stone-950 text-stone-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Points Toggle */}
            {customerProfile.activePoints > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  id="appRedeemPts"
                  checked={usePoints}
                  onChange={(e) => setUsePoints(e.target.checked)}
                  className="rounded border-stone-700 text-emerald-500 cursor-pointer"
                />
                <label htmlFor="appRedeemPts" className="text-emerald-300 font-bold cursor-pointer">
                  خصم {customerProfile.pointsValueEgp.toFixed(2)} ج من نقاط الولاء
                </label>
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>تأكيد وإرسال الطلب للمطبخ 🚀</span>
            </button>
          </div>
        </div>
      )}

      {/* App Bottom Navigation Bar (Talabat Style) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#141418] border-t border-stone-800 py-2 px-6">
        <div className="max-w-md mx-auto flex items-center justify-around text-xs">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'home' ? 'text-amber-400 font-bold' : 'text-stone-400'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px]">الرئيسية</span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'menu' ? 'text-amber-400 font-bold' : 'text-stone-400'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px]">المنيو والطلب</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex flex-col items-center gap-1 cursor-pointer relative ${
              activeTab === 'favorites' ? 'text-red-400 font-bold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <div className="relative">
              <Heart
                className={`w-5 h-5 transition-colors ${
                  activeTab === 'favorites' ? 'fill-red-500 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]' : 'text-stone-400'
                }`}
              />
              {favoriteIds.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-600 text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#141418]">
                  {favoriteIds.length}
                </span>
              )}
            </div>
            <span className="text-[10px]">المفضلة</span>
          </button>

          {(() => {
            const trackConfig = getBottomNavTrackTabConfig();
            const isTrackActive = activeTab === 'track';
            return (
              <button
                type="button"
                onClick={() => setActiveTab('track')}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 relative ${
                  isTrackActive ? trackConfig.containerStyle : 'text-stone-400 hover:text-stone-200'
                }`}
                title={`حالة الطلب الحالية: ${trackConfig.statusBadge}`}
              >
                {trackConfig.icon}
                <span className={`text-[10px] whitespace-nowrap transition-colors ${isTrackActive ? trackConfig.activeColor : 'text-stone-400'}`}>
                  {trackConfig.label}
                </span>

                {/* Live pulsing dot indicator when an order is active but user is browsing another tab */}
                {!isTrackActive && trackingOrder && trackingOrder.orderStatus !== 'delivered' && (
                  <span className="absolute -top-0.5 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                  </span>
                )}
              </button>
            );
          })()}

          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'wallet' ? 'text-amber-400 font-bold' : 'text-stone-400'
            }`}
          >
            <Coins className="w-5 h-5" />
            <span className="text-[10px]">المحفظة</span>
          </button>
        </div>
      </nav>

      {/* Favorites PDF Export Modal */}
      {showFavoritesPDFModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in-50">
          <div className="bg-stone-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg">
                  📄
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">معاينة وتصدير قائمة المفضلات كملف PDF</h3>
                  <p className="text-[11px] text-stone-400">جاهزة للطباعة المباشرة أو الحفظ كـ PDF رسمي من مطعم نجم</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFavoritesPDFModal(false)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Scrollable Document Preview Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-950/60 space-y-4">
              
              {/* Printable PDF Document */}
              <div 
                id="printable-favorites-pdf"
                className="bg-white text-stone-900 rounded-xl p-6 sm:p-8 shadow-2xl space-y-6 font-['Cairo',sans-serif] text-right"
                style={{ minHeight: '480px' }}
              >
                {/* PDF Header with Restaurant Branding */}
                <div className="border-b-2 border-amber-600 pb-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">🥩</span>
                      <div>
                        <h1 className="text-xl font-black text-amber-800">مطعم وجزارة نجم</h1>
                        <span className="text-xs text-stone-600 font-bold block">Negm Restaurant & Butchery - مشويات بلدي على الفحم</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left font-mono text-xs text-stone-600">
                    <span className="font-bold text-amber-700 block text-sm">قائمة المفضلات الرسمية</span>
                    <span>التاريخ: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>

                {/* Customer Details Strip in Document */}
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-stone-500 block text-[10px] font-bold">اسم العميل:</span>
                    <strong className="text-stone-900 font-black">{name || 'محمد أحمد'}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[10px] font-bold">رقم الهاتف:</span>
                    <strong className="text-stone-900 font-mono text-left">{phone || '01070664278'}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[10px] font-bold">عدد الأصناف المفضلة:</span>
                    <strong className="text-amber-800 font-bold">{favoriteIds.length} وجبات</strong>
                  </div>
                  <div className="col-span-2 sm:col-span-3 pt-1 border-t border-amber-200/60">
                    <span className="text-stone-500 block text-[10px] font-bold">عنوان التوصيل المسجل:</span>
                    <span className="text-stone-800 font-medium">{address}</span>
                  </div>
                </div>

                {/* Structured Table of Favorite Dishes */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-stone-900 text-white">
                        <th className="p-2.5 text-center w-8 rounded-tr-lg">#</th>
                        <th className="p-2.5 text-center w-14">صورة الصنف</th>
                        <th className="p-2.5">اسم الصنف والوجبة</th>
                        <th className="p-2.5">القسم</th>
                        <th className="p-2.5">المكونات والتتبيلة</th>
                        <th className="p-2.5 text-left rounded-tl-lg">السعر (ج.م)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {MENU_ITEMS.filter((i) => favoriteIds.includes(i.id)).map((item, idx) => (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/80'}>
                          <td className="p-2.5 text-center font-bold text-stone-500 font-mono">{idx + 1}</td>
                          <td className="p-2 text-center">
                            <img
                              src={getItemPlaceholderImage(item)}
                              alt={item.name}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = FALLBACK_FOOD_IMAGE;
                              }}
                              className="w-10 h-10 object-cover rounded-lg mx-auto border border-stone-200 shadow-xs"
                            />
                          </td>
                          <td className="p-2.5 font-bold text-stone-900">
                            <div className="flex items-center gap-1.5">
                              <span>❤️</span>
                              <span>{item.name}</span>
                            </div>
                          </td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                              {item.categoryLabel}
                            </span>
                          </td>
                          <td className="p-2.5 text-stone-600 text-[11px] max-w-[200px] leading-relaxed">
                            {item.description}
                          </td>
                          <td className="p-2.5 font-black text-amber-700 font-mono text-left text-sm">
                            {item.price} ج.م
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-amber-100/90 font-bold border-t-2 border-amber-600">
                        <td colSpan={5} className="p-3 text-right font-black text-amber-950">
                          إجمالي قيمة الوجبات في قائمتك المفضلة:
                        </td>
                        <td className="p-3 text-left font-black text-amber-950 text-base font-mono">
                          {MENU_ITEMS.filter((i) => favoriteIds.includes(i.id))
                            .reduce((sum, item) => sum + item.price, 0)} ج.م
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* PDF Footer & Restaurant Seal */}
                <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
                  <div className="space-y-0.5">
                    <p className="font-bold text-stone-800">
                      📞 للطلبات والتوصيل السريع: <span className="font-mono text-amber-800">01070664278</span>
                    </p>
                    <p className="text-[11px] text-stone-500">
                      📍 الفرع الرئيسي: إمبابة - شارع السودان | شواية فحم بلدي وجزارة لحوم بلدية طازة يومياً
                    </p>
                  </div>
                  <div className="text-center p-2 border-2 border-dashed border-amber-500/60 rounded-xl bg-amber-50">
                    <span className="text-[10px] text-amber-800 font-bold block">ختم جودة نجم البلدي</span>
                    <span className="text-lg">🥩 ⭐ 👑</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-950">
              <span className="text-xs text-stone-400 text-center sm:text-right">
                💡 عند الضغط على "حفظ كملف PDF" اختر <strong>Save as PDF</strong> من خيارات الطابعة لحفظ الملف على جهازك.
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowFavoritesPDFModal(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>حفظ كملف PDF / طباعة 📥</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
