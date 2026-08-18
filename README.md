# AMR DIY

ระบบ E-commerce และ Course Learning สำหรับจำหน่ายอุปกรณ์ Electronics/IoT บทความ และคอร์สออนไลน์ พัฒนาด้วย React + Vite, Express, MongoDB, Auth.js, Stripe, Cloudinary และ MinIO

## ความสามารถหลัก

- Catalog สินค้า ตะกร้า Checkout การจัดส่ง คูปอง และประวัติคำสั่งซื้อ
- Stripe, โอนธนาคาร และ QR พร้อมตรวจสอบสลิป
- Login ด้วย Credentials, Google, Facebook, GitHub, LINE, Apple, TikTok และ X/Twitter
- Blog พร้อม Rich Content และสินค้าแนะนำ
- Course ฟรี/เสียเงิน พร้อม Section, Lesson, Video และ Progress
- Admin Dashboard และ CI/CD ไปยัง Debian VPS

## โครงสร้างโปรเจกต์

```text
amrdiy/
├── backend/              Express API, MongoDB models และ services
├── frontend/             React + Vite application
├── .github/workflows/    CI และ production deployment
└── package.json          คำสั่งสำหรับ monorepo
```

## 1. Requirements

- Node.js `24.18.x`
- npm `11.x`
- MongoDB
- Cloudinary, Stripe และ Brevo accounts ตามฟีเจอร์ที่ใช้งาน
- MinIO สำหรับวิดีโอ Course; production workflow ติดตั้งให้อัตโนมัติ

```bash
node --version
npm --version
```

## 2. ติดตั้งโปรเจกต์

```bash
git clone https://github.com/siamcodes/amrdiy.git
cd amrdiy
npm --prefix backend ci
npm --prefix frontend ci
```

Windows PowerShell ที่ไม่อนุญาต `npm.ps1` ให้ใช้ `npm.cmd`:

```powershell
npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci
```

## 3. Backend Environment

```bash
cp backend/.env.example backend/.env
```

PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

ตัวอย่าง `backend/.env`:

```env
PORT=8000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb://127.0.0.1:27017/amrdiy

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

MINIO_ENDPOINT=127.0.0.1
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=your_minio_username
MINIO_SECRET_KEY=your_long_random_password
MINIO_BUCKET=amrdiy-course-media
MINIO_CONSOLE_URL=http://localhost:9001

STRIPE_SECRET=sk_test_replace_me
AUTH_SECRET=replace_with_at_least_32_random_characters
AUTH_URL=http://localhost:8000

BREVO_API_KEY=xkeysib_replace_me
BREVO_SENDER_EMAIL=verified-sender@example.com
BREVO_SENDER_NAME=AMRDIY

AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_FACEBOOK_ID=
AUTH_FACEBOOK_SECRET=
AUTH_FACEBOOK_CONFIG_ID=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_LINE_ID=
AUTH_LINE_SECRET=
AUTH_APPLE_ID=
AUTH_APPLE_SECRET=
AUTH_TIKTOK_ID=
AUTH_TIKTOK_SECRET=
AUTH_TWITTER_ID=
AUTH_TWITTER_SECRET=
```

ข้อควรทราบ:

- `CLIENT_URL` ต้องตรงกับ URL ของ Frontend
- OAuth provider ที่ไม่ใช้สามารถปล่อย ID/Secret ว่าง
- `AUTH_SECRET` ควรเป็นค่าสุ่มอย่างน้อย 32 ตัวอักษร
- ห้าม commit `backend/.env`

สร้าง secret ตัวอย่าง:

```bash
openssl rand -hex 32
```

## 4. Frontend Environment

```bash
cp frontend/.env.example frontend/.env
```

```env
VITE_API=http://localhost:8000/api
VITE_STRIPE_KEY=pk_test_replace_me
VITE_BANK_ACCOUNT=ธนาคารตัวอย่าง 000-0-00000-0 บริษัท เอเอ็มอาร์ดีไอวาย จำกัด
VITE_PAYMENT_QR_IMAGE=https://example.com/payment-qr.png
```

- `VITE_API` ต้องลงท้ายด้วย `/api`
- `VITE_STRIPE_KEY` ต้องเป็น Publishable key เท่านั้น
- ค่า `VITE_*` ถูกฝังใน Frontend และผู้ใช้มองเห็นได้ ห้ามใส่ Secret

## 5. MongoDB

Local MongoDB:

```env
MONGO_URI=mongodb://127.0.0.1:27017/amrdiy
```

หากใช้ Atlas ให้สร้าง Database user, อนุญาต IP ของเครื่อง/VPS และใช้ connection string จาก Atlas ตรวจสุขภาพหลัง Backend ทำงานที่:

```text
http://localhost:8000/api/health
```

## 6. Cloudinary

Cloudinary ใช้เก็บรูปสินค้า, Profile, Blog, Payment slip, Course cover และรูปใน Rich Content นำ Cloud name, API key และ API secret จาก Cloudinary Dashboard มาใส่ Backend environment

