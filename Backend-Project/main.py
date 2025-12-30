from fastapi import FastAPI, HTTPException, Query, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import pandas as pd
import pickle
import os
import math
import numpy as np
import random
import re
from database import Base, engine, SessionLocal, UserDB
import google.generativeai as genai # LIBRARY BARU
# ==========================================
# KONFIGURASI GEMINI AI (PASTE KEY DISINI)
# ==========================================
# Ganti teks di bawah dengan API Key 
genai.configure(api_key="AIzaSyBS4EiKyutrZkF1gkI7zo9DtvGqooujmPU")

# Setup Model
# Gunakan model 'flash' yang lebih cepat dan stabil untuk Free Tier
model = genai.GenerativeModel('gemini-2.5-flash')

# 1. SETUP
app = FastAPI(title="EduPulse API", version="13.0 - Smart Context")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, 
    allow_methods=["*"], allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# 2. LOAD DATA
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

try:
    user_df = pd.read_csv(os.path.join(DATA_DIR, "user_level_features_final_for_ML.csv"))
    score_df = pd.read_csv(os.path.join(DATA_DIR, "merged_score_data_cleaned.csv"), dtype={'final_quiz_grade': str})
    
    # Load Logs & Rename
    logs_path = os.path.join(DATA_DIR, "merged_logs_data_cleaned.csv")
    logs_df = pd.read_csv(logs_path, usecols=['actor_userid', 'Time_parsed'])
    logs_df.rename(columns={'actor_userid': 'userid'}, inplace=True)
    logs_df['hour'] = pd.to_datetime(logs_df['Time_parsed'], errors='coerce').dt.hour

    # Cleaning
    def clean_decimal(val):
        if pd.isna(val): return np.nan
        val_str = str(val).strip().replace(',', '.')
        try: return float(val_str)
        except: return np.nan

    score_df['final_quiz_grade'] = score_df['final_quiz_grade'].apply(clean_decimal)
    score_df['courseshortname'] = score_df['courseshortname'].astype(str).str.strip()
    
    with open(os.path.join(DATA_DIR, "recommendation_engine.pkl"), "rb") as f:
        ml_data = pickle.load(f)
        cluster_labels = ml_data["cluster_labels"]

    if 'performance_category' not in user_df.columns:
        user_df['performance_category'] = user_df['mean_score_pct'].apply(lambda x: "High" if x>=80 else "Medium" if x>=60 else "Low")

    print("✅ Data Loaded Successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    user_df, score_df, logs_df, cluster_labels = pd.DataFrame(), pd.DataFrame(), pd.DataFrame(), {}

# --- HELPER FUNCTIONS ---
def fix_grade_value(grade):
    if pd.isna(grade): return 0
    val = float(grade)
    if val > 100: return 100.0
    return round(val, 1)

def clean_course_name(full_name):
    # Mengambil nama mata kuliah bersih tanpa kode dosen
    # Contoh: "MATEMATIKA DISKRIT IF-48-01 [DTO]" -> "Matematika Diskrit"
    try:
        parts = str(full_name).split("IF-")
        subject = parts[0].strip().title()
        return subject
    except: return str(full_name)

def extract_topic_from_quiz(quiz_name):
    # Mengambil topik spesifik dari nama kuis
    # Contoh: "Online Quiz 1: Logika Proposisi" -> "Logika Proposisi"
    name = str(quiz_name)
    if ":" in name:
        return name.split(":")[1].strip()
    if "Exam" in name:
        return name # Biarkan UTS/UAS apa adanya
    return name

def generate_search_query(course, topic):
    # Membersihkan topik dari "(Bagian 1)", "(Bagian 2)" agar search engine lebih akurat
    # Regex: Hapus teks di dalam kurung
    clean_topic = re.sub(r"\(.*?\)", "", topic).strip()
    
    # Gabungkan dengan nama matkul agar spesifik
    # Contoh: "Tutorial Matematika Diskrit materi Pohon"
    return f"{course} materi {clean_topic}"

# --- SEEDING & AUTH (SAMA SEPERTI SEBELUMNYA) ---
def seed_users():
    db = SessionLocal()
    if not db.query(UserDB).filter(UserDB.username == "admin").first():
        db.add(UserDB(username="admin", hashed_password=pwd_context.hash("admin123"), role="admin", full_name="Administrator"))
    if not user_df.empty:
        sample_id = str(user_df.iloc[0]['userid'])
        if not db.query(UserDB).filter(UserDB.username == sample_id).first():
            for _, row in user_df.iterrows():
                uid = str(int(row['userid']))
                if not db.query(UserDB).filter(UserDB.username == uid).first():
                    db.add(UserDB(username=uid, hashed_password=pwd_context.hash("mhs123"), role="student", full_name=f"Mahasiswa {uid}", learning_style="Visual", interest="Computer Science"))
            db.commit()
    db.close()
seed_users()

class Token(BaseModel):
    access_token: str; token_type: str; role: str; user_id: str

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.username == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Username/Password salah")
    return {"access_token": user.username, "token_type": "bearer", "role": user.role, "user_id": user.username}

class ChangePasswordReq(BaseModel):
    user_id: str; old_password: str; new_password: str

@app.put("/api/auth/change-password")
def change_password(req: ChangePasswordReq, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.username == req.user_id).first()
    if not user or not pwd_context.verify(req.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Auth Failed")
    user.hashed_password = pwd_context.hash(req.new_password)
    db.commit()
    return {"msg": "Success"}

class UpdateProfileReq(BaseModel):
    user_id: str; full_name: str; learning_style: str; interest: str

@app.put("/api/student/profile")
def update_profile(req: UpdateProfileReq, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.username == req.user_id).first()
    if user:
        user.full_name = req.full_name
        user.learning_style = req.learning_style
        user.interest = req.interest
        db.commit()
    return {"msg": "Updated"}

# --- ENDPOINTS DATA (REVISI DASHBOARD CHART & REKOMENDASI) ---

# --- REVISI CHART CLEANING & GROUPING ---
@app.get("/api/student/quiz_detail")
def get_student_quiz_detail(user_id: int = Query(...), class_id: str = Query(...)):
    class_id_clean = class_id.strip()
    
    # 1. Filter Data
    details = score_df[
        (score_df["userid"] == user_id) & 
        (score_df["courseshortname"] == class_id_clean)
    ].copy()
    
    if details.empty: return []

    # 2. LOGIKA GROUPING AGRESIF (PENTING!)
    def get_grouping_key(raw_name):
        name = str(raw_name)
        # Gabung semua varian UTS (Tryout, Remedial, Real) jadi satu
        if "Midterm" in name or "UTS" in name: return "UTS"
        # Gabung semua varian UAS jadi satu
        if "Final" in name or "UAS" in name: return "UAS"
        
        # Untuk Quiz, kita rapikan tapi biarkan topiknya ada
        # "Online Quiz 1: Logika" -> Tetap unik per nomor
        if "Online Quiz" in name:
            # Hapus keterangan dalam kurung misal "(Remedial)"
            return name.split("(")[0].strip()
            
        return name

    # Terapkan Grouping Key
    details['group_key'] = details['quizname'].apply(get_grouping_key)

    # 3. GROUP BY & AMBIL NILAI MAX
    # Jika ada 3 "UTS" (Tryout: 60, Real: 80, Remedial: 70), kita ambil 80.
    grouped = details.groupby('group_key')['final_quiz_grade'].max().reset_index()

    # 4. LOGIKA SORTING (Quiz Angka -> UTS -> UAS)
    def sort_key(name):
        name = name.lower()
        if name == "uts": return 1000       # UTS di tengah
        if name == "uas": return 2000       # UAS di akhir
        # Ambil angka pertama yang muncul di string
        import re
        m = re.search(r'\d+', name)
        return int(m.group()) if m else 500 # Quiz tanpa angka di awal

    grouped['sort_val'] = grouped['group_key'].apply(sort_key)
    grouped = grouped.sort_values('sort_val')

    # 5. FORMAT LABEL TAMPILAN (Q1, Q2...)
    def format_display_label(name):
        if name in ["UTS", "UAS"]: return name
        
        if "Online Quiz" in name:
            # Ubah "Online Quiz 1: Logika" -> "Q1: Logika"
            # Split berdasarkan spasi dan titik dua
            parts = name.replace("Online Quiz", "Q").split(":")
            if len(parts) > 1:
                # Ambil Q1 + Nama Topik (dipendekkan dikit)
                return f"{parts[0].strip()}: {parts[1].strip()[:15]}"
            return parts[0].strip()
            
        return name[:15]

    quiz_list = []
    for _, row in grouped.iterrows():
        score_val = fix_grade_value(row['final_quiz_grade'])
        
        # Opsi: Hilangkan bar jika nilainya 0 (Kecuali UTS/UAS biar notice)
        # if score_val == 0 and row['group_key'] not in ["UTS", "UAS"]: continue

        quiz_list.append({
            "quiz_name": format_display_label(row['group_key']), # Label Pendek (X-Axis)
            "full_name": row['group_key'],                       # Nama Lengkap (Tooltip)
            "score": score_val
        })
        
    return quiz_list

@app.get("/api/student/{user_id}")
def get_student_dashboard(user_id: int, db: Session = Depends(get_db)):
    student_csv = user_df[user_df["userid"] == user_id]
    if student_csv.empty: raise HTTPException(status_code=404)
    student_data = student_csv.iloc[0]
    
    user_db = db.query(UserDB).filter(UserDB.username == str(user_id)).first()
    
    # Hitung Nilai
    grades_raw = score_df[score_df["userid"] == user_id]
    course_performance = []
    total_score, count = 0, 0

    if not grades_raw.empty:
        grouped = grades_raw.groupby(["courseshortname", "coursefullname"])['final_quiz_grade'].mean().reset_index()
        for _, row in grouped.iterrows():
            val = fix_grade_value(row['final_quiz_grade'])
            if val > 0:
                total_score += val
                count += 1
            course_performance.append({
                "class_id": row["courseshortname"], 
                "subject": clean_course_name(row["coursefullname"]), # Nama Bersih
                "score": val
            })
    
    real_avg = round(total_score / count, 1) if count > 0 else 0
    cat = "Low" if real_avg < 50 else student_data["performance_category"]

    return {
        "user_id": int(student_data["userid"]),
        "name": user_db.full_name if user_db else f"Mahasiswa {user_id}",
        "learning_style": user_db.learning_style if user_db else "Visual",
        "interest": user_db.interest if user_db else "Computer Science",
        "gpa": round(real_avg / 25, 2),
        "average_score": real_avg,
        "engagement_score": int(student_data["engagement_score"]),
        "performance_category": cat,
        "courses": course_performance,
        "cluster_id": int(student_data["cluster"])
    }

class RecommendationRequest(BaseModel):
    user_id: int; learning_style: str; interest: str

# --- SUPER AI V3 (WITH SCORES IN TIPS) ---
# @app.post("/api/recommendation")
# def get_ai_recommendation(req: RecommendationRequest):
#     # 1. Identifikasi User
#     student = user_df[user_df["userid"] == req.user_id]
#     if student.empty: raise HTTPException(status_code=404, detail="User Not Found")
    
#     row = student.iloc[0]
#     cluster_id = int(row["cluster"])
#     cluster_type = cluster_labels.get(cluster_id, "Unknown")
#     engagement = int(row["engagement_score"])
    
#     # 2. LOGIC JADWAL BELAJAR REAL (MODE)
#     optimal_time = "Pagi Hari (08:00 - 10:00)"
#     user_logs = logs_df[logs_df['userid'] == req.user_id]
    
#     if not user_logs.empty:
#         hours = user_logs['hour'].dropna().astype(int)
#         if len(hours) > 0:
#             most_common_hour = hours.mode()[0]
#             if 5 <= most_common_hour < 12: optimal_time = f"Pagi Hari (Sekitar jam {most_common_hour}:00)"
#             elif 12 <= most_common_hour < 15: optimal_time = f"Siang Hari (Sekitar jam {most_common_hour}:00)"
#             elif 15 <= most_common_hour < 18: optimal_time = f"Sore Hari (Sekitar jam {most_common_hour}:00)"
#             else: optimal_time = f"Malam Hari (Sekitar jam {most_common_hour}:00)"
    
#     # 3. DETEKSI TOPIK SPESIFIK & SKORNYA
#     weak_subjects = [] 
    
#     student_scores = score_df[score_df["userid"] == req.user_id]
#     if not student_scores.empty:
#         # Filter nilai > 0 tapi rendah
#         valid_scores = student_scores[student_scores['final_quiz_grade'] > 0].copy()
        
#         if not valid_scores.empty:
#             # Urutkan dari terjelek
#             valid_scores = valid_scores.sort_values('final_quiz_grade').head(2) 
            
#             for _, bad_quiz in valid_scores.iterrows():
#                 c_name = clean_course_name(bad_quiz['coursefullname'])
#                 raw_topic = extract_topic_from_quiz(bad_quiz['quizname'])
#                 score = fix_grade_value(bad_quiz['final_quiz_grade'])
#                 search_query = generate_search_query(c_name, raw_topic)
                
#                 weak_subjects.append({
#                     "course": c_name,
#                     "topic": raw_topic,
#                     "score": score,
#                     "search_query": search_query
#                 })

#     # Default jika kosong
#     if not weak_subjects:
#         weak_subjects.append({"course": "Umum", "topic": "Materi Dasar", "score": 0, "search_query": "Materi Dasar Informatika"})

#     # 4. PEER & MENTOR
#     peer_list = [f"Mahasiswa {uid}" for uid in user_df[user_df['cluster'] == int(row["cluster"])].sample(min(3, len(user_df)))['userid'].values if uid != req.user_id]

#     mentor_name = "Belum Tersedia"
#     # Cari mentor berdasarkan matkul terlemah pertama
#     weakest_course_id = student_scores.sort_values('final_quiz_grade').iloc[0]['courseshortname'] if not student_scores.empty else ""
    
#     if weakest_course_id:
#         potential_mentors = score_df[
#             (score_df['courseshortname'] == weakest_course_id) & 
#             (score_df['final_quiz_grade'] > 85)
#         ]['userid'].unique()
#         mentor_list = potential_mentors.tolist() 
#         if len(mentor_list) > 0:
#             mentor_id = random.choice(mentor_list)
#             mentor_name = f"Mahasiswa {mentor_id} (Expert)"

#     # 5. MENYUSUN PESAN TIPS DENGAN NILAI (REVISI DI SINI)
#     # Format: "Topik A (Nilai: 50), Topik B (Nilai: 60)"
#     weak_list_text = ", ".join([f"{x['topic']} (Nilai: {x['score']})" for x in weak_subjects])
    
#     # Format untuk Kotak Merah Fokus Utama
#     top_weak = weak_subjects[0]
#     focus_text = f"{top_weak['topic']} (Skor: {top_weak['score']})"

#     # 6. LOGIC CONTENT
#     style = req.learning_style.title()
    
#     materials = []
#     for item in weak_subjects:
#         if style == "Visual":
#             url = f"https://www.youtube.com/results?search_query=Tutorial+{item['search_query'].replace(' ', '+')}"
#             icon_type = "Video"
#         elif style == "Auditory":
#             url = f"https://www.youtube.com/results?search_query=Penjelasan+{item['search_query'].replace(' ', '+')}"
#             icon_type = "Podcast/Audio"
#         else: 
#             url = f"https://www.google.com/search?q=Latihan+Soal+{item['search_query'].replace(' ', '+')}+filetype:pdf"
#             icon_type = "Latihan/PDF"

#         materials.append({
#             "title": f"Pelajari: {item['course']} - {item['topic']}",
#             "type": icon_type,
#             "url": url
#         })

#     # Prediksi
#     current_avg = sum([x['score'] for x in weak_subjects]) / len(weak_subjects)
#     pred_score = min(100, current_avg + 10)

#     return {
#         "status": cluster_type,
#         "match_percentage": 85,
#         "strategy": "Targeted Improvement",
#         "materials": materials,
#         # UPDATE PESAN TIPS BIAR ADA ANGKA
#         "tips": f"Perhatian! Terdeteksi nilai rendah pada: {weak_list_text}. Segera pelajari materi di bawah.",
#         # UPDATE FOKUS UTAMA BIAR ADA ANGKA
#         "weak_subject": focus_text, 
#         "peer_group": peer_list,
#         "mentor": mentor_name,
#         "predicted_score": pred_score,
#         "optimal_time": optimal_time
#     }

# --- SUPER AI V3 (REPLACE BAGIAN INI SAJA) ---
@app.post("/api/recommendation")
def get_ai_recommendation(req: RecommendationRequest):
    # 1. Identifikasi User
    student = user_df[user_df["userid"] == req.user_id]
    if student.empty: raise HTTPException(status_code=404, detail="User Not Found")
    
    row = student.iloc[0]
    cluster_id = int(row["cluster"])
    cluster_type = cluster_labels.get(cluster_id, "Unknown")
    engagement = int(row["engagement_score"])
    
    # 2. LOGIC JADWAL BELAJAR REAL (MODE)
    optimal_time = "Pagi Hari (08:00 - 10:00)"
    user_logs = logs_df[logs_df['userid'] == req.user_id]
    
    if not user_logs.empty:
        hours = user_logs['hour'].dropna().astype(int)
        if len(hours) > 0:
            most_common_hour = hours.mode()[0]
            if 5 <= most_common_hour < 12: optimal_time = f"Pagi Hari (Sekitar jam {most_common_hour}:00)"
            elif 12 <= most_common_hour < 15: optimal_time = f"Siang Hari (Sekitar jam {most_common_hour}:00)"
            elif 15 <= most_common_hour < 18: optimal_time = f"Sore Hari (Sekitar jam {most_common_hour}:00)"
            else: optimal_time = f"Malam Hari (Sekitar jam {most_common_hour}:00)"
    
    # 3. DETEKSI TOPIK SPESIFIK & SKORNYA
    weak_subjects = [] 
    
    student_scores = score_df[score_df["userid"] == req.user_id]
    if not student_scores.empty:
        # Filter nilai > 0 tapi rendah, ambil 2 terbawah
        valid_scores = student_scores[student_scores['final_quiz_grade'] > 0].copy()
        
        if not valid_scores.empty:
            valid_scores = valid_scores.sort_values('final_quiz_grade').head(2) 
            
            for _, bad_quiz in valid_scores.iterrows():
                c_name = clean_course_name(bad_quiz['coursefullname'])
                raw_topic = extract_topic_from_quiz(bad_quiz['quizname'])
                score = fix_grade_value(bad_quiz['final_quiz_grade'])
                search_query = generate_search_query(c_name, raw_topic)
                
                weak_subjects.append({
                    "course": c_name,
                    "topic": raw_topic,
                    "score": score,
                    "search_query": search_query
                })

    # Default jika kosong
    if not weak_subjects:
        weak_subjects.append({"course": "Umum", "topic": "Materi Dasar", "score": 0, "search_query": "Materi Dasar Informatika"})

    # 4. PEER & MENTOR
    peer_list = []
    cluster_peers = user_df[user_df['cluster'] == int(row["cluster"])]
    if len(cluster_peers) > 1:
         # Sample 3 teman, pastikan tidak mengambil diri sendiri
         samples = cluster_peers[cluster_peers['userid'] != req.user_id].sample(min(3, len(cluster_peers)-1))
         peer_list = [f"Mahasiswa {uid}" for uid in samples['userid'].values]

    mentor_name = "Belum Tersedia"
    # Cari mentor berdasarkan matkul terlemah pertama
    weakest_course_id = student_scores.sort_values('final_quiz_grade').iloc[0]['courseshortname'] if not student_scores.empty else ""
    
    if weakest_course_id:
        potential_mentors = score_df[
            (score_df['courseshortname'] == weakest_course_id) & 
            (score_df['final_quiz_grade'] > 85)
        ]['userid'].unique()
        
        mentor_list = potential_mentors.tolist() 
        if len(mentor_list) > 0:
            mentor_id = random.choice(mentor_list)
            mentor_name = f"Mahasiswa {mentor_id} (Expert)"

    # 5. MENYUSUN PESAN TIPS DENGAN NILAI (BAGIAN YANG DIUPDATE)
    # Format: "Topik A (Nilai: 50), Topik B (Nilai: 60)"
    weak_list_text = ", ".join([f"{x['topic']} (Nilai: {x['score']})" for x in weak_subjects])
    
    # Format untuk Kotak Merah Fokus Utama
    top_weak = weak_subjects[0]
    focus_text = f"{top_weak['topic']} (Skor: {top_weak['score']})"

    # 6. LOGIC CONTENT (Generate Link)
    style = req.learning_style.title()
    
    materials = []
    for item in weak_subjects:
        if style == "Visual":
            url = f"https://www.youtube.com/results?search_query=Tutorial+{item['search_query'].replace(' ', '+')}"
            icon_type = "Video"
        elif style == "Auditory":
            url = f"https://www.youtube.com/results?search_query=Penjelasan+{item['search_query'].replace(' ', '+')}"
            icon_type = "Podcast/Audio"
        else: 
            url = f"https://www.google.com/search?q=Latihan+Soal+{item['search_query'].replace(' ', '+')}+filetype:pdf"
            icon_type = "Latihan/PDF"

        materials.append({
            "title": f"Pelajari: {item['course']} - {item['topic']}",
            "type": icon_type,
            "url": url
        })

    # Prediksi
    current_avg = sum([x['score'] for x in weak_subjects]) / len(weak_subjects)
    pred_score = min(100, current_avg + 10)

    return {
        "status": cluster_type,
        "match_percentage": 85,
        "strategy": "Targeted Improvement",
        "materials": materials,
        # UPDATE: Tips sekarang menampilkan angka nilai
        "tips": f"Perhatian! Terdeteksi nilai rendah pada: {weak_list_text}. Segera pelajari materi di bawah.",
        # UPDATE: Fokus utama menampilkan angka nilai
        "weak_subject": focus_text, 
        "peer_group": peer_list,
        "mentor": mentor_name,
        "predicted_score": round(pred_score, 1),
        "optimal_time": optimal_time
    }



# Model data untuk request chat
class ChatRequest(BaseModel):
    user_id: int
    message: str
    learning_style: str

# 🌟 ENDPOINT CHATBOT (INI YANG HILANG) 🌟
@app.post("/api/chat")
async def chat_with_ai(req: ChatRequest):
    # 1. Ambil Konteks Mahasiswa (Biar Chatbot Pinter)
    student = user_df[user_df["userid"] == req.user_id]
    context_text = "Data profil tidak ditemukan."
    
    if not student.empty:
        row = student.iloc[0]
        # Ambil Cluster
        cluster_type = cluster_labels.get(int(row["cluster"]), "Unknown")
        avg_score = row['mean_score_pct']
        
        # Ambil Kelemahan (Topik nilai terendah)
        weakest_subject = "Tidak ada"
        student_scores = score_df[score_df["userid"] == req.user_id]
        if not student_scores.empty:
            valid_scores = student_scores[student_scores['final_quiz_grade'] > 0].sort_values('final_quiz_grade')
            if not valid_scores.empty:
                worst = valid_scores.iloc[0]
                c_name = clean_course_name(worst['coursefullname'])
                t_name = extract_topic_from_quiz(worst['quizname'])
                s_val = fix_grade_value(worst['final_quiz_grade'])
                weakest_subject = f"{c_name} (Topik: {t_name}, Nilai: {s_val})"

        context_text = f"""
        NAMA/ID MAHASISWA: Mahasiswa {req.user_id}
        STATUS AKADEMIK: {cluster_type}
        RATA-RATA NILAI: {avg_score}
        KELEMAHAN UTAMA: {weakest_subject}
        GAYA BELAJAR: {req.learning_style}
        """

    # 2. Susun Instruksi untuk AI (System Prompt)
    system_prompt = f"""
    Kamu adalah 'EduBot', asisten akademik personal dari aplikasi EduPulse.
    
    INFORMASI MAHASISWA LAWAN BICARAMU:
    {context_text}
    
    INSTRUKSI:
    1. Jawablah pertanyaan mahasiswa dengan ramah dan suportif.
    2. MANFAATKAN data di atas! Contoh: "Karena kamu tipe Visual, coba cari video tentang..." atau "Nilai Logika kamu rendah, jangan menyerah."
    3. Jangan menjawab terlalu panjang. Maksimal 3 kalimat paragraf pendek.
    4. Jika mahasiswa menyapa (Halo/Hi), sapa balik dengan menyebut ID atau Namanya dan singgung status akademiknya sedikit untuk basa-basi motivasi.
    """

    try:
        # 3. Kirim ke Google Gemini
        # Pastikan 'model' sudah didefinisikan di paling atas main.py (model = genai.GenerativeModel('gemini-pro'))
        chat = model.start_chat(history=[])
        response = chat.send_message(f"{system_prompt}\n\nUSER BERTANYA: {req.message}")
        
        # Kembalikan jawaban teks
        return {"reply": response.text}
        
    except Exception as e:
        print(f"❌ Error Gemini: {e}")
        return {"reply": "Maaf, saya sedang pusing (Koneksi ke AI bermasalah). Coba tanya lagi nanti ya!"}
    

@app.get("/api/admin/summary")
def get_admin_summary():
    return {"total_students": len(user_df), "avg_gpa": round(user_df["mean_score_pct"].mean() / 25, 2), "at_risk_count": len(user_df[user_df["performance_category"] == "Low"])}

@app.get("/api/admin/classes")
def get_class_list():
    student_avgs = score_df.groupby(['courseshortname', 'coursefullname', 'userid'])['final_quiz_grade'].mean().reset_index()
    class_stats = student_avgs.groupby(['courseshortname', 'coursefullname']).agg(student_count=('userid', 'count'), class_avg_score=('final_quiz_grade', 'mean')).reset_index()
    classes_list = []
    for _, row in class_stats.iterrows():
        avg_score = fix_grade_value(row['class_avg_score']) if pd.notna(row['class_avg_score']) else 0
        classes_list.append({"class_id": row['courseshortname'], "class_name": clean_course_name(row['coursefullname']), "student_count": int(row['student_count']), "avg_score": avg_score})
    return classes_list

@app.get("/api/admin/students_by_class")
def get_students_by_class(class_id: str):
    class_data = score_df[score_df['courseshortname'] == class_id]
    user_stats = class_data.groupby('userid').agg(avg_grade=('final_quiz_grade', 'mean'), activity_count=('quizid', 'count')).reset_index()
    enrolled_ids = user_stats['userid'].unique()
    users_info = user_df[user_df['userid'].isin(enrolled_ids)][['userid', 'cluster', 'performance_category']]
    merged = pd.merge(users_info, user_stats, on='userid', how='inner')
    result = []
    for _, row in merged.iterrows():
        score_val = fix_grade_value(row['avg_grade']) if pd.notna(row['avg_grade']) else 0
        result.append({"id": int(row["userid"]), "cluster": cluster_labels.get(row["cluster"], "Unknown"), "status": "Berisiko" if score_val < 50 else "Aman", "score": score_val, "activities": int(row['activity_count'])})
    return sorted(result, key=lambda x: x['score'], reverse=True)



# --- FITUR BARU: ADMIN RESET PASSWORD ---
@app.put("/api/admin/reset-password/{target_user_id}")
def admin_reset_password(target_user_id: str, db: Session = Depends(get_db)):
    # Cari user target
    user = db.query(UserDB).filter(UserDB.username == target_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User mahasiswa tidak ditemukan")
    
    # Reset ke default "mhs123"
    user.hashed_password = pwd_context.hash("mhs123")
    db.commit()
    
    return {"message": f"Password mahasiswa {target_user_id} berhasil di-reset ke 'mhs123'"}


