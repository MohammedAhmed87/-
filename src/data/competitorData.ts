export interface CompetitorComparisonItem {
  id: string;
  name: string;
  category: 'الحواوشي' | 'الجريل' | 'الطواجن' | 'المشويات' | 'الفتة والشوربة';
  negmPrice: number;
  alRabiePrice: number;
  elPrincePrice: number;
  darshPrice: number; // مطعم الدهان / Darshr
  elRefaiePrice: number;
  unit: string;
  notes: string;
}

export const COMPETITOR_NAMES = {
  negm: 'مطعم وجزارة نجم',
  alRabie: 'حواوشي الربيع',
  elPrince: 'كبدة البرنس',
  darsh: 'مطعم الدهان (Darshr)',
  elRefaie: 'حواوشي الرفاعي',
};

export const COMPARISON_ITEMS: CompetitorComparisonItem[] = [
  {
    id: 'comp-1',
    name: 'حواوشي سادة بلدي مخصوص',
    category: 'الحواوشي',
    negmPrice: 90,
    alRabiePrice: 110,
    elPrincePrice: 135,
    darshPrice: 125,
    elRefaiePrice: 95,
    unit: 'رغيف',
    notes: 'لحم بلدي صافي من جزارة السماح مع تتبيلة شرقية مميزة وخبيز طازج.',
  },
  {
    id: 'comp-2',
    name: 'حواوشي بالسجق البلدي',
    category: 'الحواوشي',
    negmPrice: 130,
    alRabiePrice: 145,
    elPrincePrice: 165,
    darshPrice: 155,
    elRefaiePrice: 135,
    unit: 'رغيف',
    notes: 'سجق بلدي خلطة خاصة محمص على الفحم والجريل.',
  },
  {
    id: 'comp-3',
    name: 'حواوشي لحمة موتزريلا',
    category: 'الحواوشي',
    negmPrice: 120,
    alRabiePrice: 140,
    elPrincePrice: 170,
    darshPrice: 150,
    elRefaiePrice: 130,
    unit: 'رغيف',
    notes: 'موتزريلا طبيعية غنية تشد مع لحمة بلدي مفرومة.',
  },
  {
    id: 'comp-4',
    name: 'حواوشي ستيك بتلو',
    category: 'الحواوشي',
    negmPrice: 220,
    alRabiePrice: 250,
    elPrincePrice: 285,
    darshPrice: 265,
    elRefaiePrice: 235,
    unit: 'رغيف',
    notes: 'قطع ستيك طرية بتلو طازة داخل العيش البلدي.',
  },
  {
    id: 'comp-5',
    name: 'ربع كبدة جريل بلدي',
    category: 'الجريل',
    negmPrice: 260,
    alRabiePrice: 295,
    elPrincePrice: 360,
    darshPrice: 320,
    elRefaiePrice: 280,
    unit: 'ربع كجم',
    notes: 'كبدة بلدي طازة يومياً مشوحة بالثوم والفلفل الأخضر الحامي.',
  },
  {
    id: 'comp-6',
    name: 'ربع سجق جريل بلدي',
    category: 'الجريل',
    negmPrice: 200,
    alRabiePrice: 240,
    elPrincePrice: 320,
    darshPrice: 270,
    elRefaiePrice: 220,
    unit: 'ربع كجم',
    notes: 'سجق شرقي بلدي بالخلطة والتوابل والصلصة الحارة.',
  },
  {
    id: 'comp-7',
    name: 'ربع مخاصي جريل بلدي',
    category: 'الجريل',
    negmPrice: 230,
    alRabiePrice: 275,
    elPrincePrice: 340,
    darshPrice: 300,
    elRefaiePrice: 250,
    unit: 'ربع كجم',
    notes: 'مخاصي بلدي طازجة مشوحة بالزبدة والثوم والليمون.',
  },
  {
    id: 'comp-8',
    name: 'ميكس جريل نجم (فواكه لحوم)',
    category: 'الجريل',
    negmPrice: 375,
    alRabiePrice: 430,
    elPrincePrice: 520,
    darshPrice: 460,
    elRefaiePrice: 400,
    unit: 'طلب ميكس',
    notes: 'كبدة + قلب + كلاوي + مخاصي + سجق بلدي مشوح.',
  },
  {
    id: 'comp-9',
    name: 'ورقة لحمة بلدي',
    category: 'الجريل',
    negmPrice: 260,
    alRabiePrice: 310,
    elPrincePrice: 390,
    darshPrice: 340,
    elRefaiePrice: 290,
    unit: 'ورقة',
    notes: 'لحم بلدي متبل في ورق فويل مستوي بالفرن مع البصل والبطاطس.',
  },
  {
    id: 'comp-10',
    name: 'طاجن عكاوي بلدي بالبصل',
    category: 'الطواجن',
    negmPrice: 390,
    alRabiePrice: 450,
    elPrincePrice: 530,
    darshPrice: 470,
    elRefaiePrice: 420,
    unit: 'طاجن فخار',
    notes: 'عكاوي بلدي زبدة مكرملة ببصل محمر وتسبيكة فرن تقيلة.',
  },
  {
    id: 'comp-11',
    name: 'طاجن كوارع كامل بالفرن',
    category: 'الطواجن',
    negmPrice: 260,
    alRabiePrice: 300,
    elPrincePrice: 390,
    darshPrice: 330,
    elRefaiePrice: 285,
    unit: 'طاجن فخار',
    notes: 'كوارع بلدي مسلوقة ومسبكة في صلصة الطماطم والثوم.',
  },
  {
    id: 'comp-12',
    name: 'طاجن ورق عنب بالكوارع / ستيك',
    category: 'الطواجن',
    negmPrice: 350,
    alRabiePrice: 410,
    elPrincePrice: 490,
    darshPrice: 430,
    elRefaiePrice: 380,
    unit: 'طاجن فخار',
    notes: 'مزيج الملوك: ورق عنب مشرب مع كوارع دايبة أو ستيك.',
  },
  {
    id: 'comp-13',
    name: 'كيلو كفتة بلدي مشوية',
    category: 'المشويات',
    negmPrice: 800,
    alRabiePrice: 880,
    elPrincePrice: 1100,
    darshPrice: 980,
    elRefaiePrice: 860,
    unit: 'كجم',
    notes: 'لحم بلدي صافي مع بهار مضبوط وشوي فحم حطب.',
  },
  {
    id: 'comp-14',
    name: 'كيلو كباب ضاني بلدي',
    category: 'المشويات',
    negmPrice: 1350,
    alRabiePrice: 1490,
    elPrincePrice: 1780,
    darshPrice: 1580,
    elRefaiePrice: 1420,
    unit: 'كجم',
    notes: 'قطع ضاني بلدي طرية منتقاة بعناية من مذبح السماح.',
  },
  {
    id: 'comp-15',
    name: 'كيلو طرب بلدي',
    category: 'المشويات',
    negmPrice: 950,
    alRabiePrice: 1060,
    elPrincePrice: 1280,
    darshPrice: 1150,
    elRefaiePrice: 1010,
    unit: 'كجم',
    notes: 'طرب بمنديل ضاني خفيف مقرمش وغني.',
  },
  {
    id: 'comp-16',
    name: 'كيلو ريش ضاني',
    category: 'المشويات',
    negmPrice: 1400,
    alRabiePrice: 1550,
    elPrincePrice: 1850,
    darshPrice: 1650,
    elRefaiePrice: 1480,
    unit: 'كجم',
    notes: 'ريش ضاني مشوية على الجمر مع تتبيلة البصل والزعتر.',
  },
  {
    id: 'comp-17',
    name: 'فتة بالكوارع بلدي',
    category: 'الفتة والشوربة',
    negmPrice: 320,
    alRabiePrice: 370,
    elPrincePrice: 450,
    darshPrice: 390,
    elRefaiePrice: 345,
    unit: 'طبق كبير',
    notes: 'فتة مصرية بالعيش المحمص والأرز والصلصة وقطع كوارع.',
  },
  {
    id: 'comp-18',
    name: 'شوربة كوارع دسمة',
    category: 'الفتة والشوربة',
    negmPrice: 160,
    alRabiePrice: 185,
    elPrincePrice: 230,
    darshPrice: 200,
    elRefaiePrice: 170,
    unit: 'بولة',
    notes: 'شوربة كوارع مخلية بلدي مع الليمون والمستكة.',
  },
];

