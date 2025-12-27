# database.py
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Buat file database SQLite bernama 'edupulse.db'
SQLALCHEMY_DATABASE_URL = "sqlite:///./edupulse.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Definisi Tabel User
class UserDB(Base):
    __tablename__ = "users"

    username = Column(String, primary_key=True, index=True) # Ini User ID (String biar aman)
    hashed_password = Column(String)
    role = Column(String) # 'admin' atau 'student'
    
    # Kita simpan preferensi user di sini biar PERMANEN
    full_name = Column(String, nullable=True)
    learning_style = Column(String, default="Visual") 
    interest = Column(String, default="Computer Science")