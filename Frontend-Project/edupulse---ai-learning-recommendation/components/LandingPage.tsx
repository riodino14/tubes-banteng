import React from 'react';
import { BookOpen, BrainCircuit, TrendingUp, Users, ArrowRight } from 'lucide-react';

interface LandingProps {
  onLoginClick: () => void;
}

const LandingPage: React.FC<LandingProps> = ({ onLoginClick }) => {
  
  // Fungsi untuk scroll mulus ke bagian fitur
  const handleScrollToFeatures = () => {
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* --- NAVBAR --- */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-2 rounded-lg">
              <BookOpen className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-800">EduPulse</span>
          </div>
          <button 
            onClick={onLoginClick}
            className="text-sm font-medium text-slate-600 hover:text-red-600 transition-colors px-4 py-2"
          >
            Masuk / Login
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-sm font-bold border border-red-100">
                <BrainCircuit className="w-4 h-4" />
                <span>Powered by Machine Learning</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-slate-900">
                Optimalkan Potensi Akademik Anda dengan <span className="text-red-600">AI</span>.
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                EduPulse menganalisis gaya belajar, nilai, dan aktivitas Anda untuk memberikan rekomendasi materi, jadwal, dan mentor yang paling personal.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={onLoginClick}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-red-200 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  Mulai Sekarang <ArrowRight className="w-5 h-5" />
                </button>
                
                {/* --- TOMBOL PELAJARI SELENGKAPNYA (SUDAH AKTIF) --- */}
                <button 
                  onClick={handleScrollToFeatures}
                  className="px-8 py-4 rounded-xl font-bold text-slate-600 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-200"
                >
                  Pelajari Selengkapnya
                </button>
              </div>
            </div>
            
            {/* Hero Illustration */}
            <div className="relative hidden lg:block">
              <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl -z-10"></div>
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs font-bold text-slate-400">DASHBOARD MAHASISWA</div>
                </div>
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1 bg-green-50 p-4 rounded-lg">
                            <p className="text-xs text-green-600 font-bold">IPK ESTIMASI</p>
                            <p className="text-2xl font-bold text-slate-800">3.85</p>
                        </div>
                        <div className="flex-1 bg-blue-50 p-4 rounded-lg">
                            <p className="text-xs text-blue-600 font-bold">RATA-RATA</p>
                            <p className="text-2xl font-bold text-slate-800">92.5%</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <BrainCircuit className="w-5 h-5 text-red-600" />
                            <p className="text-sm font-bold">Rekomendasi AI</p>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full w-full mb-2">
                            <div className="h-2 bg-red-500 rounded-full w-3/4"></div>
                        </div>
                        <p className="text-xs text-slate-500">Tingkatkan pemahaman pada Logika Fuzzy.</p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* --- FEATURES SECTION (DITAMBAHKAN ID="features") --- */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Kenapa EduPulse?</h2>
            <p className="text-slate-500">
              Sistem kami tidak hanya mencatat nilai, tapi memahami pola belajar Anda untuk memberikan solusi konkrit.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={BrainCircuit}
              title="Analisis Gaya Belajar"
              desc="Apakah Anda tipe Visual atau Auditory? AI menyesuaikan rekomendasi materi (Video/Podcast) sesuai preferensi Anda."
            />
            <FeatureCard 
              icon={TrendingUp}
              title="Prediksi & Intervensi"
              desc="Deteksi dini risiko ketertinggalan. Dapatkan peringatan dan strategi perbaikan sebelum terlambat."
            />
            <FeatureCard 
              icon={Users}
              title="Smart Peer Grouping"
              desc="Temukan teman belajar yang satu frekuensi (Cluster) atau Mentor sebaya untuk meningkatkan motivasi."
            />
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <BookOpen className="text-white w-6 h-6" />
            <span className="text-xl font-bold text-white">EduPulse</span>
          </div>
          <p className="text-sm">© 2025 Computing Project. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc }: any) => (
  <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 group">
    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
      <Icon className="w-6 h-6 text-red-600" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed text-sm">
      {desc}
    </p>
  </div>
);

export default LandingPage;