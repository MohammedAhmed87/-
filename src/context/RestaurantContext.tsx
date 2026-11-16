import React, { createContext, useContext, useState, useEffect } from 'react';
import { MENU_ITEMS, MenuItem } from '../data/menuData';

export type PaymentMethod = 'cash' | 'instapay' | 'card' | 'wallet';

export interface StaffUser {
  id: number;
  username: string;
  role: 'admin' | 'accountant' | 'cashier' | 'captain' | 'driver';
  fullName: string;
}

export interface Captain {
  id: number;
  name: string;
  phone: string;
  monthlyTarget: number;
  baseCommissionRate: number;
  acceleratorRate: number;
  isActive: boolean;
}

export interface DriverShift {
  driverId: number;
  driverName: string;
  clockInTime: string;
  clockOutTime?: string;
  hoursWorked: number;
  deliveredCount: number;
  cashCollected: number;
  totalDeliveryFees: number;
  status: 'active' | 'closed';
}

export interface Driver {
  id: number;
  name: string;
  phone: string;
  isActive: boolean;
  currentShift?: DriverShift;
}

export interface Material {
  id: number;
  name: string;
  unit: string;
  costPerUnit: number;
  stockQty: number;
  minLimit: number;
  physicalCount?: number; // الجرد الفعلي
}

export interface Promotion {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  discountPct: number;
  isActive: boolean;
}

export interface ExpenseVoucher {
  id: number;
  title: string;
  category: 'خضار وسوق' | 'صيانة ومعدات' | 'نظافة ومستهلكات' | 'يوميات وبوفيه' | 'فواتير وإيجار';
  amount: number;
  paidTo: string;
  createdBy: string;
  date: string;
  notes?: string;
}

export interface OrderItem {
  id: string | number;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: number;
  orderType: 'hall' | 'takeaway' | 'delivery';
  tableNum: number;
  captainId?: number;
  captainName: string;
  driverName?: string;
  driverId?: number;
  orderStatus: 'pending' | 'preparing' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid';
  paymentMethod: PaymentMethod;
  totalAmount: number;
  discountAmount: number;
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  mapLink?: string;
  items: OrderItem[];
  createdAt: string;
  estimatedDeliveryMinutes?: number;
  // Void authorization
  isVoided?: boolean;
  voidReason?: string;
  voidApprovedBy?: string;
  // Customer Rating & Feedback
  rating?: {
    foodRating: number;
    driverRating: number;
    comment?: string;
    createdAt: string;
  };
}

export interface CustomerProfile {
  id: number;
  phone: string;
  name: string;
  totalSpent: number;
  activePoints: number;
  pointsValueEgp: number;
  previousOrders?: number[];
}

interface RestaurantContextType {
  currentUser: StaffUser | null;
  loginUser: (role: StaffUser['role']) => void;
  logoutUser: () => void;
  
  // Orders & Tables
  orders: Order[];
  busyTables: Record<number, { captainName: string; captainId?: number; orderId?: number }>;
  createOrder: (orderData: Partial<Order>) => Order;
  updateOrderStatus: (orderId: number, status: Order['orderStatus'], driverName?: string) => void;
  payOrder: (orderId: number, paymentMethod?: PaymentMethod) => void;
  submitOrderRating: (orderId: number, foodRating: number, driverRating: number, comment?: string) => void;
  voidOrderWithApproval: (orderId: number, reason: string, managerPin: string) => { success: boolean; error?: string };
  shiftSales: number;
  shiftPaidCount: number;

  // Staff & Management
  captains: Captain[];
  addCaptain: (cap: Omit<Captain, 'id' | 'isActive'>) => void;
  drivers: Driver[];
  addDriver: (name: string, phone: string) => void;
  driverShifts: DriverShift[];
  clockInDriver: (driverId: number) => void;
  clockOutDriver: (driverId: number) => void;
  materials: Material[];
  updateMaterial: (mat: Material) => void;
  savePhysicalInventoryCount: (counts: Record<number, number>) => void;
  expenses: ExpenseVoucher[];
  addExpense: (exp: Omit<ExpenseVoucher, 'id' | 'date'>) => void;
  promotions: Promotion[];
  addPromotion: (promo: Omit<Promotion, 'id' | 'isActive'>) => void;

