# Auditoria de Recuperacion - InvestigaODS

Fecha: 2026-03-09
Workspace: d:/ONG GREEN DREAMS/investiga_ods/investigaODS

## 1. Objetivo de esta bitacora

Mantener una estructura de seguimiento para no perder avance al reiniciar el proyecto.

## 2. Estado actual

- [x] Docker Compose configurado para DB + phpMyAdmin + backend + frontend + IA.
- [x] Seed de backend alineado con credenciales del frontend.
- [x] Backend en Docker ejecuta schema sync y seed automaticamente al arrancar.
- [x] Levantar contenedores y validar salud de servicios.
- [x] Verificar login con los 4 usuarios de prueba.

## 3. Comandos base (PowerShell, desde investigaODS)

```powershell
# 1) Ir a carpeta del proyecto
Set-Location "d:\ONG GREEN DREAMS\investiga_ods\investigaODS"

# 2) Levantar todo
docker compose up -d --build

# 3) Ver estado
docker compose ps

# 4) Ver logs backend (debe incluir schema sync + seed)
docker compose logs backend --tail 200

# 5) Ver logs frontend
docker compose logs frontend --tail 100

# 6) Ver logs IA
docker compose logs ia --tail 100

# 7) Bajar servicios
docker compose down
```

## 4. URLs esperadas

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/health
- phpMyAdmin: http://localhost:8081
- IA health: http://localhost:5001/api/health

## 5. Credenciales sincronizadas (frontend + backend seed)

- estudiante@test.com / 123456 -> STUDENT PRO
- pro@test.com / 123456 -> STUDENT BASIC
- instructor@test.com / 123456 -> INSTRUCTOR BASIC
- admin@test.com / 123456 -> ADMIN BASIC

## 6. Validacion funcional minima

- [x] `GET /api/health` responde `{"app":"ok","db":"ok"}`.
- [x] Login de `estudiante@test.com` funciona y cae en dashboard BASIC.
- [x] Login de `pro@test.com` funciona y reconoce plan PRO.
- [x] Login de `instructor@test.com` funciona y entra a panel instructor.
- [x] Login de `admin@test.com` funciona y entra a panel admin.

Resultado final: stack levantado con Docker (DB, phpMyAdmin, backend, frontend, IA) y credenciales frontend/backend sincronizadas por seed.

## 7. Checklist de commit (manual)

- [ ] Revisar cambios: `git status`
- [ ] Ver diff: `git diff`
- [ ] Agregar archivos: `git add <archivos>`
- [ ] Commit: `git commit -m "tu mensaje"`
- [ ] Push: `git push`

## 8. Registro de incidencias

Usar este bloque cada vez que algo falle:

```text
Fecha/Hora:
Servicio afectado:
Error observado:
Comando ejecutado:
Accion tomada:
Resultado:
```
