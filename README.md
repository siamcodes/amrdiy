# AMR DIY

## MinIO Course Media

ระบบ Course ใช้ MinIO สำหรับจัดเก็บวิดีโอแนะนำคอร์สและวิดีโอในแต่ละบทเรียน โดย MinIO ทำงานบน VPS ผ่าน PM2 และเก็บข้อมูลไว้ภายในเครื่อง

### MinIO Console

เข้าใช้งาน MinIO Console ผ่าน HTTPS ได้ที่:

```text
https://amrdiy.com/minio-console/
```

Console เปิดให้เข้าถึงจากอินเทอร์เน็ต แต่ยังต้องล็อกอินด้วย Username และ Password ส่วน Bucket วิดีโอไม่ได้เปิดเป็น Anonymous Public เพื่อป้องกันการเข้าถึงเนื้อหาคอร์สโดยข้ามระบบสิทธิ์

### ตรวจสอบ Username และ Password

GitHub CI/CD จะสร้าง MinIO credentials แบบสุ่มในครั้งแรก และเก็บไว้บน VPS ที่:

```text
$VPS_PATH/.minio.env
```

เชื่อมต่อ VPS ผ่าน SSH แล้วใช้คำสั่ง:

```bash
grep -E '^MINIO_(ACCESS_KEY|SECRET_KEY)=' "$VPS_PATH/.minio.env"
```

ผลลัพธ์จะมีรูปแบบดังนี้:

```env
MINIO_ACCESS_KEY=amrdiyxxxxxxxxxxxxxxxx
MINIO_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

ใช้ค่าเหล่านี้เข้าสู่ระบบ:

- Username: ค่าจาก `MINIO_ACCESS_KEY`
- Password: ค่าจาก `MINIO_SECRET_KEY`

หากตัวแปร `VPS_PATH` ไม่มีอยู่ใน SSH session ให้แทนที่ `$VPS_PATH` ด้วย absolute path ที่กำหนดไว้ใน GitHub Environment secret ชื่อ `VPS_PATH`

### ตำแหน่งไฟล์บน VPS

```text
$VPS_PATH/bin/minio       MinIO executable
$VPS_PATH/minio-data      Course video object storage
$VPS_PATH/.minio.env      MinIO administrator credentials
$VPS_PATH/backend/.env    Backend runtime configuration
```

### ตรวจสอบสถานะ MinIO

```bash
export PM2_HOME="$VPS_PATH/.pm2"
cd "$VPS_PATH/backend"
./node_modules/.bin/pm2 status amrdiy-minio
curl --fail http://127.0.0.1:9000/minio/health/live
```

### ข้อควรระวัง

- ห้าม commit ไฟล์ `.minio.env` หรือ credentials ลง GitHub
- ห้ามส่ง Username หรือ Password ผ่านช่องทางสาธารณะ
- ไม่ควรเปิดพอร์ต `9000` หรือ `9001` จาก firewall โดยตรง
- การเข้าถึง Console ควรทำผ่าน HTTPS URL ที่กำหนดไว้เท่านั้น
- ควรสำรอง `$VPS_PATH/minio-data` และ `$VPS_PATH/.minio.env` เป็นประจำ