  // Customer & Loyalty
  getCustomerByPhone: (phone: string, name?: string) => CustomerProfile;
  redeemCustomerPoints: (phone: string, pointsAmount: number) => number;

  // GPS Delivery
  calculateDeliveryFee: (lat: number, lng: number) => { km: number; fee: number; estimatedMinutes: number };
}

const DEFAULT_STAFF_USERS: StaffUser[] = [
  { id: 1, username: 'admin', role: 'admin', fullName: 'إسلام نجم (المدير العام)' },
  { id: 2, username: 'accountant', role: 'accountant', fullName: 'أ/ سمير (المحاسب المالي)' },
  { id: 3, username: 'cashier', role: 'cashier', fullName: 'الكاشير الرئيسية' },
  { id: 4, username: 'captain1', role: 'captain', fullName: 'كابتن أحمد (الصالة)' },
  { id: 5, username: 'driver1', role: 'driver', fullName: 'محمود طيار (الديليفري)' },
];

const RESTAURANT_LAT = 30.0825319;
const RESTAURANT_LNG = 31.2114144;
const PRICE_PER_KM_ROUND_TRIP = 4.0;
const POINT_VALUE_EGP = 0.10;
const POINTS_EARN_RATE = 0.10;
const MANAGER_PIN = '1234';

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(() => {
    try {
      const saved = localStorage.getItem('negm_staff_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [captains, setCaptains] = useState<Captain[]>([
    { id: 1, name: 'كابتن أحمد', phone: '01070664278', monthlyTarget: 50000, baseCommissionRate: 2, acceleratorRate: 4, isActive: true },
    { id: 2, name: 'كابتن إبراهيم', phone: '01070664279', monthlyTarget: 40000, baseCommissionRate: 2, acceleratorRate: 3.5, isActive: true },
  ]);

  const [drivers, setDrivers] = useState<Driver[]>([
    { id: 1, name: 'محمود طيار', phone: '01012345678', isActive: true },
    { id: 2, name: 'علي دليفري', phone: '01098765432', isActive: true },
  ]);

  const [driverShifts, setDriverShifts] = useState<DriverShift[]>([
    {
      driverId: 1,
      driverName: 'محمود طيار',
      clockInTime: '12:00 م',
      hoursWorked: 5.5,
      deliveredCount: 8,
      cashCollected: 1980,
      totalDeliveryFees: 180,
      status: 'active',
    },
    {
      driverId: 2,
      driverName: 'علي دليفري',
      clockInTime: '01:30 م',
      hoursWorked: 4,
      deliveredCount: 5,
      cashCollected: 1250,
      totalDeliveryFees: 120,
      status: 'active',
    },
  ]);

  const [materials, setMaterials] = useState<Material[]>([
    { id: 1, name: 'لحم كبدة بلدي طازة', unit: 'كيلو', costPerUnit: 750, stockQty: 32, minLimit: 10, physicalCount: 31.5 },
    { id: 2, name: 'لحم ضاني بلدي فاخر', unit: 'كيلو', costPerUnit: 900, stockQty: 48, minLimit: 15, physicalCount: 47 },
    { id: 3, name: 'لحم مفروم بلدي للحواوشي', unit: 'كيلو', costPerUnit: 600, stockQty: 40, minLimit: 10, physicalCount: 40 },
    { id: 4, name: 'سجق بلدي خلطة نجم', unit: 'كيلو', costPerUnit: 550, stockQty: 25, minLimit: 8, physicalCount: 24.5 },
    { id: 5, name: 'عيش بلدي حواوشي مخصوص', unit: 'عدد', costPerUnit: 3, stockQty: 350, minLimit: 50, physicalCount: 330 },
    { id: 6, name: 'عكاوي بلدي طازجة', unit: 'كيلو', costPerUnit: 800, stockQty: 18, minLimit: 5, physicalCount: 18 },
    { id: 7, name: 'كوارع بلدي منظفة', unit: 'عدد', costPerUnit: 180, stockQty: 22, minLimit: 6, physicalCount: 21 },
  ]);

  const [expenses, setExpenses] = useState<ExpenseVoucher[]>([
    { id: 1, title: 'شروة خضار وسلطات الصباح', category: 'خضار وسوق', amount: 450, paidTo: 'معلم سوق الخضار', createdBy: 'الكاشير', date: 'اليوم 11:30 ص' },
    { id: 2, title: 'مستلزمات نظافة وأكياس حرارية', category: 'نظافة ومستهلكات', amount: 220, paidTo: 'شركة التغليف', createdBy: 'الكاشير', date: 'اليوم 01:15 م' },
    { id: 3, title: 'صيانة مفتاح مروحة الفحم بالمدخنة', category: 'صيانة ومعدات', amount: 300, paidTo: 'فني الصيانة', createdBy: 'المدير', date: 'اليوم 03:00 م' },
  ]);

  const [promotions, setPromotions] = useState<Promotion[]>([
    { id: 1, title: 'عرض طاجن ليلة الخميس الملكي', description: 'وليمة تكفي 4 أفراد (عكاوي + كوارع + محاشي + فريك) بسعر 800 ج.م فقط', imageUrl: '', discountPct: 15, isActive: true },
    { id: 2, title: 'ميكس نجم ع الفحم الشامل', description: '3 قطع دجاج + 2 كباب + 4 سجق + 3 كفتة + 2 طرب بسعر 600 ج.م', imageUrl: '', discountPct: 10, isActive: true },
  ]);

  const addPromotion = (promo: Omit<Promotion, 'id' | 'isActive'>) => {
    const newId = promotions.length + 1;
    setPromotions((prev) => [...prev, { ...promo, id: newId, isActive: true }]);
  };

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('negm_orders_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 101,
        orderType: 'hall',
        tableNum: 3,
        captainId: 1,
        captainName: 'كابتن أحمد',
        orderStatus: 'preparing',
        paymentStatus: 'pending',
        paymentMethod: 'cash',
        totalAmount: 480,
        discountAmount: 0,
        items: [
          { id: 'h-1', name: 'حواوشي سادة بلدي', price: 90, qty: 2 },
          { id: 't-1', name: 'طاجن عكاوي بالبصل', price: 390, qty: 1 },
        ],
        createdAt: '03:15 م',
        estimatedDeliveryMinutes: 25,
      },
      {
        id: 102,
        orderType: 'delivery',
        tableNum: 0,
        captainName: 'طلب أونلاين: أ/ محمد هاني',
        customerName: 'محمد هاني',
        customerPhone: '01023456789',
        customerAddress: 'شارع الجمهورية، عمارة 14 الدور الثالث',
        driverId: 1,
        driverName: 'محمود طيار',
        orderStatus: 'on_the_way',
        paymentStatus: 'pending',
        paymentMethod: 'instapay',
        totalAmount: 640,
        discountAmount: 0,
        items: [
          { id: 'm-8', name: 'ميكس نجم ع الفحم', price: 600, qty: 1 },
          { id: 's-2', name: 'سلطة طحينة بيضاء', price: 20, qty: 2 },
        ],
        mapLink: 'https://www.google.com/maps?q=30.0825,31.2114',
        createdAt: '03:30 م',
        estimatedDeliveryMinutes: 35,
      },
    ];
  });

  const [customers, setCustomers] = useState<Record<string, CustomerProfile>>({
    '01070664278': { id: 1, phone: '01070664278', name: 'أحمد علي', totalSpent: 2400, activePoints: 240, pointsValueEgp: 24 },
  });

  useEffect(() => {
    try {
      localStorage.setItem('negm_orders_v2', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('negm_staff_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('negm_staff_user');
      }
    } catch {}
  }, [currentUser]);

  const loginUser = (role: StaffUser['role']) => {
    const user = DEFAULT_STAFF_USERS.find((u) => u.role === role) || DEFAULT_STAFF_USERS[0];
    setCurrentUser(user);
  };

  const logoutUser = () => {
    setCurrentUser(null);
  };

  const busyTables: Record<number, { captainName: string; captainId?: number; orderId?: number }> = {};
  orders
    .filter((o) => o.orderType === 'hall' && o.paymentStatus === 'pending' && !o.isVoided)
    .forEach((o) => {
      busyTables[o.tableNum] = { captainName: o.captainName, captainId: o.captainId, orderId: o.id };
    });

  const createOrder = (orderData: Partial<Order>): Order => {
    const newId = (orders.length > 0 ? Math.max(...orders.map((o) => o.id)) : 100) + 1;
    const newOrder: Order = {
      id: newId,
      orderType: orderData.orderType || 'delivery',
      tableNum: orderData.tableNum || 0,
      captainId: orderData.captainId,
      captainName: orderData.captainName || 'طلب أونلاين',
      driverId: orderData.driverId,
      driverName: orderData.driverName,
      orderStatus: orderData.orderStatus || 'pending',
      paymentStatus: 'pending',
      paymentMethod: orderData.paymentMethod || 'cash',
      totalAmount: orderData.totalAmount || 0,
      discountAmount: orderData.discountAmount || 0,
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerAddress: orderData.customerAddress,
      mapLink: orderData.mapLink,
      items: orderData.items || [],
      createdAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      estimatedDeliveryMinutes: orderData.estimatedDeliveryMinutes || 35,
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrderStatus = (orderId: number, status: Order['orderStatus'], driverName?: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            orderStatus: status,
            driverName: driverName !== undefined ? driverName : o.driverName,
          };
        }
        return o;
      })
    );
  };

  const payOrder = (orderId: number, paymentMethod?: PaymentMethod) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const method = paymentMethod || o.paymentMethod || 'cash';
          
          // Update driver collection if delivery
          if (o.orderType === 'delivery' && o.driverName && method === 'cash') {
            setDriverShifts((shifts) =>
              shifts.map((s) =>
                s.driverName === o.driverName
                  ? {
                      ...s,
                      cashCollected: s.cashCollected + o.totalAmount,
                      deliveredCount: s.deliveredCount + 1,
                    }
                  : s
              )
            );
          }

          // Loyalty points
          if (o.customerPhone && customers[o.customerPhone]) {
            const earned = Math.floor(o.totalAmount * POINTS_EARN_RATE);
            const cust = customers[o.customerPhone];
            setCustomers((cp) => ({
              ...cp,
              [o.customerPhone!]: {
                ...cust,
                totalSpent: cust.totalSpent + o.totalAmount,
                activePoints: cust.activePoints + earned,
                pointsValueEgp: (cust.activePoints + earned) * POINT_VALUE_EGP,
              },
            }));
          }

          return { ...o, paymentStatus: 'paid', orderStatus: 'delivered', paymentMethod: method };
        }
        return o;
      })
    );
  };

  const submitOrderRating = (orderId: number, foodRating: number, driverRating: number, comment?: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            rating: {
              foodRating,
              driverRating,
              comment,
              createdAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            },
          };
        }
        return o;
      })
    );
  };

  // Void order with manager approval
  const voidOrderWithApproval = (orderId: number, reason: string, managerPin: string) => {
    if (managerPin !== MANAGER_PIN) {
      return { success: false, error: 'رمز موافقة المدير غير صحيح!' };
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: 'cancelled',
              isVoided: true,
              voidReason: reason,
              voidApprovedBy: 'إسلام نجم (المدير)',
            }
          : o
      )
    );
    return { success: true };
  };

  const shiftSales = orders
    .filter((o) => o.paymentStatus === 'paid' && !o.isVoided)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const shiftPaidCount = orders.filter((o) => o.paymentStatus === 'paid' && !o.isVoided).length;

  const addCaptain = (cap: Omit<Captain, 'id' | 'isActive'>) => {
    const newId = captains.length + 1;
    setCaptains((prev) => [...prev, { ...cap, id: newId, isActive: true }]);
  };

  const addDriver = (name: string, phone: string) => {
    const newId = drivers.length + 1;
    setDrivers((prev) => [...prev, { id: newId, name, phone, isActive: true }]);
  };

  const clockInDriver = (driverId: number) => {
    const driver = drivers.find((d) => d.id === driverId);
    if (!driver) return;
    const nowStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    setDriverShifts((prev) => [
      ...prev.filter((s) => s.driverId !== driverId),
      {
        driverId,
        driverName: driver.name,
        clockInTime: nowStr,
        hoursWorked: 0,
        deliveredCount: 0,
        cashCollected: 0,
        totalDeliveryFees: 0,
        status: 'active',
      },
    ]);
  };

  const clockOutDriver = (driverId: number) => {
    const nowStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    setDriverShifts((prev) =>
      prev.map((s) => (s.driverId === driverId ? { ...s, clockOutTime: nowStr, status: 'closed' } : s))
    );
  };

  const updateMaterial = (mat: Material) => {
    setMaterials((prev) => prev.map((m) => (m.id === mat.id ? mat : m)));
  };

  const savePhysicalInventoryCount = (counts: Record<number, number>) => {
    setMaterials((prev) =>
      prev.map((m) => {
        if (counts[m.id] !== undefined) {
          return { ...m, physicalCount: counts[m.id] };
        }
        return m;
      })
    );
  };

  const addExpense = (exp: Omit<ExpenseVoucher, 'id' | 'date'>) => {
    const newId = expenses.length + 1;
    const nowStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    setExpenses((prev) => [{ ...exp, id: newId, date: `اليوم ${nowStr}` }, ...prev]);
  };

  const getCustomerByPhone = (phone: string, name?: string): CustomerProfile => {
    if (customers[phone]) return customers[phone];
    const newCust: CustomerProfile = {
      id: Object.keys(customers).length + 1,
      phone,
      name: name || 'عميل نجم',
      totalSpent: 0,
      activePoints: 50,
      pointsValueEgp: 5,
    };
    setCustomers((prev) => ({ ...prev, [phone]: newCust }));
    return newCust;
  };

  const redeemCustomerPoints = (phone: string, pointsAmount: number): number => {
    const cust = customers[phone];
    if (!cust || cust.activePoints <= 0) return 0;
    const used = Math.min(cust.activePoints, pointsAmount);
    const discountVal = used * POINT_VALUE_EGP;
    setCustomers((prev) => ({
      ...prev,
      [phone]: {
        ...cust,
        activePoints: cust.activePoints - used,
        pointsValueEgp: (cust.activePoints - used) * POINT_VALUE_EGP,
      },
    }));
    return discountVal;
  };

  const calculateDeliveryFee = (lat: number, lng: number) => {
    const R = 6371;
    const dLat = ((lat - RESTAURANT_LAT) * Math.PI) / 180;
    const dLon = ((lng - RESTAURANT_LNG) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((RESTAURANT_LAT * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const km = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    const fee = Math.max(20.0, Math.round(km * 2 * PRICE_PER_KM_ROUND_TRIP));
    const estimatedMinutes = Math.min(60, Math.max(25, Math.round(25 + km * 3)));
    return { km: Number(km.toFixed(1)), fee, estimatedMinutes };
  };

  return (
    <RestaurantContext.Provider
      value={{
        currentUser,
        loginUser,
        logoutUser,
        orders,
        busyTables,
        createOrder,
        updateOrderStatus,
        payOrder,
        submitOrderRating,
        voidOrderWithApproval,
        shiftSales,
        shiftPaidCount,
        captains,
        addCaptain,
        drivers,
        addDriver,
        driverShifts,
        clockInDriver,
        clockOutDriver,
        materials,
        updateMaterial,
        savePhysicalInventoryCount,
        expenses,
        addExpense,
        promotions,
        addPromotion,
        getCustomerByPhone,
        redeemCustomerPoints,
        calculateDeliveryFee,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }
  return context;
};
