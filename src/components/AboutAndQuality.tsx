import React from 'react';
import { Award, Flame, UtensilsCrossed, Clock, CheckCircle } from 'lucide-react';

export const AboutAndQuality: React.FC = () => {
  return (
    <section id="about" className="py-16 bg-[#121214] border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Visual Side */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-stone-800 bg-stone-900 shadow-xl">
              <img
                src="/src/assets/images/fatteh_kaware_soup_1792728859366.jpg"
                alt="سفرة ولائم مطعم وجزارة نجم"
                referrerPolicy="no-referrer"
                className="w-full h-80 sm:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 text-right">
                <span className="text-xs font-bold text-amber-400">جزارة السماح</span>
                <h3 className="text-xl font-black text-white mt-1">نجم .. أسم له تاريخ</h3>
                <p className="text-xs text-stone-300 mt-1">
                  مش بس مطعم، إحنا أساس الجزارة واللحمة البلدي في المنطقة من سنين.
                </p>
              </div>
            </div>
          </div>

          {/* Text Content Side */}
          <div className="lg:col-span-7 text-right space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-bold">
              <Award className="w-4 h-4 text-amber-400" />
              <span>ليه تختار مطعم وجزارة نجم؟</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              السر في اللحمة البلدي.. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-red-500">
                من المذبح للجريل بدون وسطاء
              </span>
            </h2>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              لما تكون الجزارة هي صاحبة المطعم، بتضمن تاكل لحمة بلدي صافية 100%، دهون مضبوطة على الشعرة، وجودة لا يمكن أي مطعم تاني ينافسها في السعر أو الطعم. في مطعم نجم مش بنستخدم أي لحوم مجمدة، وده اللي مخلي طعم الحواوشي والكبدة والطواجن عندنا معلم مع كل زبون زارنا.
            </p>

            {/* Quality List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-stone-900/70 border border-stone-800 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>لحوم بلدي طازجة يومياً</span>
                </div>
                <p className="text-xs text-stone-400">
                  توريد يومي من مذابح جزارة السماح المعتمدة بيطرياً بدون أي مجمدات.
                </p>
              </div>

              <div className="p-4 bg-stone-900/70 border border-stone-800 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Flame className="w-4 h-4" />
                  <span>فحم حطب وجريل سخن</span>
                </div>
                <p className="text-xs text-stone-400">
                  شوي أصيل بريحة الحطب البلدي وجريل متبل بتوابل نجم الفريدة.
                </p>
              </div>

              <div className="p-4 bg-stone-900/70 border border-stone-800 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>طواجن فخار بلدي مسبكة</span>
                </div>
                <p className="text-xs text-stone-400">
                  طواجن عكاوي، كوارع، وبصل مستوية في الفرن الفخار على نار هادية.
                </p>
              </div>

              <div className="p-4 bg-stone-900/70 border border-stone-800 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Clock className="w-4 h-4" />
                  <span>خدمة وتوصيل حتى 4 فجراً</span>
                </div>
                <p className="text-xs text-stone-400">
                  شغالين عشانك طول اليوم لغاية وش الفجر عشان يوصلك الأكل سخن وموحوح.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
