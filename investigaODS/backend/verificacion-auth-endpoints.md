# Verificación de Endpoints de Autenticación

**Fecha:** 2 de Abril de 2026  
**Proyecto:** InvestigaODS — Backend (NestJS)  
**Herramienta usada:** Postman  
**Base URL:** `http://localhost:3000/api`

---

## Resumen

Se verificó el correcto funcionamiento de los endpoints de autenticación `/auth/refresh` y `/auth/logout`, así como el flujo completo de autenticación del sistema.

---

## Endpoints Verificados

### 1. `POST /api/auth/login`

Endpoint previo necesario para obtener los tokens de sesión.

**Request:**
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "estudiante@test.com",
  "password": "123456"
}
```

**Response `200 OK`:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "estudiante@test.com",
    "role": "STUDENT"
  }
}
```

**Resultado:** ✅ Correcto  
**Observación:** El servidor devuelve el `accessToken` en el body y guarda el `refreshToken` automáticamente en una cookie `HttpOnly`.

---

### 2. `POST /api/auth/refresh`

Permite obtener un nuevo `accessToken` sin volver a ingresar credenciales.

**Request:**
```http
POST http://localhost:3000/api/auth/refresh
Content-Type: application/json
Cookie: refreshToken=<cookie guardada automáticamente>
```
> No requiere body. El servidor lee la cookie guardada del login.

**Response `200 OK`:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "estudiante@test.com",
    "role": "STUDENT"
  }
}
```

**Resultado:** ✅ Correcto  
**Observación:** El `accessToken` devuelto es diferente al del login — es uno completamente nuevo. El servidor usó el `refreshToken` de la cookie para generarlo sin pedir contraseña.

---

### 3. `POST /api/auth/logout`

Cierra la sesión del usuario eliminando la cookie del `refreshToken`.

**Request:**
```http
POST http://localhost:3000/api/auth/logout
Authorization: Bearer <accessToken>
```
> Requiere el `accessToken` en el header `Authorization` como `Bearer Token`.  
> No requiere body.

**Response `200 OK`:**
```json
{
  "success": true,
  "userId": 1
}
```

**Resultado:** ✅ Correcto  
**Observación:** Tras el logout, la cookie con el `refreshToken` fue eliminada por el servidor.

---

## Prueba de Validación Post-Logout

Luego de ejecutar el logout, se intentó volver a llamar al endpoint `/auth/refresh`:

**Response `401 Unauthorized`:**
```json
{
  "statusCode": 401,
  "message": "Missing refresh token"
}
```

**Resultado:** ✅ Correcto  
**Observación:** El servidor rechaza el refresh porque la cookie ya no existe. Esto confirma que el logout funciona correctamente.

---

## Flujo Completo Verificado

```
LOGIN  →  genera accessToken (15 min) + cookie refreshToken (7 días)  ✅
   │
REFRESH →  lee la cookie, genera un accessToken nuevo                  ✅
   │
LOGOUT  →  elimina la cookie del refreshToken                          ✅
   │
REFRESH →  falla con 401 "Missing refresh token"                       ✅
```

---

## Conclusión

Los endpoints `/auth/refresh` y `/auth/logout` funcionan correctamente. El sistema de autenticación basado en `accessToken` + `refreshToken` (cookie `HttpOnly`) opera según lo esperado:

- El `refreshToken` permite renovar sesiones sin pedir contraseña nuevamente.
- El `logout` invalida la sesión correctamente al eliminar la cookie.
- Un intento de refresh tras el logout es rechazado con `401`.
