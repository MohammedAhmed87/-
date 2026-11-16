import React, { useState, useMemo } from 'react';
import { Search, Plus, Minus, Check, ShoppingBag, Flame, Sparkles } from 'lucide-react';
import { MENU_ITEMS, MENU_CATEGORIES, MenuItem } from '../data/menuData';
import { useCart } from '../context/CartContext';

export const MenuSection: React.FC = () => {
  const { addToCart, setIsCartOpen } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSpecialOnly, setFilterSpecialOnly] = useState(false);
  const [addedItemId, setAddedItemId] = useState<string | null>(null);

  // Quantities state per item
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getItemQty = (id: string) => quantities[id] || 1;

  const setItemQty = (id: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSpecial = !filterSpecialOnly || item.isSpecial || item.isPopular;
      return matchCategory && matchSearch && matchSpecial;
    });
  }, [selectedCategory, searchQuery, filterSpecialOnly]);

  const handleAdd = (item: MenuItem) => {
    const qty = getItemQty(item.id);
    addToCart(item, qty);
    setAddedItemId(item.id);
    setTimeout(() => setAddedItemId(null), 1500);
  };

  return (
    <section id="menu" className="py-16 bg-[#161619]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Heading */}
        <div className="text-right space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-bold">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>منيو جزارة السماح ومطعم نجم</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            قائمة الطعام الرسمية والأسعار
          </h2>
          <p className="text-stone-300 text-sm sm:text-base">
            كل طلب بيتحضر فريش على الفحم والجريل بخلطات وبهارات جزارة السماح المتوارثة.. اختر طلبك وضيفه للسلة.
          </p>
        </div>

        {/* Filter Bar & Search */}
        <div className="space-y-4">
          
          {/* Top Search + Special Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في أصناف المنيو (حواوشي، موزة، كوارع، ممبار...)"
                className="w-full pl-4 pr-10 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Quick Filter toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterSpecialOnly(!filterSpecialOnly)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                  filterSpecialOnly
                    ? 'bg-amber-500 text-black border-amber-400'
                    : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>المميز والأكثر طلباً فقط</span>
              </button>
            </div>
          </div>

          {/* Category Horizontal Scroll Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {MENU_CATEGORIES.map((cat) => {
              const count =
                cat.id === 'all'
                  ? MENU_ITEMS.length
                  : MENU_ITEMS.filter((i) => i.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/10'
                      : 'bg-stone-900/90 text-stone-300 border-stone-800 hover:text-white hover:border-stone-700'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedCategory === cat.id
                        ? 'bg-black/20 text-black'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Menu Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-stone-900/50 border border-stone-800 text-stone-400">
            <p className="text-base font-bold">مفيش أصناف مطابقة للبحث</p>
            <p className="text-xs mt-1">جرب تبحث باسم صنف تاني أو اختار تصنيف مختلف.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((dish) => {
              const isJustAdded = addedItemId === dish.id;
              const qty = getItemQty(dish.id);

              return (
                <div
                  key={dish.id}
                  className="bg-stone-900/80 border border-stone-800/90 hover:border-stone-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 text-right transition-all group"
                >
                  {/* Top: Name, Badge, Category */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-left font-mono tabular-nums shrink-0">
                        <span className="text-xl font-black text-amber-400">{dish.price}</span>
                        <span className="text-xs text-stone-400 mr-1 font-sans">ج.م</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 justify-end">
                          {dish.isSpecial && (
                            <span className="text-[10px] font-bold bg-red-950/70 text-red-300 border border-red-500/30 px-2 py-0.5 rounded">
                              صنف مخصوص
                            </span>
                          )}
                          {dish.isPopular && (
                            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                              الأكثر طلباً
                            </span>
                          )}
                          <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors">
                            {dish.name}
                          </h3>
                        </div>
                        <span className="text-[11px] text-stone-500 block">
                          {dish.categoryLabel} {dish.unit && `· ${dish.unit}`}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-400 leading-relaxed line-clamp-2">
                      {dish.description}
                    </p>
                  </div>

                  {/* Bottom: Quantity Controls & Add Button */}
                  <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-3">
                    
                    {/* Stepper */}
                    <div className="flex items-center gap-2 bg-stone-950 px-2 py-1 rounded-lg border border-stone-800">
                      <button
                        onClick={() => setItemQty(dish.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors cursor-pointer"
                        aria-label="إنقاص الكمية"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs text-white tabular-nums">
                        {qty}
                      </span>
                      <button
                        onClick={() => setItemQty(dish.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors cursor-pointer"
                        aria-label="زيادة الكمية"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Add to Cart button */}
                    <button
                      onClick={() => handleAdd(dish)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                        isJustAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-800 hover:bg-amber-500 hover:text-black text-stone-200 border border-stone-700/80 hover:border-amber-400'
                      }`}
                    >
                      {isJustAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>تمت الإضافة!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>أضف للسلة</span>
                        </>
                      )}
                    </button>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
