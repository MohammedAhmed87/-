import * as XLSX from 'xlsx';
import { COMPARISON_ITEMS, CompetitorComparisonItem } from '../data/competitorData';
import { MENU_ITEMS } from '../data/menuData';

export function exportCompetitorComparisonToExcel(customItems?: CompetitorComparisonItem[]) {
  const items = customItems || COMPARISON_ITEMS;

  // 1. Prepare Sheet 1: Competitor Comparison
  const comparisonRows = items.map((item, index) => {
    const marketAvg = Math.round(
      (item.alRabiePrice + item.elPrincePrice + item.darshPrice + item.elRefaiePrice) / 4
    );
    const diffVsRabie = item.alRabiePrice - item.negmPrice;
    const diffVsPrince = item.elPrincePrice - item.negmPrice;
    const savingsVsMarket = Math.round(((marketAvg - item.negmPrice) / marketAvg) * 100);

    return {
      'م': index + 1,
      'الصنف': item.name,
      'القسم': item.category,
      'الوحدة': item.unit,
      'سعر مطعم نجم (ج.م)': item.negmPrice,
      'حواوشي الربيع (ج.م)': item.alRabiePrice,
      'كبدة البرنس (ج.م)': item.elPrincePrice,
      'مطعم الدهان (ج.م)': item.darshPrice,
      'حواوشي الرفاعي (ج.م)': item.elRefaiePrice,
      'متوسط سعر السوق (ج.م)': marketAvg,
      'وفرك مقارنة بالربيع (ج.م)': diffVsRabie > 0 ? `+${diffVsRabie}` : `${diffVsRabie}`,
      'وفرك مقارنة بالبرنس (ج.م)': diffVsPrince > 0 ? `+${diffVsPrince}` : `${diffVsPrince}`,
      'نسبة التوفير لدى نجم': `${savingsVsMarket}%`,
      'ملاحظات الجودة والمصدر': item.notes,
    };
  });

  const wsComparison = XLSX.utils.json_to_sheet(comparisonRows);

  // Set column widths for comparison sheet
  wsComparison['!cols'] = [
    { wch: 5 },  // م
    { wch: 30 }, // الصنف
    { wch: 15 }, // القسم
    { wch: 12 }, // الوحدة
    { wch: 18 }, // سعر نجم
    { wch: 18 }, // الربيع
    { wch: 18 }, // البرنس
    { wch: 18 }, // الدهان
    { wch: 18 }, // الرفاعي
    { wch: 20 }, // متوسط السوق
    { wch: 22 }, // وفر الربيع
    { wch: 22 }, // وفر البرنس
    { wch: 20 }, // نسبة التوفير
    { wch: 45 }, // ملاحظات
  ];

  // 2. Prepare Sheet 2: Full Menu of Negm Restaurant
  const fullMenuRows = MENU_ITEMS.map((item, index) => ({
    'م': index + 1,
    'اسم الصنف': item.name,
    'التصنيف': item.categoryLabel,
    'السعر الرسمي (ج.م)': item.price,
    'الوحدة': item.unit || 'طلب / رغيف',
    'الوصف والمكونات': item.description,
    'التميز': item.isSpecial ? 'صنف حصري مخصوص' : item.isPopular ? 'الأكثر طلباً' : 'صنف أساسي',
  }));

  const wsMenu = XLSX.utils.json_to_sheet(fullMenuRows);
  wsMenu['!cols'] = [
    { wch: 5 },
    { wch: 35 },
    { wch: 20 },
    { wch: 18 },
    { wch: 15 },
    { wch: 60 },
    { wch: 20 },
  ];

  // 3. Prepare Sheet 3: Restaurant Information & Contact
  const contactRows = [
    { 'البيان': 'اسم المطعم', 'التفاصيل': 'مطعم وجزارة نجم (جزارة السماح)' },
    { 'البيان': 'الشعار والتاريخ', 'التفاصيل': 'نجم .. أسم له تاريخ' },
    { 'البيان': 'العنوان الرسمي', 'التفاصيل': 'شارع ٢ من شارع طلعت حرب - القاهرة / الجيزة' },
    { 'البيان': 'التليفون الأرضي (الخط الساخن)', 'التفاصيل': '0237122328' },
    { 'البيان': 'موبايل وواتساب للطلبات 1', 'التفاصيل': '01070664278' },
    { 'البيان': 'موبايل للطلبات 2', 'التفاصيل': '01070664279' },
    { 'البيان': 'مواعيد العمل والدليفري', 'التفاصيل': 'يومياً من الساعة 12 ظهراً حتى 4 فجراً' },
    { 'البيان': 'المصدر ومراقبة الجودة', 'التفاصيل': 'لحوم بلدي طازجة يومياً من مذابح جزارة السماح' },
    { 'البيان': 'تاريخ تحديث المقارنة', 'التفاصيل': new Date().toLocaleDateString('ar-EG') },
  ];

  const wsContact = XLSX.utils.json_to_sheet(contactRows);
  wsContact['!cols'] = [
    { wch: 28 },
    { wch: 55 },
  ];

  // 4. Create Workbook and Append Sheets
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsComparison, 'مقارنة الأسعار مع المنافسين');
  XLSX.utils.book_append_sheet(wb, wsMenu, 'منيو مطعم نجم الكامل');
  XLSX.utils.book_append_sheet(wb, wsContact, 'بيانات المطعم والتواصل');

  // 5. Download the file
  const fileName = `مقارنة_اسعار_مطعم_نجم_مع_المنافسين_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
