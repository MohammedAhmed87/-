import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Navigation, 
  MapPin, 
  PhoneCall, 
  Compass, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Flame, 
  ShieldCheck, 
  Zap, 
  Eye,
  RefreshCw,
  LocateFixed
} from 'lucide-react';
import { Order } from '../../context/RestaurantContext';

export interface LiveOrderTrackingMapProps {
  order: Order;
  progressPercentage: number;
  elapsedSeconds: number;
  estimatedTotalMinutes?: number;
  customerLat?: number | null;
  customerLng?: number | null;
  onDriverDistanceUpdate?: (distanceMeters: number, driverCoords: [number, number]) => void;
}

// Fixed reference points for Restaurant & Customer destination in Cairo
export const RESTAURANT_COORDS: [number, number] = [30.0825319, 31.2114144]; // مطعم وجزارة نجم (فرع إمبابة / شارع السودان)
export const DEFAULT_CUSTOMER_COORDS: [number, number] = [30.05920, 31.23350]; // شارع طلعت حرب - وسط البلد

// Realistic Cairo street waypoints connecting Negm Restaurant to Talaat Harb
export const ROUTE_WAYPOINTS: [number, number][] = [
  [30.08253, 31.21141], // 1. مطعم وجزارة نجم
  [30.07840, 31.21520], // 2. مطلع كوبري أحمد عرابي
  [30.07220, 31.21980], // 3. محور 26 يوليو باتجاه الزمالك
  [30.06580, 31.22720], // 4. كوبري 15 مايو فوق النيل
  [30.06140, 31.23010], // 5. نزلة كورنيش النيل وشارع 26 يوليو
  [30.05920, 31.23350], // 6. شارع طلعت حرب - عمارة 12 (وجهة العميل)
];

// Geodesic / Haversine distance formula in meters
export function calculateGeodesicDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Helper to interpolate position along polyline segments
export function getPositionAlongRoute(waypoints: [number, number][], ratio: number): [number, number] {
  const clamped = Math.max(0, Math.min(1, ratio));
  if (clamped <= 0) return waypoints[0];
  if (clamped >= 1) return waypoints[waypoints.length - 1];

  const totalSegments = waypoints.length - 1;
  const scaled = clamped * totalSegments;
  const segmentIdx = Math.min(Math.floor(scaled), totalSegments - 1);
  const segmentFraction = scaled - segmentIdx;

  const [lat1, lng1] = waypoints[segmentIdx];
  const [lat2, lng2] = waypoints[segmentIdx + 1];

  const lat = lat1 + (lat2 - lat1) * segmentFraction;
  const lng = lng1 + (lng2 - lng1) * segmentFraction;
  return [lat, lng];
}

