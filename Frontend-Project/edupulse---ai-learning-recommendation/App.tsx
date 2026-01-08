import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, User, BrainCircuit, LogOut, BookOpen, Users, Menu, X } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Recommendations from './components/Recommendations';
import AdminPanel from './components/AdminPanel';
import LandingPage from './components/LandingPage';
import ChatBot from './components/ChatBot';
import { StudentData } from './types';

// DEFINISI URL BACKEND DI SINI AGAR TIDAK SALAH KETIK LAGI
const API_BASE_URL = "https://riodino14-edupulse-backend.hf.space";

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<StudentData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAppInitializing, setIsAppInitializing] = useState(true);

  // --- 1. CEK LOGIN SAAT APLIKASI DIBUKA (PERSISTENCE) ---
  useEffect(() => {
    const checkSession = async () => {
      const storedRole = localStorage.getItem('edupulse_role');
      const storedUid = localStorage.getItem('edupulse_uid');

      if (storedRole === 'admin') {
        setIsAdmin(true);
      } else if (storedRole === 'student' && storedUid) {
        try {
          // PERBAIKAN URL: Gunakan variabel API_BASE_URL + /api/...
          const response = await fetch(`${API_BASE_URL}/api/student/${storedUid}`);
          if (response.ok) {
            const data = await response.json();
            const fullUserData: StudentData = {
                ...data,
                name: data.name || `Mahasiswa ${storedUid}`,
                major: "PJJ Informatika",
                learning_style: data.learning_style || "Visual",
                interest: data.interest || "Computer Science"
            };
            setCurrentUser(fullUserData);
          } else {
            handleLogout();
          }
        } catch (e) {
          console.error("Gagal restore session");
        }
      }
      setIsAppInitializing(false);
    };

    checkSession();
  }, []);

  // --- FUNGSI LOGIN SISWA ---
  const handleLoginAsStudent = async (userIdInput: string, passwordInput: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new URLSearchParams();
      formData.append('username', userIdInput);
      formData.append('password', passwordInput);
      
      // PERBAIKAN URL: Tambahkan /token
      const tokenRes = await fetch(`${API_BASE_URL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      if (!tokenRes.ok) throw new Error("Login Gagal! Periksa ID atau Password.");
      
      // PERBAIKAN URL: Tambahkan /api/student
      const response = await fetch(`${API_BASE_URL}/api/student/${userIdInput}`);
      if (!response.ok) throw new Error("Gagal mengambil data profil.");
      const data = await response.json();

      const fullUserData: StudentData = {
        ...data,
        name: data.name || `Mahasiswa ${userIdInput}`,
        major: "PJJ Informatika",
        learning_style: data.learning_style || "Visual",
        interest: data.interest || "Computer Science"
      };

      localStorage.setItem('edupulse_role', 'student');
      localStorage.setItem('edupulse_uid', userIdInput);

      setCurrentUser(fullUserData);
      setIsAdmin(false);
    } catch (err: any) {
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

        // PERBAIKAN URL: Tambahkan /token
        const tokenRes = await fetch(`${API_BASE_URL}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        if (!tokenRes.ok) throw new Error("Password Admin Salah!");
        
        localStorage.setItem('edupulse_role', 'admin');

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
    localStorage.removeItem('edupulse_role');
    localStorage.removeItem('edupulse_uid');

    setCurrentUser(null);
    setIsAdmin(false);
    setError(null);
    setShowLoginScreen(false);
  };

  // --- RENDERING ---

  if (isAppInitializing) {
    return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400">Memuat EduPulse...</div>;
  }
  
  if (!currentUser && !isAdmin && !showLoginScreen) {
    return <LandingPage onLoginClick={() => setShowLoginScreen(true)} />;
  }

  if (!currentUser && !isAdmin && showLoginScreen) {
    return (
      <LoginScreen 
        onStudentLogin={handleLoginAsStudent} 
        onAdminLogin={handleLoginAsAdmin}
        loading={isLoading}
        error={error}
        setError={setError}
        onBack={() => setShowLoginScreen(false)} 
      />
    );
  }

  return (
    <HashRouter>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        
        <div className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            <Sidebar isAdmin={isAdmin} onLogout={handleLogout} onCloseMobile={() => setIsSidebarOpen(false)} />
        </div>

        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
            ></div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative w-full">
           <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden absolute top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-600"
           >
                <Menu className="w-6 h-6" />
           </button>

           {!isAdmin && currentUser && <ChatBot user={currentUser} />}

           <div className="mt-12 md:mt-0"> 
             <Routes>
               {isAdmin ? (
                 <>
                   <Route path="/" element={<AdminPanel />} />
                   <Route path="*" element={<Navigate to="/" />} />
                 </>
               ) : (
                 <>
                   <Route path="/" element={<Dashboard user={currentUser!} />} />
                   <Route path="/profile" element={<Profile user={currentUser!} onUpdateUser={handleUpdateUser} />} />
                   <Route path="/recommendations" element={<Recommendations user={currentUser!} />} />
                   <Route path="*" element={<Navigate to="/" />} />
                 </>
               )}
             </Routes>
           </div>
        </main>
      </div>
    </HashRouter>
  );
};

