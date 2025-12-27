import pandas as pd
import os

# 1. LOAD DATA
base_dir = os.path.dirname(os.path.abspath(__file__))
# Asumsi file raw ada di folder yang sama atau anda sesuaikan path-nya
# Jika file raw tidak ada di folder backend, script ini butuh path ke file raw.
# Kita pakai logika CSV final vs CSV User level saja untuk melihat filter

path_final = os.path.join(base_dir, "data", "user_level_features_final_for_ML.csv")
# Kita bandingkan dengan merged_score (yang harusnya memuat semua user yang punya nilai)
path_score = os.path.join(base_dir, "data", "merged_score_data_cleaned.csv")

print("📂 Membandingkan Data...")
df_final = pd.read_csv(path_final)
df_score = pd.read_csv(path_score)

# Ambil list ID
ids_final = set(df_final['userid'].unique())
ids_score = set(df_score['userid'].unique())

print(f"📊 User di Final ML (User Level): {len(ids_final)}")
print(f"📊 User di Data Nilai (Score Data): {len(ids_score)}")

# Cek Anomali ID Kecil di Data Final
anomali = [uid for uid in ids_final if uid < 1000] # Anggap ID < 1000 itu admin/test
print(f"\n⚠️ User ID Mencurigakan (ID < 1000) yang MASUK ke ML: {len(anomali)}")
print(f"   Daftar ID: {sorted(anomali)}")
print("   (Saran: Hapus user ini dari SQLite agar tidak mengganggu)")

# Cek user yang ada di Nilai tapi tidak masuk Final (Harusnya 0, karena outer merge)
hilang = ids_score - ids_final
print(f"\n👻 User yang ada di Nilai tapi hilang di Final: {len(hilang)}")

# Cek Statistik Cluster
print("\n📦 Distribusi Cluster pada 444 Data Final:")
print(df_final['cluster'].value_counts())