// Calculate bearing/heading angle in degrees for vehicle rotation
function calculateBearing(start: [number, number], end: [number, number]): number {
  const startLat = (start[0] * Math.PI) / 180;
  const startLng = (start[1] * Math.PI) / 180;
  const endLat = (end[0] * Math.PI) / 180;
  const endLng = (end[1] * Math.PI) / 180;

  const dLng = endLng - startLng;
  const y = Math.sin(dLng) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export const LiveOrderTrackingMap: React.FC<LiveOrderTrackingMapProps> = ({
  order,
  progressPercentage,
  elapsedSeconds,
  estimatedTotalMinutes = 35,
  customerLat,
  customerLng,
  onDriverDistanceUpdate,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer references to dynamically update markers without reloading map
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const proximityCircleRef = useRef<L.Circle | null>(null);
  const completedPolylineRef = useRef<L.Polyline | null>(null);
  const remainingPolylineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapStyle, setMapStyle] = useState<'dark' | 'streets' | 'satellite'>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [followDriver, setFollowDriver] = useState(true);

  // Target customer coordinates using state
  const targetCustomerCoords: [number, number] = useMemo(() => {
    return [
      customerLat ?? DEFAULT_CUSTOMER_COORDS[0],
      customerLng ?? DEFAULT_CUSTOMER_COORDS[1],
    ];
  }, [customerLat, customerLng]);

  // Dynamic route waypoints ending at customer's actual GPS destination
  const dynamicWaypoints: [number, number][] = useMemo(() => {
    const list = [...ROUTE_WAYPOINTS];
    list[list.length - 1] = targetCustomerCoords;
    return list;
  }, [targetCustomerCoords]);

  // Driver dynamic calculation
  const driverName = order.driverName || 'أحمد سعيد (كابتن دليفري نجم)';
  const isDelivered = order.orderStatus === 'delivered';
  const isPreparing = order.orderStatus === 'pending' || order.orderStatus === 'preparing' || order.orderStatus === 'ready';

  // Effective progress for map travel (0 at restaurant, starts driving once ready/on_the_way)
  const mapTravelRatio = useMemo(() => {
    if (isDelivered) return 1;
    if (order.orderStatus === 'pending' || order.orderStatus === 'preparing') return 0;
    if (order.orderStatus === 'ready') return 0.05;
    // on_the_way: map between 0.1 and 0.98
    const rawRatio = Math.max(0.1, Math.min(0.96, progressPercentage / 100));
    return rawRatio;
  }, [order.orderStatus, isDelivered, progressPercentage]);

  // Current driver coordinate
  const driverCoords = useMemo(() => {
    return getPositionAlongRoute(dynamicWaypoints, mapTravelRatio);
  }, [dynamicWaypoints, mapTravelRatio]);

  // Geodesic distance in meters between driver and customer
  const distanceToCustomerMeters = useMemo(() => {
    return calculateGeodesicDistanceMeters(
      driverCoords[0],
      driverCoords[1],
      targetCustomerCoords[0],
      targetCustomerCoords[1]
    );
  }, [driverCoords, targetCustomerCoords]);

  const isWithin500m = distanceToCustomerMeters <= 500 && order.orderStatus === 'on_the_way';

  // Notify parent callback of live distance
  useEffect(() => {
    onDriverDistanceUpdate?.(distanceToCustomerMeters, driverCoords);
  }, [distanceToCustomerMeters, driverCoords, onDriverDistanceUpdate]);

  // Bearing/heading for motorcycle angle
  const heading = useMemo(() => {
    const nextRatio = Math.min(1, mapTravelRatio + 0.05);
    const nextCoords = getPositionAlongRoute(dynamicWaypoints, nextRatio);
    return calculateBearing(driverCoords, nextCoords);
  }, [driverCoords, mapTravelRatio, dynamicWaypoints]);

  // Distance and ETA calculation
  const remainingMinutes = Math.max(0, Math.ceil(estimatedTotalMinutes - (elapsedSeconds / 60)));
  const totalDistanceKm = 3.8;
  const remainingDistanceKm = Math.max(0, Number(((distanceToCustomerMeters) / 1000).toFixed(2)));
  const currentSpeed = isDelivered ? 0 : isPreparing ? 0 : 38 + Math.round((elapsedSeconds % 10));

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Create Leaflet map centered between Restaurant and Customer
    const centerLat = (RESTAURANT_COORDS[0] + targetCustomerCoords[0]) / 2;
    const centerLng = (RESTAURANT_COORDS[1] + targetCustomerCoords[1]) / 2;
    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Tile layers definitions
    const tileUrls = {
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    };

    const tile = L.tileLayer(tileUrls[mapStyle], {
      maxZoom: 19,
      subdomains: mapStyle === 'dark' ? 'abcd' : 'abc',
    }).addTo(map);

    tileLayerRef.current = tile;

    // 1. Restaurant Marker (Custom HTML DivIcon)
    const restaurantIcon = L.divIcon({
      className: 'custom-restaurant-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="background: linear-gradient(135deg, #f59e0b, #b45309); border: 2px solid #fef3c7; box-shadow: 0 0 16px rgba(245,158,11,0.8); border-radius: 9999px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
            🥩
          </div>
          <div style="position: absolute; -top: 26px; white-space: nowrap; background: rgba(0,0,0,0.85); color: #fbbf24; border: 1px solid rgba(245,158,11,0.5); font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.6); font-family: 'Cairo', sans-serif;">
            مطعم وجزارة نجم 🔥
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const restaurantMarker = L.marker(RESTAURANT_COORDS, { icon: restaurantIcon }).addTo(map);
    restaurantMarker.bindPopup(`
      <div style="direction: rtl; text-align: right; font-family: 'Cairo', sans-serif; font-size: 12px; color: #1c1917; padding: 4px;">
        <strong style="color: #b45309; font-size: 13px;">مطعم وجزارة نجم (الفرع الرئيسي)</strong>
        <p style="margin: 4px 0;">فرع إمبابة / شارع السودان - الشواية شغالة بلدي ع الفحم</p>
        <span style="display: inline-block; background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">نقطة انطلاق الطلب</span>
      </div>
    `);

    // 2. Customer Destination Marker (Custom HTML DivIcon)
    const customerIcon = L.divIcon({
      className: 'custom-customer-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="background: linear-gradient(135deg, #10b981, #047857); border: 2px solid #a7f3d0; box-shadow: 0 0 16px rgba(16,185,129,0.8); border-radius: 9999px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
            🏠
          </div>
          <div style="position: absolute; -top: 26px; white-space: nowrap; background: rgba(0,0,0,0.85); color: #34d399; border: 1px solid rgba(16,185,129,0.5); font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.6); font-family: 'Cairo', sans-serif;">
            عنوانك للتسليم 📍
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const customerMarker = L.marker(targetCustomerCoords, { icon: customerIcon }).addTo(map);
    customerMarkerRef.current = customerMarker;
    customerMarker.bindPopup(`
      <div style="direction: rtl; text-align: right; font-family: 'Cairo', sans-serif; font-size: 12px; color: #1c1917; padding: 4px;">
        <strong style="color: #047857; font-size: 13px;">عنوان العميل للتسليم</strong>
        <p style="margin: 4px 0;">${order.customerAddress || 'شارع طلعت حرب - عمارة 12 الدور الرابع'}</p>
        <div style="margin: 3px 0; font-size: 11px; color: #0284c7; font-weight: bold;">
          🔕 نطاق التنبيه الصامت: 500 متر
        </div>
        <span style="display: inline-block; background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">وجهة الوصول</span>
      </div>
    `);

    // 2b. 500m Proximity Alert Geofence Zone Circle
    const proxCircle = L.circle(targetCustomerCoords, {
      radius: 500, // 500 meters
      color: '#06b6d4',
      fillColor: '#06b6d4',
      fillOpacity: 0.08,
      weight: 2,
      dashArray: '6, 6',
    }).addTo(map);
    proximityCircleRef.current = proxCircle;
    proxCircle.bindTooltip('نطاق التنبيه الصامت (500 متر من عنوانك) 🔕', {
      permanent: false,
      direction: 'top',
      className: 'proximity-tooltip',
    });

    // 3. Driver Live Marker
    const initialDriverIcon = createDriverIcon(heading, isDelivered, isPreparing, driverName);
    const driverMarker = L.marker(driverCoords, { icon: initialDriverIcon, zIndexOffset: 1000 }).addTo(map);
    driverMarkerRef.current = driverMarker;

    driverMarker.bindPopup(`
      <div style="direction: rtl; text-align: right; font-family: 'Cairo', sans-serif; font-size: 12px; color: #1c1917; padding: 4px;">
        <strong style="color: #0284c7; font-size: 13px;">كابتن الدليفري: ${driverName}</strong>
        <p style="margin: 4px 0;">طيار معتمد ومجهز ببوكس حراري لحفظ سخونة المشويات</p>
        <div style="margin-top: 6px; display: flex; gap: 4px;">
          <a href="tel:01070664278" style="background: #0284c7; color: #fff; padding: 3px 8px; border-radius: 6px; text-decoration: none; font-size: 10px; font-weight: bold;">اتصال بالطيار 📞</a>
        </div>
      </div>
    `);

    // 4. Polylines for Full Route
    // Remaining Route Polyline (Glow cyan-amber dashed)
    const remainingPoly = L.polyline(ROUTE_WAYPOINTS, {
      color: '#f59e0b',
      weight: 5,
      opacity: 0.6,
      dashArray: '8, 8',
    }).addTo(map);
    remainingPolylineRef.current = remainingPoly;

    // Completed Route Polyline (Solid bright cyan)
    const completedPoly = L.polyline([RESTAURANT_COORDS, driverCoords], {
      color: '#06b6d4',
      weight: 6,
      opacity: 0.95,
    }).addTo(map);
    completedPolylineRef.current = completedPoly;

    // Fit bounds smoothly to show the complete path
    map.fitBounds(L.latLngBounds(ROUTE_WAYPOINTS), { padding: [50, 50] });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Helper to create driver HTML icon
  function createDriverIcon(angle: number, delivered: boolean, preparing: boolean, pilotName: string) {
    if (delivered) {
      return L.divIcon({
        className: 'custom-driver-pin-delivered',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); border: 2px solid #ffffff; box-shadow: 0 0 20px rgba(16,185,129,0.9); border-radius: 9999px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-size: 22px;">
              🎉
            </div>
            <div style="position: absolute; -bottom: 22px; white-space: nowrap; background: #065f46; color: #ffffff; border: 1px solid #34d399; font-weight: 800; font-size: 10px; padding: 1px 6px; border-radius: 6px; font-family: 'Cairo', sans-serif;">
              تم التسليم بنجاح
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
    }

    return L.divIcon({
      className: 'custom-driver-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <!-- Radar Ripple Wave Effect -->
          <div style="position: absolute; width: 56px; height: 56px; border-radius: 9999px; background: rgba(6,182,212,0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none; top: -6px; left: -6px;"></div>
          
          <!-- Motorcycle Core Circle with Direction Rotation -->
          <div style="background: linear-gradient(135deg, #06b6d4, #0284c7); border: 2px solid #ffffff; box-shadow: 0 0 20px rgba(6,182,212,0.9); border-radius: 9999px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-size: 22px; transform: rotate(${angle - 90}deg); transition: transform 0.4s ease;">
            🛵
          </div>

          <!-- Pilot Name & Live Tag -->
          <div style="position: absolute; -bottom: 24px; white-space: nowrap; background: rgba(15,23,42,0.95); color: #38bdf8; border: 1px solid rgba(6,182,212,0.7); font-weight: 800; font-size: 10px; padding: 2px 7px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.8); font-family: 'Cairo', sans-serif; display: flex; align-items: center; gap: 4px;">
            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background: #22c55e;"></span>
            <span>الطيار: ${pilotName.split(' ')[0]}</span>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
  }

  // Update Driver Position & Polylines when mapTravelRatio changes
  useEffect(() => {
    if (!mapInstanceRef.current || !driverMarkerRef.current) return;

    // Update driver marker coords and icon
    driverMarkerRef.current.setLatLng(driverCoords);
    driverMarkerRef.current.setIcon(createDriverIcon(heading, isDelivered, isPreparing, driverName));

    // Update customer marker and proximity circle if target customer coords changed
    if (customerMarkerRef.current) {
      customerMarkerRef.current.setLatLng(targetCustomerCoords);
    }
    if (proximityCircleRef.current) {
      proximityCircleRef.current.setLatLng(targetCustomerCoords);
      if (isWithin500m) {
        proximityCircleRef.current.setStyle({
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.16,
          weight: 2.5,
        });
      } else {
        proximityCircleRef.current.setStyle({
          color: '#06b6d4',
          fillColor: '#06b6d4',
          fillOpacity: 0.08,
          weight: 2,
        });
      }
    }

    // Update Completed Polyline (from restaurant to current driver point)
    const waypointsCount = dynamicWaypoints.length;
    const currentWaypointIndex = Math.floor(mapTravelRatio * (waypointsCount - 1));
    const passedWaypoints = dynamicWaypoints.slice(0, currentWaypointIndex + 1);
    passedWaypoints.push(driverCoords);

    if (completedPolylineRef.current) {
      completedPolylineRef.current.setLatLngs(passedWaypoints);
    }

    // Update Remaining Polyline (from driver to customer destination)
    const upcomingWaypoints = [driverCoords, ...dynamicWaypoints.slice(currentWaypointIndex + 1)];
    if (remainingPolylineRef.current) {
      remainingPolylineRef.current.setLatLngs(upcomingWaypoints);
    }

    // Auto follow driver if enabled and on the way
    if (followDriver && mapInstanceRef.current && (order.orderStatus === 'on_the_way' || isDelivered)) {
      mapInstanceRef.current.panTo(driverCoords, { animate: true, duration: 0.8 });
    }
  }, [driverCoords, heading, isDelivered, isPreparing, driverName, mapTravelRatio, followDriver, order.orderStatus, dynamicWaypoints, targetCustomerCoords, isWithin500m]);

  // Switch Tile Layer when style changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const tileUrls = {
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    };

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const newTile = L.tileLayer(tileUrls[mapStyle], {
      maxZoom: 19,
      subdomains: mapStyle === 'dark' ? 'abcd' : 'abc',
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTile;
  }, [mapStyle]);

  // Invalidate map size on fullscreen toggle or window resize
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Recenter actions
  const handleRecenterDriver = () => {
    if (!mapInstanceRef.current) return;
    setFollowDriver(true);
    mapInstanceRef.current.setView(driverCoords, 15, { animate: true });
  };

  const handleFitFullRoute = () => {
    if (!mapInstanceRef.current) return;
    setFollowDriver(false);
    mapInstanceRef.current.fitBounds(L.latLngBounds(dynamicWaypoints), {
      padding: [45, 45],
      animate: true,
    });
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <div 
      className={`relative rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl bg-stone-950 transition-all duration-300 ${
        isFullscreen ? 'fixed inset-3 z-50 flex flex-col' : 'w-full'
      }`}
    >
      {/* Top Map Header HUD (Heads-Up Display) */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Live Driver & Delivery HUD Card */}
        <div className="pointer-events-auto bg-stone-950/90 backdrop-blur-md border border-cyan-500/40 rounded-xl px-3 py-2 shadow-xl flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-lg">
              {isDelivered ? '🎉' : isPreparing ? '🔥' : '🛵'}
            </div>
            {!isDelivered && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            )}
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white">{driverName}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                {isDelivered ? 'تم الوصول' : isPreparing ? 'تجهيز بالشواية' : 'مباشر GPS'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-stone-300 font-mono mt-0.5">
              <span>المتبقي: {isDelivered ? '0 كم' : `${remainingDistanceKm} كم`}</span>
              <span className="text-stone-600">|</span>
              <span className="text-amber-400 font-bold">~ {remainingMinutes} دقيقة</span>
              {!isDelivered && !isPreparing && (
                <>
                  <span className="text-stone-600">|</span>
                  <span className="text-cyan-400 font-bold">{currentSpeed} كم/س</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 500m Proximity Alert HUD Indicator */}
        {order.orderStatus === 'on_the_way' && (
          <div className={`pointer-events-auto px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-xl flex items-center gap-2 text-xs font-bold transition-all ${
            isWithin500m
              ? 'bg-emerald-950/95 text-emerald-300 border-emerald-500/70 shadow-emerald-950/50 ring-2 ring-emerald-400/40 animate-pulse'
              : 'bg-stone-950/90 text-stone-300 border-stone-800'
          }`}>
            <span className="text-base shrink-0">{isWithin500m ? '🔕' : '🎯'}</span>
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black">
                  {isWithin500m ? 'تنبيه اقتراب صامت: الطيار داخل الـ 500م!' : 'رادار تتبع المسافة للعنوان'}
                </span>
                {isWithin500m && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-black text-[9px] font-black">
                    أقل من 500م
                  </span>
                )}
              </div>
              <span className="text-[10px] text-stone-400 font-mono block">
                المسافة الحالية: <strong className={isWithin500m ? 'text-emerald-400' : 'text-amber-400'}>{distanceToCustomerMeters} متر</strong> {isWithin500m ? '• أرسل إشعار صامت' : '• إشعار صامت عند 500م'}
              </span>
            </div>
          </div>
        )}

        {/* Map Interactive Controls Toolbar */}
        <div className="pointer-events-auto flex items-center gap-1 bg-stone-950/90 backdrop-blur-md border border-stone-800 rounded-xl p-1 shadow-xl">
          {/* Style Selector */}
          <div className="flex items-center bg-stone-900 rounded-lg p-0.5 border border-stone-800 text-[10px] font-bold">
            <button
              onClick={() => setMapStyle('dark')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                mapStyle === 'dark' ? 'bg-amber-500 text-black font-black' : 'text-stone-400 hover:text-white'
              }`}
              title="الخريطة الليلية الفخمة"
            >
              ليلي
            </button>
            <button
              onClick={() => setMapStyle('streets')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                mapStyle === 'streets' ? 'bg-amber-500 text-black font-black' : 'text-stone-400 hover:text-white'
              }`}
              title="خريطة الشوارع الواضحة"
            >
              شوارع
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                mapStyle === 'satellite' ? 'bg-amber-500 text-black font-black' : 'text-stone-400 hover:text-white'
              }`}
              title="صور الأقمار الصناعية"
            >
              قمر
            </button>
          </div>

          {/* Recenter on Driver */}
          <button
            onClick={handleRecenterDriver}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              followDriver
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-cyan-500/40'
            }`}
            title="تتبع وتوسيط موقع الطيار"
          >
            <LocateFixed className="w-4 h-4" />
          </button>

          {/* Fit Full Route */}
          <button
            onClick={handleFitFullRoute}
            className="p-1.5 rounded-lg bg-stone-900 text-stone-300 border border-stone-800 hover:border-amber-500/40 transition-colors cursor-pointer"
            title="عرض كامل المسار من المطعم للعميل"
          >
            <Compass className="w-4 h-4 text-amber-400" />
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-stone-900 text-stone-300 border border-stone-800 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'تصغير الخريطة' : 'تكبير ملء الشاشة'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div 
        ref={mapContainerRef} 
        className={`w-full z-0 ${isFullscreen ? 'flex-1 h-full' : 'h-[360px] sm:h-[420px]'}`} 
        style={{ minHeight: '340px' }}
      />

      {/* Bottom Floating Info Strip */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] pointer-events-none flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Route Details Card */}
        <div className="pointer-events-auto bg-stone-950/90 backdrop-blur-md border border-stone-800 rounded-xl px-3 py-2 text-right shadow-xl text-xs flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🥩</span>
            <div>
              <span className="text-stone-400 block text-[9px]">المصدر:</span>
              <span className="text-white font-bold text-[11px]">جزارة ومطعم نجم (إمبابة)</span>
            </div>
          </div>
          <span className="text-amber-400 text-xs">➔</span>
          <div className="flex items-center gap-2">
            <span className="text-base">📍</span>
            <div>
              <span className="text-stone-400 block text-[9px]">الوجهة:</span>
              <span className="text-white font-bold text-[11px] truncate max-w-[150px]">
                {order.customerAddress || 'شارع طلعت حرب'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Driver Contact & Live Tracking Badge */}
        <div className="pointer-events-auto flex items-center gap-2">
          <a
            href="tel:01070664278"
            className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>اتصال بالطيار</span>
          </a>

          <div className="px-3 py-2 bg-stone-950/90 backdrop-blur-md border border-amber-500/40 rounded-xl text-amber-300 font-bold text-xs shadow-xl flex items-center gap-1.5 font-mono">
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>تتبع تفاعلي حي</span>
          </div>
        </div>
      </div>
    </div>
  );
};