// Helper calculations
export function calculateComparisonStats(items: CompetitorComparisonItem[]) {
  const totalNegm = items.reduce((acc, it) => acc + it.negmPrice, 0);
  const totalAlRabie = items.reduce((acc, it) => acc + it.alRabiePrice, 0);
  const totalElPrince = items.reduce((acc, it) => acc + it.elPrincePrice, 0);
  const totalDarsh = items.reduce((acc, it) => acc + it.darshPrice, 0);
  const totalElRefaie = items.reduce((acc, it) => acc + it.elRefaiePrice, 0);

  const marketAvgTotal = (totalAlRabie + totalElPrince + totalDarsh + totalElRefaie) / 4;
  const averageSavingsVsMarket = Math.round(((marketAvgTotal - totalNegm) / marketAvgTotal) * 100);
  const averageSavingsVsPrince = Math.round(((totalElPrince - totalNegm) / totalElPrince) * 100);
  const averageSavingsVsRabie = Math.round(((totalAlRabie - totalNegm) / totalAlRabie) * 100);

  return {
    totalNegm,
    totalAlRabie,
    totalElPrince,
    totalDarsh,
    totalElRefaie,
    marketAvgTotal: Math.round(marketAvgTotal),
    averageSavingsVsMarket,
    averageSavingsVsPrince,
    averageSavingsVsRabie,
  };
}