รูปปก Course ถูกเก็บใน `amrdiy/course-cover` และ URL, `public_id`, width/height ถูกบันทึกใน MongoDB ระบบลบรูปเก่าเมื่อเปลี่ยนหรือลบ Course

## 7. MinIO สำหรับ Development

```bash
export MINIO_ROOT_USER=your_minio_username
export MINIO_ROOT_PASSWORD=your_long_random_password
minio server ./minio-data --address 127.0.0.1:9000 --console-address 127.0.0.1:9001
```

Console: `http://localhost:9001`

Backend สร้าง bucket `amrdiy-course-media` เมื่ออัปโหลดครั้งแรก วิดีโอรองรับ MP4, WebM, MOV และ M4V สูงสุด 2GB

## 8. Stripe

- Backend ใช้ `STRIPE_SECRET`
- Frontend ใช้ `VITE_STRIPE_KEY`
- Development ควรใช้ Test mode keys
- Backend ตรวจ Payment Intent, ราคา, currency และ user ก่อนสร้าง Enrollment

ห้ามใส่ `sk_*` ใน Frontend หรือ source code

## 9. OAuth Login

สร้าง OAuth application ของ provider แล้วกำหนด Client ID/Secret ใน Backend environment โดย callback URL ต้องตรงกับ Auth.js endpoint ของ environment

Facebook Login for Business ใช้ `AUTH_FACEBOOK_CONFIG_ID`; หากใช้ Facebook Login ปกติให้ปล่อยว่าง

LINE ใช้ Channel ID และ Channel secret:

```env
AUTH_LINE_ID=your_line_channel_id
AUTH_LINE_SECRET=your_line_channel_secret
```

## 10. รัน Development

Terminal แรก:

```bash
npm run dev:backend
```

Terminal ที่สอง:

