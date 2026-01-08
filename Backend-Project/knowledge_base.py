# knowledge_base.py

# Kamus Video (Berdasarkan Data yang Anda Berikan)
VIDEO_DB = {
    # --- LOGIKA MATEMATIKA ---
    "Proposisi": ["U5eWAywK1Mo"],
    "Predikat": ["XY5koUZMV2Q", "sDkqHWixI30"],
    "Pemrograman Logika": ["gxIMC0rBeno"],
    "Matematika SMA": ["4XPmXP2LtX4"],
    "Pembuktian": ["2FI9CaBkrQg", "O53d4eU2YR0"],
    "Induksi": ["eV-r_EnD7ec", "tHNVX3e9zd0", "ptivxK4duyk"],
    "Himpunan": ["iWxbTkL1XUg", "2Jnop1XF9I0"],
    
    # --- MATEMATIKA DISKRIT ---
    "Relasi": ["2EXkd9booXE", "79DUDA-EGH0", "RPA3NYn9syE"],
    "Fungsi": ["EWe3_gkQ1DY", "MXiD6i4G8sg"],
    "Rekurensi": ["Z9s-Q664ORU", "gI4sv5wB_Ck"],
    "Berhitung": ["aHry-lRSEpE", "eRPCRoBiFxA"],
    "Sarang Merpati": ["Y1SyrMEO-HA"],
    "Permutasi": ["OzNqLkWzerw", "YG835TfQPPY"],
    "Kombinasi": ["OzNqLkWzerw"],
    "Graf": ["DkL3EoRgeq4", "p4r7GPAZaLs", "YOKyNy4mjd0", "Xqevm8rGY_A", "5-LN8GdJ2qE"],
    "Pohon": ["_PYAYCQo8mk", "MaQZ4Ws9hBY", "qC8GcUkuX0A"],
    "Teori Bilangan": ["egJvN0asZvI", "CJ7Fr3Zb5UQ", "oBoBwuO2xGs"]
}

def get_curated_videos(topic_name):
    """
    Mencari video spesifik berdasarkan kata kunci di nama topik.
    Mengembalikan list object materi.
    """
    found_videos = []
    topic_lower = topic_name.lower()
    
    for key, video_ids in VIDEO_DB.items():
        # Cek apakah keyword (misal 'Pohon') ada di nama topik user (misal 'Pohon Bagian 2')
        if key.lower() in topic_lower:
            for vid in video_ids[:2]: # Ambil maksimal 2 video per topik biar ga penuh
                found_videos.append({
                    "title": f"Video Spesifik: {key}",
                    "type": "Specific_Video", # Tipe Khusus untuk Frontend Grid
                    "url": f"https://www.youtube.com/watch?v={vid}",
                    "thumbnail": f"https://img.youtube.com/vi/{vid}/0.jpg",
                    "video_id": vid
                })
            # Jika sudah ketemu kategorinya, stop pencarian agar tidak duplikat
            break
            
    return found_videos