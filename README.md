# CodSoft Certificate Verification Portal with MongoDB Atlas

A production-grade certificate verification portal and admin management system backed by **MongoDB Atlas** (`atlas-violet-planet.zegnvrm.mongodb.net/Codsoft`).

---

## 🍃 MongoDB Atlas Configuration

* **Connection String:**
  ```text
  mongodb+srv://Vercel-Admin-atlas-violet-planet:OBBDUvrBjNg94CbF@atlas-violet-planet.zegnvrm.mongodb.net/Codsoft?retryWrites=true&w=majority
  ```
* **Database Name:** `Codsoft`
* **Collection Name:** `certificates`
* **Serverless API Route:** `/api/certificates`
* **Vercel Functions Pool Management:** `@vercel/functions` (`attachDatabasePool`)

### Seeded & Stored Records:
1. `CS/2026/JP/84920` &rarr; Mansi Suryawanshi (Java Programming Internship)
2. `CS/2026/JP/32816` &rarr; Mansi Suryawanshi (Java Programming Internship)
3. `CS/2026/VIP/76548` &rarr; Mansi Suryawanshi (Virtual Internship Program)

Any new certificate saved in the Admin Portal is **automatically written directly to MongoDB Atlas**.

---

## ⚡ Serverless API Endpoints (`api/certificates.js`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/certificates` | Returns all certificate records from MongoDB Atlas |
| `GET` | `/api/certificates?id=32816` | Finds a certificate by ID or short code from MongoDB |
| `POST` | `/api/certificates` | Creates or updates a certificate in MongoDB Atlas |
| `DELETE` | `/api/certificates?id=...` | Deletes a certificate from MongoDB Atlas |

---

## 🔐 Admin Portal (`admin.html`)

Access: `http://127.0.0.1:8080/admin.html` (or `https://<your-vercel-domain>/admin.html`)
* **Default PIN:** `admin123`
* **Live MongoDB Atlas Sync:** When you save, edit, or delete a record, it updates the cloud database in real time.
* **Instant QR Code Generation:** Real-time generation of 1024&times;1024 px print-ready QR codes.
* **One-Click URL Copy:** Provides instant copy buttons for both Direct Path and Query URL formats with visual confirmation (*"Copied! ✓"*).

---

## 🚀 Deploying to Vercel

```powershell
cd c:\Users\sachi\Downloads\QR
git add .
git commit -m "Add MongoDB Atlas backend integration and serverless API"
git push
```

### Vercel Environment Variable (Optional, Recommended):
In your Vercel Project Dashboard &rarr; **Settings** &rarr; **Environment Variables**:
* **Key:** `MONGODB_URI`
* **Value:** `mongodb+srv://Vercel-Admin-atlas-violet-planet:OBBDUvrBjNg94CbF@atlas-violet-planet.zegnvrm.mongodb.net/Codsoft?retryWrites=true&w=majority`
*(The code also includes this URI as a default fallback).*