const LoginScreen = ({ onStudentLogin, onAdminLogin, loading, error, setError, onBack }: any) => {
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [userIdInput, setUserIdInput] = useState("104554");
  const [passwordInput, setPasswordInput] = useState("");

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96 text-center relative">
        <button onClick={onBack} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
        <div className="flex justify-center mb-4"><div className="bg-red-600 p-3 rounded-lg"><BookOpen className="text-white w-8 h-8" /></div></div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">EduPulse</h1>
        <p className="text-slate-500 mb-6">Silakan masuk ke akun Anda</p>
        
        {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded mb-4 border border-red-200 text-left">{error}</div>}

        <div className="flex mb-6 border-b border-slate-200">
            <button className={`flex-1 pb-2 text-sm font-medium ${activeTab === 'student' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-400'}`} onClick={() => { setActiveTab('student'); if(setError) setError(null); }}>Mahasiswa</button>
            <button className={`flex-1 pb-2 text-sm font-medium ${activeTab === 'admin' ? 'text-slate-800 border-b-2 border-slate-800' : 'text-slate-400'}`} onClick={() => { setActiveTab('admin'); if(setError) setError(null); }}>Administrator</button>
        </div>

        <div className="space-y-4 text-left">
          {activeTab === 'student' ? (
            <>
                <div><label className="text-xs font-bold text-slate-500 uppercase">User ID</label><input type="text" value={userIdInput} onChange={(e) => setUserIdInput(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-red-500 outline-none" placeholder="Contoh: 104554" /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Password</label><input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-red-500 outline-none" placeholder="Default: mhs123" /></div>
                <button onClick={() => onStudentLogin(userIdInput, passwordInput)} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex justify-center items-center mt-2">{loading ? "Verifikasi..." : "Login Mahasiswa"}</button>
            </>
          ) : (
            <>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Admin Username</label><input type="text" value="admin" disabled className="w-full border border-slate-200 bg-slate-50 rounded-lg px-4 py-2 mt-1 text-slate-500" /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Password</label><input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-slate-800 outline-none" placeholder="Default: admin123" /></div>
                <button onClick={() => onAdminLogin(passwordInput)} disabled={loading} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 px-4 rounded-lg font-medium transition-colors flex justify-center items-center mt-2">{loading ? "Verifikasi..." : "Login Administrator"}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ isAdmin, onLogout, onCloseMobile }: { isAdmin: boolean, onLogout: () => void, onCloseMobile: () => void }) => {
  const location = useLocation();
  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} onClick={onCloseMobile} className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${isActive ? 'bg-red-50 text-red-600 font-medium border-l-4 border-red-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
        <Icon className={`w-5 h-5 ${isActive ? 'text-red-600' : 'text-slate-400'}`} /><span>{label}</span>
      </Link>
    );
  };
  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-6 flex items-center justify-between"><div className="flex items-center space-x-3"><div className="bg-red-600 p-2 rounded-lg"><BookOpen className="text-white w-6 h-6" /></div><span className="text-xl font-bold text-slate-800">EduPulse</span></div><button onClick={onCloseMobile} className="md:hidden text-slate-400 hover:text-red-600"><X className="w-6 h-6" /></button></div>
      <nav className="flex-1 px-4 py-4">{isAdmin ? <NavItem to="/" icon={Users} label="Manajemen Mahasiswa" /> : <><NavItem to="/" icon={LayoutDashboard} label="Dasbor" /><NavItem to="/profile" icon={User} label="Profil & Nilai" /><NavItem to="/recommendations" icon={BrainCircuit} label="Rekomendasi AI" /></>}</nav>
      <div className="p-4 border-t border-slate-100"><button onClick={onLogout} className="flex items-center space-x-3 px-4 py-3 w-full text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"><LogOut className="w-5 h-5" /><span>Keluar</span></button></div>
    </div>
  );
};

export default App;