import React, { useState } from 'react';
import { StudentData } from '../types';
import { BrainCircuit, RefreshCw, Book, CheckCircle, Zap, Users, Star, TrendingUp } from 'lucide-react';

interface RecProps {
  user: StudentData;
}

interface Material {
  title: string;
  type: string;
  url: string;
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
      const response = await fetch('https://riodino14-edupulse-backend.hf.space//api/recommendation', {
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
      alert("Gagal menghubungi AI Engine.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!result && !analyzing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BrainCircuit className="text-red-600" /> Mesin Rekomendasi AI
          </h1>
          <button onClick={handleAnalysis} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium shadow-lg">
            Analisis Profil Saya (AI)
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-[60vh] flex flex-col items-center justify-center text-center p-8">
          <div className="bg-red-50 p-6 rounded-full mb-6"><BrainCircuit className="w-16 h-16 text-red-600" /></div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Siap Mengoptimalkan Pembelajaran?</h2>
          <p className="text-slate-500 max-w-md">AI akan menganalisis Engagement Score, Nilai Kuis, dan Cluster Belajar Anda.</p>
        </div>
      </div>
    );
  }

  if (analyzing) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mb-4"></div>
        <p className="text-slate-600 font-medium animate-pulse">Menghubungkan ke Neural Network...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BrainCircuit className="text-red-600" /> Hasil Analisis AI
        </h1>
        <button onClick={handleAnalysis} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" /> Analisis Ulang
        </button>
      </div>

      {/* 1. HEADER RINGKASAN */}
      <div className="bg-gradient-to-r from-red-900 to-red-700 rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" /> Diagnosa: {result?.status}
            </h2>
            <p className="leading-relaxed text-red-50 max-w-3xl text-lg mb-4">"{result?.tips}"</p>
            
            <div className="flex gap-4 mt-6">
                <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <p className="text-xs text-red-200 uppercase font-bold">Fokus Utama</p>
                    <p className="font-medium text-white">{result?.weak_subject}</p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <p className="text-xs text-red-200 uppercase font-bold">Jadwal Optimal</p>
                    <p className="font-medium text-white">{result?.optimal_time}</p>
                </div>
            </div>
        </div>
      </div>

      {/* 2. GRID FITUR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD STRATEGI & PREDIKSI */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-lg bg-green-50 text-green-600"><CheckCircle className="w-6 h-6" /></div>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">{result?.match_percentage}% Match</span>
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Strategi & Prediksi</h3>
            <p className="text-slate-500 mb-4">{result?.strategy}</p>
            
            <div className="mt-auto bg-green-50 p-4 rounded-lg border border-green-100 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                    <p className="text-xs text-green-800 font-bold uppercase">Potensi Nilai Akhir</p>
                    <p className="text-2xl font-bold text-green-700">{result?.predicted_score}</p>
                </div>
            </div>
        </div>

        {/* CARD SOCIAL LEARNING (PEER & MENTOR) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-lg bg-purple-50 text-purple-600"><Users className="w-6 h-6" /></div>
            </div>
            <h3 className="font-bold text-slate-800 mb-4">Social Learning</h3>
            
            <div className="space-y-4">
                <div>
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Rekomendasi Teman Belajar</p>
                    <ul className="text-sm text-slate-700 list-disc ml-4">
                        {result?.peer_group.map((peer, idx) => <li key={idx}>{peer}</li>)}
                    </ul>
                </div>
                <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Rekomendasi Mentor</p>
                    <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-slate-800">{result?.mentor}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* CARD MATERI (SMART LINKS) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col md:col-span-2">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600"><Book className="w-6 h-6" /></div>
            </div>
            <h3 className="font-bold text-slate-800 mb-4">Materi Terkurasi (Smart Links)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result?.materials.map((item, idx) => (
                <a key={idx} href={item.url} target="_blank" rel="noreferrer" className="flex items-start bg-slate-50 p-4 rounded border border-slate-200 hover:border-red-300 hover:shadow-md transition-all group">
                  <span className="mr-3 text-red-500 font-bold group-hover:scale-110 transition-transform">▶</span>
                  <div>
                      <p className="text-slate-800 font-medium text-sm group-hover:text-red-600">{item.title}</p>
                      <p className="text-xs text-slate-400 mt-1 uppercase">{item.type}</p>
                  </div>
                </a>
              ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default Recommendations;