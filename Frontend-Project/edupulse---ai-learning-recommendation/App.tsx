import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, User, BrainCircuit, LogOut, BookOpen, Users } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Recommendations from './components/Recommendations';
import AdminPanel from './components/AdminPanel';
import { StudentData } from './types';
import LandingPage from './components/LandingPage'; // Import Landing Page
import ChatBot from './components/ChatBot';
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<StudentData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // STATE BARU UNTUK NAVIGASI LANDING PAGE
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  // --- FUNGSI LOGIN SISWA (DENGAN PASSWORD & TOKEN) ---
  const handleLoginAsStudent = async (userIdInput: string, passwordInput: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Ambil Token Autentikasi (Login)
      const formData = new URLSearchParams();
      formData.append('username', userIdInput);
      formData.append('password', passwordInput);

      const tokenRes = await fetch('https://riodino14-edupulse-backend.hf.space//token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      if (!tokenRes.ok) {
        throw new Error("Login Gagal! Periksa ID atau Password (Default: mhs123).");
      }

      // 2. Jika Token Oke, Ambil Data Profil
      const response = await fetch(`https://riodino14-edupulse-backend.hf.space//api/student/${userIdInput}`);
      
      if (!response.ok) {
        throw new Error("Gagal mengambil data profil.");
      }

      const data = await response.json();

      // 3. Set Data User
      const fullUserData: StudentData = {
        ...data,
        name: `Mahasiswa ${userIdInput}`, 
        major: "PJJ Informatika",
        learning_style: "Visual", 
        interest: "Web Development"
      };

      setCurrentUser(fullUserData);
      setIsAdmin(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNGSI LOGIN ADMIN ---
  const handleLoginAsAdmin = async (passwordInput: string) => {
    setIsLoading(true);
    setError(null);

    try {
        const formData = new URLSearchParams();
        formData.append('username', 'admin');
        formData.append('password', passwordInput);

        const tokenRes = await fetch('https://riodino14-edupulse-backend.hf.space//token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        if (!tokenRes.ok) {
            throw new Error("Password Admin Salah! (Default: admin123)");
        }

        setCurrentUser(null);
        setIsAdmin(true);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleUpdateUser = (updatedFields: Partial<StudentData>) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, ...updatedFields });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setError(null);
  };

// --- LOGIKA TAMPILAN UTAMA ---
  
  // 1. Jika belum login dan belum klik tombol "Masuk" -> Tampilkan Landing Page
  if (!currentUser && !isAdmin && !showLoginScreen) {
    return <LandingPage onLoginClick={() => setShowLoginScreen(true)} />;
  }

  // 2. Jika belum login tapi sudah klik "Masuk" -> Tampilkan Login Screen
  if (!currentUser && !isAdmin && showLoginScreen) {
    return (
      <LoginScreen 
        onStudentLogin={handleLoginAsStudent} 
        onAdminLogin={handleLoginAsAdmin}
        loading={isLoading}
        error={error}
        setError={setError}
        onBack={() => setShowLoginScreen(false)} // Tombol kembali ke Landing
      />
    );
  }

  // 3. Jika sudah login -> Tampilkan Dashboard (Router)
  return (
    <HashRouter>
      <div className="flex h-screen bg-slate-50">
        <Sidebar isAdmin={isAdmin} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-8">

           {/* --- PERBAIKAN DI SINI --- */}
           {/* ChatBot diletakkan DI LUAR <Routes>, tapi masih di dalam <main> */}
           {/* Logika: Muncul jika BUKAN admin dan User ADA */}
           {!isAdmin && currentUser && <ChatBot user={currentUser} />}
           <Routes>
             {isAdmin ? (
               <>
                 <Route path="/" element={<AdminPanel />} />
                 <Route path="*" element={<Navigate to="/" />} />
               </>
             ) : (
               <>
                 {/* Di dalam sini HANYA BOLEH ada Route */}
                 <Route path="/" element={<Dashboard user={currentUser!} />} />
                 <Route path="/profile" element={<Profile user={currentUser!} onUpdateUser={handleUpdateUser} />} />
                 <Route path="/recommendations" element={<Recommendations user={currentUser!} />} />
                 <Route path="*" element={<Navigate to="/" />} />
               </>
             )}
           </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

// --- UPDATE LOGIN SCREEN (Tambah Tombol Back) ---
const LoginScreen = ({ onStudentLogin, onAdminLogin, loading, error, setError, onBack }: any) => {
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [userIdInput, setUserIdInput] = useState("104554");
  const [passwordInput, setPasswordInput] = useState("");

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96 text-center relative">
        
        {/* Tombol Close/Back */}
        <button onClick={onBack} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>

        <div className="flex justify-center mb-4">
          <div className="bg-red-600 p-3 rounded-lg">
            <BookOpen className="text-white w-8 h-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">EduPulse</h1>
        <p className="text-slate-500 mb-6">Silakan masuk ke akun Anda</p>
        
        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded mb-4 border border-red-200 text-left">
            {error}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex mb-6 border-b border-slate-200">
            <button className={`flex-1 pb-2 text-sm font-medium ${activeTab === 'student' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-400'}`} onClick={() => { setActiveTab('student'); if(setError) setError(null); }}>Mahasiswa</button>
            <button className={`flex-1 pb-2 text-sm font-medium ${activeTab === 'admin' ? 'text-slate-800 border-b-2 border-slate-800' : 'text-slate-400'}`} onClick={() => { setActiveTab('admin'); if(setError) setError(null); }}>Administrator</button>
        </div>

        <div className="space-y-4 text-left">
          {activeTab === 'student' ? (
            <>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">User ID</label>
                    <input type="text" value={userIdInput} onChange={(e) => setUserIdInput(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-red-500 outline-none" placeholder="Contoh: 104554" />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                    <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-red-500 outline-none" placeholder="Default: mhs123" />
                </div>
                <button onClick={() => onStudentLogin(userIdInput, passwordInput)} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex justify-center items-center mt-2">{loading ? "Verifikasi..." : "Login Mahasiswa"}</button>
            </>
          ) : (
            <>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Admin Username</label>
                    <input type="text" value="admin" disabled className="w-full border border-slate-200 bg-slate-50 rounded-lg px-4 py-2 mt-1 text-slate-500" />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                    <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-slate-800 outline-none" placeholder="Default: admin123" />
                </div>
                <button onClick={() => onAdminLogin(passwordInput)} disabled={loading} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 px-4 rounded-lg font-medium transition-colors flex justify-center items-center mt-2">{loading ? "Verifikasi..." : "Login Administrator"}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Sidebar Tetap Sama
const Sidebar = ({ isAdmin, onLogout }: { isAdmin: boolean, onLogout: () => void }) => {
  const location = useLocation();
  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${isActive ? 'bg-red-50 text-red-600 font-medium border-l-4 border-red-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
        <Icon className={`w-5 h-5 ${isActive ? 'text-red-600' : 'text-slate-400'}`} /><span>{label}</span>
      </Link>
    );
  };
  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-6 flex items-center space-x-3"><div className="bg-red-600 p-2 rounded-lg"><BookOpen className="text-white w-6 h-6" /></div><span className="text-xl font-bold text-slate-800">EduPulse</span></div>
      <nav className="flex-1 px-4 py-4">{isAdmin ? <NavItem to="/" icon={Users} label="Manajemen Mahasiswa" /> : <><NavItem to="/" icon={LayoutDashboard} label="Dasbor" /><NavItem to="/profile" icon={User} label="Profil & Nilai" /><NavItem to="/recommendations" icon={BrainCircuit} label="Rekomendasi AI" /></>}</nav>
      <div className="p-4 border-t border-slate-100"><button onClick={onLogout} className="flex items-center space-x-3 px-4 py-3 w-full text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"><LogOut className="w-5 h-5" /><span>Keluar</span></button></div>
    </div>
  );
};

export default App;