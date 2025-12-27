import pandas as pd
import os

# 1. SETUP PATH
base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "data", "merged_score_data_cleaned.csv")

print(f"📂 Membaca file: {csv_path}")

# Baca sebagai String dulu agar kita bisa lihat bentuk aslinya (Koma atau Titik)
df = pd.read_csv(csv_path, dtype=str)

# 2. TARGET PENCARIAN
TARGET_USER = "66745"
TARGET_CLASS = "CAK1EAB3-IF-48-01PJJ"

print(f"\n🔍 MENCARI DATA:")
print(f"   User ID : {TARGET_USER}")
print(f"   Class ID: {TARGET_CLASS}")
print("-" * 50)

# 3. FILTER
# Kita cari berdasarkan user dulu
user_data = df[df['userid'] == TARGET_USER]

if user_data.empty:
    print("❌ User ID tidak ditemukan sama sekali di CSV!")
else:
    print(f"✅ User ditemukan ({len(user_data)} baris aktivitas).")
    
    # Cek apakah user ini mengambil kelas target
    # Kita pakai str.contains agar jika ada spasi tetap ketemu
    class_data = user_data[user_data['courseshortname'].str.contains("IF-48-01PJJ", na=False)]
    
    if class_data.empty:
        print(f"❌ User ada, TAPI tidak ada data untuk kelas '{TARGET_CLASS}'")
        print("   Kelas yang diambil user ini:")
        print(user_data['courseshortname'].unique())
    else:
        print(f"✅ Ditemukan {len(class_data)} data untuk kelas ini!")
        print("\n📊 SAMPEL DATA NILAI ASLI (MENTAH DARI CSV):")
        cols = ['quizname', 'final_quiz_grade', 'courseshortname']
        print(class_data[cols].head(10).to_string(index=False))
        
        # 4. SIMULASI KONVERSI (DEBUGGING LOGIKA KOMA)
        print("\n🧮 SIMULASI KONVERSI NILAI:")
        for idx, row in class_data.head(5).iterrows():
            raw_val = str(row['final_quiz_grade'])
            
            # Logika Backend Saat Ini
            clean_val = raw_val.replace(',', '.')
            try:
                float_val = float(clean_val)
                print(f"   Asli: '{raw_val}' -> Replace: '{clean_val}' -> Float: {float_val} ✅")
            except:
                print(f"   Asli: '{raw_val}' -> Replace: '{clean_val}' -> GAGAL KONVERSI ❌")

print("\n" + "="*50)