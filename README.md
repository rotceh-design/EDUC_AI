# 🎓 educ_AI

Plataforma educativa SaaS con IA — React 18 + Vite + Firebase + Gemini 2.5 Pro Preview

---

## 🗂️ Estructura del proyecto

```
educ_ai/
├── index.html
├── vite.config.js
├── package.json
├── .env.local              ← NUNCA subir a GitHub
├── .gitignore
├── vercel.json
├── firestore.rules
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── theme.js
    │
    ├── firebase/
    │   └── config.js       ← Firebase init
    │
    ├── contexts/
    │   └── AuthContext.jsx ← Auth state global
    │
    ├── services/
    │   ├── db.js           ← Firestore CRUD
    │   ├── aiService.js    ← Gemini AI
    │   └── analyticsService.js ← Métricas + riesgo
    │
    ├── components/
    │   ├── ui/
    │   │   └── index.jsx   ← Btn, Card, Modal, Input...
    │   ├── Navbar.jsx
    │   ├── ProtectedRoute.jsx
    │   └── RiskBadge.jsx
    │
    └── pages/
        ├── Login.jsx
        ├── PendingRole.jsx
        ├── admin/
        │   ├── AdminDashboard.jsx  ← Gestión: profesores/alumnos/cursos
        │   └── Analytics.jsx      ← Métricas + predicción deserción
        ├── teacher/
        │   ├── TeacherDashboard.jsx ← Lista de cursos
        │   ├── TeacherCourse.jsx   ← Subir clases + ver alumnos en riesgo
        │   └── TeacherAlerts.jsx   ← Alertas de deserción
        └── student/
            ├── StudentHome.jsx     ← Lista de materias
            ├── StudentCourse.jsx   ← Clases del curso
            └── StudyView.jsx       ← Los 5 estilos de aprendizaje
```

---

## 🚀 Setup en Windows

```cmd
cd "C:\Users\ROTCEH DESIGN\Desktop\EDUCAI\educ_ai"
npm install
npm run dev
```

Abre: http://localhost:5173

---

## 🔑 Variables de entorno (.env.local)

```env
VITE_FIREBASE_API_KEY=AIzaSyBh5nfpK6UVyrdkxFEFd1J3SZxLd3j-3hY
VITE_FIREBASE_AUTH_DOMAIN=educai-cc1ac.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=educai-cc1ac
VITE_FIREBASE_STORAGE_BUCKET=educai-cc1ac.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=760825117799
VITE_FIREBASE_APP_ID=1:760825117799:web:bb813af4ba62b30e0028c2
VITE_GEMINI_API_KEY=AIzaSyCFd52drFaMIyd7HeefDy8dgnm42DBbmr0
```

---

## 👤 Crear el primer admin

1. Ir a Firebase Console → Authentication → Add user
   - Email: admin@tuescuela.cl
   - Contraseña: la que quieras

2. Ir a Firestore → Crear documento manualmente:
   - Colección: `users`
   - ID del documento: (el UID del usuario que acabas de crear)
   - Campos:
     ```
     uid:      "el-uid-del-usuario"
     email:    "admin@tuescuela.cl"
     name:     "Administrador"
     role:     "admin"
     schoolId: "mi-escuela"
     ```

3. Ir a Firestore → Crear documento:
   - Colección: `schools`
   - ID: `mi-escuela`
   - Campos:
     ```
     name: "Nombre del Colegio"
     plan: "trial"
     ```

4. Entrar a la app con ese correo y contraseña → tendrás acceso de admin completo.

---

## 📊 Algoritmo de riesgo de deserción

El score va de 0 (máximo riesgo) a 100 (sin riesgo).

| Factor | Penalización máxima |
|---|---|
| Días sin actividad (≥14 días) | -45 pts |
| Promedio quiz bajo (<40%) | -25 pts |
| Solo 1 estilo usado | -8 pts |
| Sin sesiones esta semana | -15 pts |
| Tendencia en declive | -10 pts |
| Pocas clases vistas (<30%) | -10 pts |

**Umbrales:**
- 🔴 0-39 → En riesgo (intervención inmediata)
- 🟡 40-69 → En observación (seguimiento)
- 🟢 70-100 → Bien

---

## 🚢 Deploy en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desde la carpeta del proyecto
vercel

# Agregar variables de entorno en vercel.com → Settings → Env Variables
```

Después del deploy, agregar el dominio de Vercel en:
Firebase Console → Authentication → Authorized Domains

---

## 📝 Colecciones Firestore

| Colección | Uso |
|---|---|
| `users` | Perfiles: uid, email, name, role, schoolId |
| `schools` | Instituciones: name, plan |
| `courses` | Cursos: name, subject, grade, teacherId, schoolId |
| `classes` | Clases: courseId, rawContent, content (JSON 5 estilos) |
| `progress` | Progreso: studentId, classId, styleId, score, totalQ |
| `alerts` | Alertas: schoolId, teacherId, studentId, message |