```bash
npm run dev:frontend
```

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8000
Health:   http://localhost:8000/api/health
```

## 11. ตรวจสอบก่อน Commit

```bash
npm run test:frontend
npm run check:backend
npm run build
```

หรือ:

```bash
npm run ci
```

## 12. Course Workflow

Admin เข้าเมนู `คอร์สเรียน` แล้ว:

1. กรอกชื่อ, Slug, คำโปรย, รายละเอียด, ราคา และระดับ
2. เลือกหมวดเดิม หรือพิมพ์หมวดใหม่แล้วกด Enter
3. อัปโหลดรูปปกไป Cloudinary
4. อัปโหลดวิดีโอแนะนำไป MinIO
5. เพิ่ม Section และบทเรียน
6. เพิ่มชื่อ, ระยะเวลา, Preview, Video และ Rich Content ในแต่ละบท
7. เปลี่ยนสถานะเป็นเผยแพร่

วิดีโอใช้ HTTP Range สำหรับ seek และตรวจ Enrollment ก่อน stream บทเรียนที่ไม่ใช่ Preview

## 13. GitHub Environment: production

ไปที่:

```text
Repository → Settings → Environments → New environment → production
```

Environment Secrets:

| Secret | รายละเอียด |
|---|---|
| `VPS_HOST` | IP/hostname ของ VPS |
| `VPS_PORT` | SSH port เช่น `22` |
| `VPS_USER` | SSH deploy user |
| `VPS_PATH` | Absolute path เช่น `/var/www/amrdiy` |
| `VPS_SSH_KEY` | Private SSH key |
| `VPS_KNOWN_HOSTS` | ผลลัพธ์จาก `ssh-keyscan` |
| `BACKEND_ENV` | Production Backend environment แบบหลายบรรทัด |
| `FRONTEND_ENV` | Production Frontend environment แบบหลายบรรทัด |
| `AUTH_LINE_ID` | LINE Channel ID |
| `AUTH_LINE_SECRET` | LINE Channel secret |

Environment Variables:

| Variable | รายละเอียด |
|---|---|
| `BACKEND_PORT` | ค่าเริ่มต้น `8000` |
| `AUTH_FACEBOOK_CONFIG_ID` | Facebook Business configuration ID |

ตัวอย่าง `BACKEND_ENV`:

```env
PORT=8000
NODE_ENV=production
CLIENT_URL=https://amrdiy.com
MONGO_URI=mongodb://127.0.0.1:27017/amrdiy
AUTH_URL=https://amrdiy.com
AUTH_SECRET=replace_with_a_long_random_value
CLOUDINARY_CLOUD_NAME=replace_me
CLOUDINARY_API_KEY=replace_me
CLOUDINARY_API_SECRET=replace_me
STRIPE_SECRET=sk_live_replace_me
BREVO_API_KEY=replace_me
BREVO_SENDER_EMAIL=verified@example.com
BREVO_SENDER_NAME=AMRDIY
```

MinIO variables ใส่เองใน `BACKEND_ENV` ได้ หรือปล่อยให้ deployment สร้างค่า default และ random credentials บน VPS

ตัวอย่าง `FRONTEND_ENV`:

```env
VITE_API=https://amrdiy.com/api
VITE_STRIPE_KEY=pk_live_replace_me
VITE_BANK_ACCOUNT=รายละเอียดบัญชีรับชำระ
VITE_PAYMENT_QR_IMAGE=https://example.com/production-qr.png
```

## 14. เตรียม Debian VPS

VPS ต้องมี SSH, deploy user, Nginx, MongoDB หรือ external connection, `curl`, `rsync`, `sudo`, `openssl` และ Passwordless sudo ตาม workflow รวมถึง Domain/HTTPS certificate สำหรับ `amrdiy.com`

Workflow จัดการ Node.js `24.18.0`, npm dependencies, MinIO binary และ PM2 processes โดยคาดว่า Nginx site อยู่ที่:

```text
/etc/nginx/sites-enabled/amrdiy.com
```

## 15. CI/CD Flow

เมื่อ push เข้า `main`:

1. `AMR DIY CI` ติดตั้ง dependencies
2. รัน Frontend tests/build
3. ตรวจ syntax Backend ทุกไฟล์
4. เมื่อผ่าน ระบบ Deploy จะ rsync Backend/Frontend ไป VPS
5. สร้าง runtime environment
6. ติดตั้ง/เริ่ม MinIO และ Backend ด้วย PM2
7. ปรับ Nginx และตรวจ Frontend, Backend, MinIO และ Console

## 16. MinIO Production

Console:

```text
https://amrdiy.com/minio-console/
```

Console เปิดผ่าน HTTPS แต่ต้องล็อกอิน Bucket วิดีโอเป็น private เพื่อป้องกันการข้ามสิทธิ์ Course

Credentials ถูกสร้างครั้งแรกและเก็บที่:

```text
$VPS_PATH/.minio.env
```

ตรวจ Username/Password หลัง SSH เข้า VPS:

```bash
grep -E '^MINIO_(ACCESS_KEY|SECRET_KEY)=' "$VPS_PATH/.minio.env"
```

- Username: `MINIO_ACCESS_KEY`
- Password: `MINIO_SECRET_KEY`

ตำแหน่งสำคัญ:

```text
$VPS_PATH/bin/minio       MinIO executable
$VPS_PATH/minio-data      Course video storage
$VPS_PATH/.minio.env      Administrator credentials
$VPS_PATH/backend/.env    Backend runtime environment
```

ตรวจสถานะ:

```bash
export PM2_HOME="$VPS_PATH/.pm2"
cd "$VPS_PATH/backend"
./node_modules/.bin/pm2 status
curl --fail http://127.0.0.1:9000/minio/health/live
curl --fail http://127.0.0.1:8000/api/health
```

## 17. Backup

สำรองเป็นประจำ:

- MongoDB database
- `$VPS_PATH/minio-data`
- `$VPS_PATH/.minio.env`
- Production secrets
- Cloudinary assets ตาม retention policy

ควรสำรอง `.minio.env` พร้อม `minio-data`

## 18. Troubleshooting

### Push ถูกปฏิเสธ

```bash
git pull --rebase origin main
git push origin main
```

### DNS หา GitHub/npm ไม่พบ

```text
Could not resolve host: github.com
getaddrinfo ENOTFOUND registry.npmjs.org
```

ตรวจ DNS/network แล้วลองใหม่ Local commit จะไม่สูญหาย

### Node.js ไม่พบตอน Deploy

Workflow โหลด NVM และติดตั้ง Node.js `24.18.0`; หาก VPS ไม่มี NVM ให้ติดตั้ง Node/npm แบบ system-wide หรือเตรียม NVM ให้ deploy user

### MinIO Console เข้าไม่ได้

```bash
export PM2_HOME="$VPS_PATH/.pm2"
cd "$VPS_PATH/backend"
./node_modules/.bin/pm2 logs amrdiy-minio --lines 100
curl -I http://127.0.0.1:9001
sudo nginx -t
```

### อัปโหลดวิดีโอไม่ได้

- ตรวจไฟล์ไม่เกิน 2GB และชนิดไฟล์รองรับ
- ตรวจพื้นที่ว่าง VPS และ `amrdiy-minio` ใน PM2
- ตรวจ Nginx `client_max_body_size 2048m`
- ตรวจ MinIO credentials ใน Backend `.env`

### MongoDB port ไม่ตรง

ค่าเริ่มต้นคือ `27017` ตรวจ `MONGO_URI` และ service ที่ listen ก่อน deploy

## Security Checklist

- ห้าม commit `.env`, `.minio.env`, SSH private key หรือ API secrets
- ใช้ HTTPS ใน production
- ไม่เปิด MinIO `9000`/`9001` ตรงจาก firewall
- ไม่ตั้ง Course bucket เป็น anonymous public
- ใช้ Stripe Secret เฉพาะ Backend
- เปลี่ยน credentials เมื่อสงสัยว่ารั่วไหล
- จำกัดสิทธิ์ SSH deploy user และสำรองข้อมูลสม่ำเสมอ

