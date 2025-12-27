import React, { useState, useEffect } from 'react';
import { StudentData } from '../types';
import { Save, Lock, User } from 'lucide-react';

interface ProfileProps {
  user: StudentData;
  onUpdateUser: (updates: Partial<StudentData>) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    name: user.name || "",
    major: user.major || "Informatika",
    learning_style: user.learning_style || "Visual",
    interest: user.interest || "Computer Science"
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    setFormData({
      name: user.name || "",
      major: user.major || "Informatika",
      learning_style: user.learning_style || "Visual",
      interest: user.interest || "Computer Science"
    });
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id.toString(),
          full_name: formData.name,
          learning_style: formData.learning_style,
          interest: formData.interest
        })
      });

      if (!res.ok) throw new Error("Gagal update profil");
      
      onUpdateUser({
        name: formData.name,
        learning_style: formData.learning_style,
        interest: formData.interest
      });
      alert("Profil berhasil disimpan permanen!");
    } catch (e) {
      alert("Error saving profile");
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Password baru tidak cocok!");
      return;
    }
    
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id.toString(),
          old_password: passwordData.oldPassword,
          new_password: passwordData.newPassword
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail);
      }
      
      alert("Password berhasil diubah!");
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e: any) {
      alert("Gagal: " + e.message);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Edit Profil & Keamanan</h1>

      {/* Bagian Data Diri */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-slate-500" /> Detail Pribadi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Gaya Belajar</label>
            <select name="learning_style" value={formData.learning_style} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-white">
              <option value="Visual">Visual</option>
              <option value="Auditory">Auditory</option>
              <option value="Kinesthetic">Kinesthetic</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Minat Utama</label>
            <input type="text" name="interest" value={formData.interest} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none" />
          </div>
        </div>
        <div className="text-right">
            <button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ml-auto">
                <Save className="w-4 h-4" /> Simpan Profil
            </button>
        </div>
      </div>

      {/* Bagian Ganti Password */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-500" /> Ganti Password
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password Lama</label>
                <input type="password" name="oldPassword" value={passwordData.oldPassword} onChange={handlePasswordChange} className="w-full border border-slate-300 rounded-lg px-4 py-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password Baru</label>
                <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className="w-full border border-slate-300 rounded-lg px-4 py-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Konfirmasi Password</label>
                <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="w-full border border-slate-300 rounded-lg px-4 py-2" />
            </div>
        </div>
        <div className="text-right">
            <button onClick={handleChangePassword} className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ml-auto">
                <Lock className="w-4 h-4" /> Update Password
            </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;