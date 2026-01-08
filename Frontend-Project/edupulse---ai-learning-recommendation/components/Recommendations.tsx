import React, { useState } from 'react';
import { StudentData } from '../types';
import { BrainCircuit, RefreshCw, Book, CheckCircle, Zap, Users, Star, TrendingUp, PlayCircle, Search, ExternalLink } from 'lucide-react';
import InfoTooltip from './InfoTooltip'; // Import komponen Tooltip

interface RecProps {
  user: StudentData;
}

interface Material {
  title: string;
  type: string;
  url: string;
  thumbnail?: string; 
  video_id?: string;
}

interface AIResponse {
  status: string;
  match_percentage: number;
  strategy: string;
  materials: Material[];
  tips: string;
  weak_subject: string;
  peer_group: string[];
  mentor: string;
  predicted_score: number;
  optimal_time: string;
}

const Recommendations: React.FC<RecProps> = ({ user }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);

  const handleAnalysis = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch('https://riodino14-edupulse-backend.hf.space/api/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          learning_style: user.learning_style || "Visual",
          interest: user.interest || "Computer Science"
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      alert("Gagal menghubungi AI Engine. Pastikan backend online.");
    } finally {
      setAnalyzing(false);
    }
  };

  // 1. TAMPILAN AWAL (BELUM ANALISIS)
  if (!result && !analyzing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BrainCircuit className="text-red-600" /> Mesin Rekomendasi AI
          </h1>
          <button 
            onClick={handleAnalysis}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-red-200 transition-all transform hover:scale-105"
          >
            Analisis Profil Saya (AI)
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-[60vh] flex flex-col items-center justify-center text-center p-8">
          <div className="bg-red-50 p-6 rounded-full mb-6">
            <BrainCircuit className="w-16 h-16 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Siap Mengoptimalkan Pembelajaran?</h2>
          <p className="text-slate-500 max-w-md">
            AI akan menganalisis Engagement Score, Nilai Kuis, dan Cluster Belajar Anda untuk memberikan strategi personalisasi.
          </p>
        </div>
      </div>
    );
  }

  // 2. TAMPILAN LOADING
  if (analyzing) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mb-4"></div>
        <p className="text-slate-600 font-medium animate-pulse">Menghubungkan ke Knowledge Base...</p>
        <p className="text-slate-400 text-sm mt-2">Menganalisis pola belajar...</p>
      </div>
    );
  }

  // Filter Materi (Video vs Search)
  const specificVideos = result?.materials.filter(m => m.type === "Specific_Video") || [];
  const searchLinks = result?.materials.filter(m => m.type !== "Specific_Video") || [];

  // 3. TAMPILAN HASIL (RESULT)
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BrainCircuit className="text-red-600" /> Hasil Analisis AI
        </h1>
        <button 
          onClick={handleAnalysis}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Analisis Ulang
        </button>
      </div>

      {/* HEADER DIAGNOSA */}
      <div className="bg-gradient-to-r from-red-900 to-red-700 rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
            <h2 className="text-lg font-bold mb-4 flex items-center">
                <Zap className="w-5 h-5 text-yellow-400 mr-2" /> 
                Diagnosa: {result?.status}
                <InfoTooltip text="Label Cluster hasil algoritma K-Means (Unsupervised Learning) yang mengelompokkan mahasiswa berdasarkan pola Nilai & Engagement." />
            </h2>
            <p className="leading-relaxed text-red-50 max-w-3xl text-lg mb-4">"{result?.tips}"</p>
            
            <div className="flex flex-wrap gap-4 mt-6">
                <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <p className="text-xs text-red-200 uppercase font-bold flex items-center">
                        Fokus Utama <InfoTooltip text="Topik kuis dengan nilai terendah di database Anda saat ini. Prioritas perbaikan tertinggi." />
                    </p>
                    <p className="font-medium text-white">{result?.weak_subject}</p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <p className="text-xs text-red-200 uppercase font-bold flex items-center">
                        Jadwal Optimal <InfoTooltip text="Dihitung menggunakan Statistik Modus (Frekuensi Tertinggi) dari timestamp login Anda di file Logs LMS." />
                    </p>
                    <p className="font-medium text-white">{result?.optimal_time}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI: STRATEGI & SOCIAL */}
        <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-lg bg-green-50 text-green-600"><CheckCircle className="w-6 h-6" /></div>
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">{result?.match_percentage}% Match</span>
                </div>
                <h3 className="font-bold text-slate-800 mb-2 flex items-center">
                    Strategi <InfoTooltip text="Pendekatan belajar yang disarankan berdasarkan karakteristik Cluster Anda (Misal: Active Learner butuh tantangan, At Risk butuh fondasi)." />
                </h3>
                <p className="text-slate-500 mb-4">{result?.strategy}</p>
                
                <div className="mt-auto bg-green-50 p-4 rounded-lg border border-green-100 flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                    <div>
                        <p className="text-xs text-green-800 font-bold uppercase flex items-center">
                            Potensi Nilai Akhir <InfoTooltip text="Proyeksi Nilai: (Rata-rata Topik Terlemah + Boost Poin). Boost diberikan berdasarkan Konsistensi Belajar Anda." />
                        </p>
                        <p className="text-2xl font-bold text-green-700">{result?.predicted_score}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-lg bg-purple-50 text-purple-600"><Users className="w-6 h-6" /></div>
                </div>
                <h3 className="font-bold text-slate-800 mb-4">Social Learning</h3>
                
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1 flex items-center">
                            Rekomendasi Teman <InfoTooltip text="Peer Grouping: Algoritma mencari mahasiswa lain dalam Cluster yang sama untuk kolaborasi yang setara." />
                        </p>
                        <ul className="text-sm text-slate-700 list-disc ml-4">
                            {result?.peer_group.map((peer, idx) => <li key={idx}>{peer}</li>)}
                        </ul>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1 flex items-center">
                            Rekomendasi Mentor <InfoTooltip text="Expert Finding: Algoritma mencari mahasiswa dengan nilai > 85 pada mata kuliah yang menjadi kelemahan Anda." />
                        </p>
                        <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-bold text-slate-800">{result?.mentor}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* KOLOM KANAN: MATERI (GRID + LIST) */}
        <div className="lg:col-span-2 space-y-6">
             <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-slate-800 text-lg">Materi Terkurasi</h3>
                <InfoTooltip text="Hybrid Recommendation: Menampilkan video spesifik jika ada di database (Knowledge Base), atau melakukan Smart Search ke YouTube jika topik belum terdaftar." />
             </div>
             
             {/* 1. CURATED VIDEOS (GRID) */}
             {specificVideos.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <PlayCircle className="text-red-600 w-5 h-5" /> Video Pilihan (Terkurasi)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {specificVideos.map((vid, idx) => (
                            <a key={idx} href={vid.url} target="_blank" rel="noreferrer" className="group block">
                                <div className="relative rounded-lg overflow-hidden border border-slate-200 aspect-video mb-2">
                                    <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                                        <div className="bg-red-600 rounded-full p-3 text-white shadow-lg group-hover:scale-110 transition-transform">
                                            <PlayCircle className="w-6 h-6 fill-white" />
                                        </div>
                                    </div>
                                </div>
                                <p className="font-medium text-slate-800 text-sm group-hover:text-red-600 line-clamp-2">{vid.title}</p>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. SEARCH LINKS (LIST) */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Search className="text-blue-600 w-5 h-5" /> Referensi Tambahan (Smart Search)
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    {searchLinks.map((item, idx) => (
                        <a key={idx} href={item.url} target="_blank" rel="noreferrer" className="flex items-center justify-between bg-slate-50 p-4 rounded border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-2 rounded text-blue-600 border border-slate-100 group-hover:border-blue-200">
                                    <ExternalLink className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-slate-800 font-medium text-sm group-hover:text-blue-600">{item.title}</p>
                                    <p className="text-xs text-slate-400 uppercase">{item.type}</p>
                                </div>
                            </div>
                            <span className="text-xs text-slate-400 group-hover:text-blue-500">Buka Link →</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Recommendations;