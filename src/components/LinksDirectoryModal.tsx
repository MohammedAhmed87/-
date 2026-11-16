import React, { useState } from 'react';
import { 
  X, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  ExternalLink, 
  Code2, 
  Smartphone, 
  Receipt, 
  ChefHat, 
  Bike, 
  Calculator, 
  ShieldCheck, 
  Globe,
  FolderGit2
} from 'lucide-react';

interface LinksDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToScreen: (screen: string) => void;
}

export const LinksDirectoryModal: React.FC<LinksDirectoryModalProps> = ({ 
  isOpen, 
  onClose, 
  onNavigateToScreen 
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  // Base URL calculation
  const baseUrl = window.location.origin + window.location.pathname;

  const screens = [
    {
      key: 'app',
      name: 'أبلكيشن العملاء الذكي (طلب أونلاين وتتبع حي)',
      param: '?screen=app',
      role: 'للعملاء والزبائن للطلب عبر الموبايل',
      icon: Smartphone,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      filePath: 'src/components/pos/CustomerTalabatApp.tsx',
      description: 'واجهة تطبيق سريعة مثل طلبات مخصصة لمطعم نجم، تحتوي على تتبع مسار الأوردر، محفظة النقاط، ووسائل الدفع (كاش، إنستاباي، فيزا، محفظة).',
    },
    {
      key: 'cashier',
      name: 'شاشة الكاشير و الـ POS (تحصيل وطباعة شيكات)',
      param: '?screen=cashier',
      role: 'للكاشير وصندوق الخزينة',
      icon: Receipt,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      filePath: 'src/components/pos/CashierScreen.tsx',
      description: 'شاشة مبيعات الشيفت، الشيكات المقفلة، طرق الدفع، طباعة الشيك الحراري (72mm)، أمان منع الإلغاء إلا بباسوورد المدير، ومراقبة الطاولات.',
    },
    {
      key: 'captain',
      name: 'شاشة كابتن الصالة (تسجيل أوردرات الطاولات)',
      param: '?screen=captain',
      role: 'لكباتن الصالة على الموبايل والتابلت',
      icon: ChefHat,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      filePath: 'src/components/pos/CaptainScreen.tsx',
      description: 'شاشة سريعة تفتح على موبايل الكابتن لتسجيل أوردر الطاولة فوراً أثناء الوقوف مع الزبون وإرسالها للمطبخ والكاشير لتوفير الوقت.',
    },
    {
      key: 'driver',
      name: 'شاشة طيار الدليفري (الحساب اليومي وساعات العمل)',
      param: '?screen=driver',
      role: 'لطياري الدليفري في الشارع',
      icon: Bike,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
      filePath: 'src/components/pos/DriverScreen.tsx',
      description: 'تسجيل ساعات الحضور، استلام الأوردرات، زر فتح خريطة العميل على خرائط جوجل، عداد الرحلات، وحساب العهدة النقدية والعمولة لتوريدها.',
    },
    {
      key: 'accountant',
      name: 'شاشة المحاسب المالي (الجرد والمصروفات والأرباح)',
      param: '?screen=accountant',
      role: 'للمحاسب المالي ومراقب التكاليف',
      icon: Calculator,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      filePath: 'src/components/pos/AccountantScreen.tsx',
      description: 'الجرد الفعلي لمخزون اللحوم والخامات، تسجيل سندات الصرف والنثريات، حساب صافي الأرباح، وتصدير شيت إكسيل المحاسبة الرسمي.',
    },
    {
      key: 'admin',
      name: 'لوحة الإدارة والتحكم الشاملة (إسلام نجم)',
      param: '?screen=admin',
      role: 'لمدير عام وصاحب المطعم',
      icon: ShieldCheck,
      color: 'text-red-400 bg-red-500/10 border-red-500/30',
      filePath: 'src/components/AdminDashboard.tsx',
      description: 'دراسة ومقارنة أسعار المنافسين الأربعة (الربيع، البرنس، الدهان، الرفاعي) + محاكي التسعير + تصدير شيت الإكسيل + عمولات الكباتن والمخزن.',
    },
    {
      key: 'website',
      name: 'الموقع الرسمي لمطعم وجزارة نجم (الواجهة العامة)',
      param: '?screen=website',
      role: 'للعامة وزوار الموقع على الإنترنت',
      icon: Globe,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      filePath: 'src/App.tsx',
      description: 'الواجهة التسويقية الفاخرة: استعراض المنيو، حكاية جزارة السماح، عروض طاجن ليلة الخميس، وسلة الطلبات السريعة بالواتساب.',
    },
  ];

  const handleCopy = (fullUrl: string, key: string) => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 text-right font-['Cairo',sans-serif]">
      <div className="relative w-full max-w-4xl bg-[#141417] border border-stone-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
                  روابط الشاشات + خريطة الأكواد
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  دليل الروابط المباشرة لشاشات مطعم نجم
                </h3>
              </div>
              <p className="text-[11px] text-stone-400">
                تقدر تنسخ أي رابط وتبعتوا للكاشير أو الكابتن أو الطيار يفتحه مباشرة على جهازه!
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <LinkIcon className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Screens Directory Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          <div className="p-3.5 bg-stone-900/60 border border-stone-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-stone-300">
              <FolderGit2 className="w-4 h-4 text-amber-400" />
              <span>
                <strong>الدومين الأساسي للمشروع:</strong> <code className="text-amber-400 font-mono px-2 py-0.5 bg-black rounded text-[11px]">{baseUrl}</code>
              </span>
            </div>
            <span className="text-[11px] text-stone-400">
              أي رابط أدناه يفتح الشاشة المحددة مباشرة دون المرور بالصفحة الرئيسية.
            </span>
          </div>

          <div className="space-y-3">
            {screens.map((s) => {
              const fullUrl = `${baseUrl}${s.param}`;
              const isCopied = copiedKey === s.key;
              const Icon = s.icon;

              return (
                <div
                  key={s.key}
                  className="p-4 bg-stone-900 border border-stone-800 hover:border-amber-500/40 rounded-2xl space-y-2.5 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/80 pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${s.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">{s.name}</h4>
                        <span className="text-[11px] text-stone-400">{s.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          onNavigateToScreen(s.key);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>فتح الشاشة الآن</span>
                      </button>

                      <button
                        onClick={() => handleCopy(fullUrl, s.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-500 hover:bg-amber-400 text-black'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>تم النسخ!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ الرابط</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* URL Box & File Path */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
                    <div className="p-2 bg-black rounded-lg border border-stone-800 font-mono text-[11px] text-amber-300 truncate flex-1 text-left">
                      {fullUrl}
                    </div>

                    <div className="flex items-center gap-1.5 text-stone-400 text-[11px] shrink-0 font-mono">
                      <Code2 className="w-3.5 h-3.5 text-stone-500" />
                      <span>الملف: {s.filePath}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-300 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Project Architecture Map */}
          <div className="p-4 bg-stone-950 border border-stone-800 rounded-2xl space-y-2 text-xs">
            <h5 className="font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-amber-400" />
              <span>هيكل ومجلدات أكواد المشروع (Source Code Architecture):</span>
            </h5>
            <div className="font-mono text-[11px] text-stone-400 space-y-1 bg-stone-900 p-3 rounded-xl border border-stone-800 text-left leading-relaxed">
              <div>📁 src/</div>
              <div>&nbsp;&nbsp;├── 📄 App.tsx (المحرك الرئيسي والـ URL Router للشاشات)</div>
              <div>&nbsp;&nbsp;├── 📁 context/</div>
              <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── 📄 RestaurantContext.tsx (الـ ERP، الأوردرات، الجرد، العمولات، الصلاحيات)</div>
              <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── 📄 CartContext.tsx (إدارة سلة الطلبات)</div>
              <div>&nbsp;&nbsp;├── 📁 components/pos/</div>
              <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── 📄 CustomerTalabatApp.tsx (أبلكيشن العملاء والتتبع الحي)</div>
              <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── 📄 CashierScreen.tsx (الكاشير، الـ POS، طرق الدفع والشيكات الحرارية)</div>
              <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── 📄 CaptainScreen.tsx (كابتن الصالة على الموبايل والطاولات)</div>
              <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── 📄 DriverScreen.tsx (الطيار، ساعات العمل، والعهدة النقدية)</div>
              <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── 📄 AccountantScreen.tsx (المحاسب، جرد اللحوم، وسندات الصرف)</div>
              <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── 📄 StaffPortalModal.tsx (بوابة التنقل بين الصلاحيات)</div>
              <div>&nbsp;&nbsp;├── 📁 data/</div>
              <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── 📄 menuData.ts (المنيو الكامل - 60+ صنف من الـ PDF)</div>
              <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── 📄 competitorData.ts (بيانات المنافسين: الربيع، البرنس، الدهان، الرفاعي)</div>
              <div>&nbsp;&nbsp;└── 📁 utils/</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── 📄 exportExcel.ts (تصدير شيتات الإكسيل .xlsx الرسمية)</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
