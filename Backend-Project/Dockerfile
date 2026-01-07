# Gunakan Python 3.10
FROM python:3.10

# Set folder kerja di dalam server
WORKDIR /code

# Copy requirements dan install library
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy semua file backend ke server
COPY . /code

# Berikan izin tulis (PENTING UNTUK SQLITE & LOGS)
# Agar database bisa dibuat dan diupdate
RUN chmod -R 777 /code

# Jalankan server di Port 7860 (Port wajib Hugging Face)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]