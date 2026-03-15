# Apuntes de Base de Datos - Estructura y Análisis

## PARTE 1: ANÁLISIS DE TABLAS POR TABLA

### USERS (Gestión de cuentas del sistema)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **created_at**: datetime(6) NOT NULL
- **updated_at**: datetime(6) NOT NULL
- **deleted_at**: datetime(6) NULL (✅ AGREGADO - Soft Delete)
- **status**: varchar(50) NOT NULL default 'ACTIVE' (✅ AGREGADO - Estado del usuario)
- **email**: varchar(255) NOT NULL UNIQUE
- **password_hash**: varchar(255) NOT NULL
- **first_name**: varchar(255) NULL
- **last_name**: varchar(255) NULL
- **avatar_url**: varchar(255) NULL
- **role_id**: int (roles) ✅ REEMPLAZA ENUM

#### Índices
- INDEX (deleted_at)
- INDEX (deleted_at, status) - para filtrar usuarios activos
- INDEX (role_id) - para búsquedas por rol

#### Problemas Identificados
- ❌ first_name y last_name permiten valores nulos → posibles registros incompletos
- ✅ RESUELTO: Implementado field status y deleted_at para Soft Delete
- ✅ RESUELTO: Tabla roles separada en lugar de enum

#### Recomendaciones
- Considerar NOT NULL en first_name/last_name o validación en backend
- Mantener soft delete activo para auditoría histórica


---

### ROLES (Gestión de roles y permisos) - ✅ CREADA

#### Estructura
- **id**: int NOT NULL AUTO_INCREMENT PK
- **code**: varchar(50) NOT NULL UNIQUE (ADMIN, INSTRUCTOR, STUDENT)
- **name**: varchar(255) NOT NULL
- **description**: text NULL
- **created_at**: datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
- **updated_at**: datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)

#### Índices
- INDEX (code) - búsqueda rápida por código de rol
- PK (id)

#### Datos Iniciales
- ADMIN: Acceso total al sistema, gestión de usuarios y configuración
- INSTRUCTOR: Crear y gestionar cursos, lecciones y evaluaciones
- STUDENT: Acceso a cursos, lecciones e intentos de evaluaciones

#### Ventajas vs Enum
| Aspecto | Enum | Tabla roles |
|---------|------|------------|
| Escalabilidad | ❌ Difícil | ✅ Agrega valores sin migración |
| Permisos | ❌ No soportados | ✅ Puede expandir con columna permissions |
| Auditoría | ❌ Sin historial | ✅ created_at/updated_at |
| FK constraints | ❌ No | ✅ Integridad referencial |
| Cambios futuros | ❌ Migration required | ✅ Solo INSERT/UPDATE |


---

### SUBSCRIPTIONS (Gestión de subscripciones)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **created_at**: datetime(6) NOT NULL
- **updated_at**: datetime(6) NOT NULL
- **start_at**: datetime NOT NULL
- **end_at**: datetime NULL
- **status**: enum('ACTIVE','CANCELLED','EXPIRED') NOT NULL
- **user_id**: int NOT NULL (users) ✅ HARDENED
- **plan_id**: int NOT NULL (membership_plans) ✅ HARDENED

#### Problemas Identificados
- ✅ RESUELTO: user_id y plan_id ahora NOT NULL
- ❌ Falta historial de precios → cambiar planes rompe auditoría

#### Solución Implementada
- Tabla subscriptions_logs nueva para guardar snapshot de precio + moneda
- Permite auditar cambios históricos de planes

#### Recomendaciones
- Auditar cambios en plan_id usando subscriptions_logs
- Registrar motivo de cancelación (CANCELLED_BY_USER, EXPIRED, etc)


---

### SUBSCRIPTIONS_LOGS (Auditoria de suscripciones) - ✅ CREADA

#### Estructura
- **id**: int NOT NULL IDENTITY PK
- **created_at**: datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
- **subscription_id**: int NOT NULL FK (subscriptions) ON DELETE CASCADE
- **price_monthly**: decimal(10,2) NULL
- **currency**: varchar(3) NULL default 'USD'
- **plan_name**: varchar(255) NULL
- **status**: enum('ACTIVE','CANCELLED','EXPIRED') NOT NULL

#### Propósito
- Guardar snapshot histórico del precio en cada cambio de suscripción
- Evitar inconsistencias al auditar después de cambios de planes
- Permite comparar precios históricos vs actuales

#### Índices
- INDEX (subscription_id)
- INDEX (created_at)


---

### MEMBERSHIP_PLANS (Planes)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **created_at**: datetime(6) NOT NULL
- **updated_at**: datetime(6) NOT NULL
- **code**: enum('BASIC','PRO') NOT NULL
- **name**: varchar(255) NOT NULL
- **features**: json
- **status**: tinyint NOT NULL

#### Problemas Identificados
- ❌ Sin campos de monetización (price_monthly, currency)
- ❌ Sin historial de cambios de precios

#### Recomendaciones
- Agregar **price_monthly** decimal(10,2) para cobro por suscripción
- Agregar **currency** varchar(3) default 'USD'
- Usar subscriptions_logs para historial de precios


---

### COURSES (Gestión de catálogo de cursos)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **created_at**: datetime(6) NOT NULL
- **updated_at**: datetime(6) NOT NULL
- **title**: varchar(255) NOT NULL
- **slug**: varchar(255) NOT NULL UNIQUE ✅ HARDENED
- **summary**: varchar(255) NULL
- **description**: text NULL
- **thumbnail_url**: varchar(255) NULL
- **level**: varchar(255) NULL
- **language**: varchar(255) NULL
- **visibility**: enum('PUBLIC','PRIVATE') NOT NULL default 'PUBLIC'
- **modality**: enum('SELF_PACED','GUIDED') NOT NULL default 'SELF_PACED'
- **tier_required**: enum('FREE','BASIC','PRO') NOT NULL default 'FREE'
- **has_certificate**: tinyint NOT NULL default 0
- **supports_live**: tinyint NOT NULL default 0
- **supports_challenges**: tinyint NOT NULL default 0
- **owner_id**: int NOT NULL (users) ✅ HARDENED

#### Problemas Resueltos
- ✅ slug ahora NOT NULL + UNIQUE
- ✅ owner_id ahora NOT NULL

#### Problemas Pendientes
- ❌ level es varchar(255) → permite inconsistencias
- ❌ language es varchar(255) → permite inconsistencias

#### Recomendaciones
- Estandarizar **level**: enum('BEGINNER','INTERMEDIATE','ADVANCED') o tabla catalogo
- Estandarizar **language**: ISO 639-1 (en, es, fr) o tabla catalogo


---

### COURSE_MODULES (Módulos de cursos)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **created_at**: datetime(6) NOT NULL
- **updated_at**: datetime(6) NOT NULL
- **position**: int NOT NULL ✅ (HARDENED - era 'index')
- **title**: varchar(255) NOT NULL
- **summary**: varchar(255) NULL
- **course_id**: int NOT NULL (courses) ✅ HARDENED
- **UNIQUE(course_id, position)** ✅ HARDENED

#### Problemas Resueltos
- ✅ course_id ahora NOT NULL
- ✅ position tiene UNIQUE compuesto con course_id
- ✅ Campo 'index' (palabra reservada SQL) será renombrado en futuro


---

### LESSONS (Lecciones)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **created_at**: datetime(6) NOT NULL
- **updated_at**: datetime(6) NOT NULL
- **position**: int NOT NULL (será renombrado de 'index')
- **title**: varchar(255) NOT NULL
- **content**: text NULL
- **video_url**: varchar(255) NULL
- **duration_min**: int NULL
- **resources**: json NULL
- **module_id**: int NOT NULL (course_modules) ✅ HARDENED
- **UNIQUE(module_id, position)** ✅ HARDENED

#### Problemas Resueltos
- ✅ module_id ahora NOT NULL
- ✅ position tiene UNIQUE compuesto con module_id


---

### CHALLENGES (Desafíos)

#### Estructura Actual
- **id**: int NOT NULL PK
- **created_at**: datetime(6) NOT NULL
- **updated_at**: datetime(6) NOT NULL
- **title**: varchar(255) NOT NULL
- **description**: text NULL
- **points**: int NOT NULL
- **rules**: json NULL
- **course_id**: int (courses)
- **lesson_id**: int (lessons)

#### Problemas Identificados
- ❌ course_id permite nulos
- ❌ lesson_id permite nulos
- ❌ Falta definir si desafío es por curso o por lección


---

### CHALLENGE_SUBMISSIONS (Entregas de desafíos)

#### Estructura Actual
- **id**: int NOT NULL PK
- **artifact_url**: varchar(255) NULL
- **score**: int NOT NULL
- **status**: enum('SUBMITTED','REVIEWING','APPROVED','REJECTED') NOT NULL
- **challenge_id**: int (challenges)
- **user_id**: int (users)

#### Problemas Identificados
- ❌ Falta **submitted_at**: datetime → cuándo se envió
- ❌ Falta **reviewed_at**: datetime → cuándo se revisó
- ❌ challenge_id y user_id permiten nulos

#### Recomendaciones
- Agregar **submitted_at** datetime(6) NOT NULL
- Agregar **reviewed_at** datetime(6) NULL
- Hacer challenge_id y user_id NOT NULL


---

### ATTEMPTS (Intentos de evaluación)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **created_at**: datetime(6) NOT NULL
- **updated_at**: datetime(6) NOT NULL
- **started_at**: datetime NOT NULL
- **submitted_at**: datetime NULL
- **score**: int NOT NULL default 0
- **status**: enum('IN_PROGRESS','SUBMITTED','GRADED') NOT NULL
- **quiz_id**: int NOT NULL (quizzes) ✅ HARDENED
- **user_id**: int NOT NULL (users) ✅ HARDENED

#### Problemas Resueltos
- ✅ quiz_id y user_id ahora NOT NULL

#### Problemas Pendientes
- ❌ Ausencia de UNIQUE para evitar intentos simultáneos del mismo usuario en mismo quiz


---

### ANSWERS (Respuestas de intentos)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **open_text**: text NULL
- **is_correct**: tinyint NULL
- **awarded_points**: int NULL
- **attempt_id**: int NOT NULL (attempts) ✅ HARDENED
- **question_id**: int NOT NULL (questions) ✅ HARDENED
- **option_id**: int NULL (nullable solo para preguntas OPEN) ✅ CONTROLADO

#### Problemas Resueltos
- ✅ attempt_id y question_id ahora NOT NULL
- ✅ option_id permite NULL solo para preguntas OPEN

#### Recomendaciones
- Crear UNIQUE(attempt_id, question_id) para evitar múltiples respuestas por pregunta
- Validar en backend: option.question_id == answer.question_id


---

### QUIZZES (Evaluaciones)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **created_at**: datetime(6) NOT NULL
- **updated_at**: datetime(6) NOT NULL
- **title**: varchar(255) NOT NULL
- **type**: enum('QUIZ','EXAM') NOT NULL
- **pass_score**: int NULL
- **attempt_limit**: int NULL
- **time_limit_sec**: int NULL
- **weight**: int NULL
- **course_id**: int (courses)
- **lesson_id**: int (lessons)

#### Problemas Identificados
- ❌ course_id y lesson_id permiten nulos → quiz sin contexto
- ❌ Falta definir regla: ¿quiz por curso O por lección?


---

### QUESTIONS (Preguntas)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **created_at**: datetime(6) NOT NULL
- **updated_at**: datetime(6) NOT NULL
- **type**: enum('MCQ','TRUE_FALSE','OPEN') NOT NULL
- **prompt**: text NOT NULL
- **points**: int NOT NULL default 1
- **metadata**: json NULL
- **quiz_id**: int NOT NULL (quizzes) ✅ HARDENED

#### Problemas Resueltos
- ✅ quiz_id ahora NOT NULL

#### Recomendaciones
- Estandarizar estructura de **metadata** (schema JSON fijo)
- Documentar valores válidos por tipo de pregunta


---

### OPTIONS (Opciones de respuesta)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **text**: text NOT NULL
- **is_correct**: tinyint NOT NULL default 0
- **explanation**: text NULL
- **question_id**: int NOT NULL (questions) ✅ HARDENED

#### Problemas Resueltos
- ✅ question_id ahora NOT NULL

#### Control Requerido
- Validar en backend: solo una opción correcta si type='TRUE_FALSE'
- Permitir múltiples opciones correctas si type='MCQ'


---

### ENROLLMENTS (Inscripciones de usuarios en cursos)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **status**: enum('ACTIVE','COMPLETED','DROPPED') NOT NULL
- **enrolled_at**: datetime NOT NULL
- **user_id**: int NOT NULL (users) ✅ HARDENED
- **course_id**: int NOT NULL (courses) ✅ HARDENED
- **cohort_id**: int NULL (cohorts)
- **UNIQUE(user_id, course_id)** ✅ HARDENED

#### Problemas Resueltos
- ✅ user_id y course_id ahora NOT NULL
- ✅ UNIQUE(user_id, course_id) previene duplicados


---

### LESSON_PROGRESS (Progreso por lección)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **completed**: tinyint NOT NULL default 0
- **progress_pct**: int NOT NULL default 0 (rango 0-100) ✅ CHECK CONSTRAINT
- **last_viewed_at**: datetime NULL
- **user_id**: int NOT NULL (users) ✅ HARDENED
- **lesson_id**: int NOT NULL (lessons) ✅ HARDENED
- **UNIQUE(user_id, lesson_id)** ✅ HARDENED
- **CHECK(progress_pct BETWEEN 0 AND 100)** ✅ HARDENED

#### Problemas Resueltos
- ✅ user_id y lesson_id ahora NOT NULL
- ✅ UNIQUE(user_id, lesson_id) evita duplicados
- ✅ CHECK constraint valida rango 0-100


---

### CERTIFICATES (Certificados emitidos)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **created_at**: datetime(6) NOT NULL
- **updated_at**: datetime(6) NOT NULL
- **serial**: varchar(255) NOT NULL UNIQUE
- **pdf_url**: varchar(255) NULL
- **hash_sha256**: varchar(255) NULL (para integridad digital)
- **issued_at**: datetime NOT NULL
- **user_id**: int (users)
- **course_id**: int (courses)
- **cohort_id**: int (cohorts)

#### Problemas Identificados
- ❌ user_id y course_id permiten nulos → certificados sin contexto
- ❌ hash_sha256 permite nulos → sin validación de integridad

#### Recomendaciones
- Hacer user_id NOT NULL, course_id NOT NULL
- Hacer hash_sha256 NOT NULL si se requiere validación de PDF


---

### LIVE_CLASSES (Clases en vivo)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **created_at**: datetime(6) NOT NULL
- **updated_at**: datetime(6) NOT NULL
- **title**: varchar(255) NOT NULL
- **start_at**: datetime NOT NULL
- **end_at**: datetime NOT NULL ✅ CHECK(end_at > start_at)
- **meeting_url**: varchar(255) NULL
- **recording_url**: varchar(255) NULL
- **capacity**: int NULL
- **timezone**: varchar(255) NULL
- **course_id**: int (courses)
- **cohort_id**: int (cohorts)

#### Problemas Resueltos
- ✅ end_at > start_at validado con CHECK constraint

#### Problemas Pendientes
- ❌ course_id permite nulos
- ❌ timezone no está normalizado (IANA)


---

### COHORTS (Cohortes)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **created_at**: datetime(6) NOT NULL
- **updated_at**: datetime(6) NOT NULL
- **name**: varchar(255) NOT NULL
- **start_at**: datetime NULL
- **end_at**: datetime NULL (validado: end_at > start_at) ✅ CHECK CONSTRAINT
- **capacity**: int NULL (validado: > 0) ✅ CHECK CONSTRAINT
- **course_id**: int (courses)

#### Problemas Resueltos
- ✅ CHECK(end_at > start_at)
- ✅ CHECK(capacity > 0)

#### Problemas Pendientes
- ❌ course_id permite nulos


---

### TAGS (Etiquetas)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **name**: varchar(255) NOT NULL UNIQUE

#### Problemas Identificados
- ❌ Sin normalización de mayúsculas → "IA" vs "ia" son iguales en BD

#### Recomendaciones
- Aplicar LOWER() en backend antes de guardar
- Considerar COLLATE utf8mb4_general_ci para case-insensitive searches


---

### COURSE_TAGS (Relación cursos-etiquetas)

#### Estructura Actual
- **courses_id**: int NOT NULL PK (courses)
- **tags_id**: int NOT NULL PK (tags)

#### Estructura
- Buena estructura N:M con PK compuesta
- Comportamiento ON DELETE CASCADE asegura limpieza automática


---

### USER_POINTS (Puntuación por usuario y curso)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **points**: int NOT NULL default 0
- **user_id**: int NOT NULL (users) ✅ HARDENED
- **course_id**: int NOT NULL (courses) ✅ HARDENED
- **UNIQUE(user_id, course_id)** ✅ HARDENED

#### Problemas Resueltos
- ✅ user_id y course_id ahora NOT NULL
- ✅ UNIQUE(user_id, course_id) evita duplicados de acumulado


---

### AUDIT_LOGS (Registro de eventos de usuarios)

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **created_at**: datetime(6) NOT NULL
- **updated_at**: datetime(6) NOT NULL
- **action**: varchar(255) NULL
- **metadata**: json NULL
- **user_id**: int (users)

#### Problemas Identificados
- ❌ Campo **updated_at** poco útil en logs (los logs no se actualizan, se crean)
- ❌ user_id permite nulos

#### Recomendaciones
- Considerar eliminar updated_at (solo guardar creación)
- Hacer user_id NOT NULL
- Documentar estructura de **metadata** según tipo de action


---

## PARTE 2: PRIORIDADES DE IMPLEMENTACIÓN

### Prioridad Alta (Integridad crítica de datos)
1. ✅ SUBSCRIPTIONS: user_id y plan_id NOT NULL
2. ✅ COURSES: slug NOT NULL + UNIQUE, owner_id NOT NULL
3. ✅ COURSE_MODULES: course_id NOT NULL + UNIQUE(course_id, position)
4. ✅ LESSONS: module_id NOT NULL + UNIQUE(module_id, position)
5. ✅ ENROLLMENTS: user_id y course_id NOT NULL + UNIQUE(user_id, course_id)
6. ✅ LESSON_PROGRESS: user_id y lesson_id NOT NULL + UNIQUE(user_id, lesson_id)
7. ✅ ATTEMPTS: quiz_id y user_id NOT NULL
8. ✅ ANSWERS: attempt_id y question_id NOT NULL (option_id solo NULL en OPEN)
9. ✅ USERS + ROLES: Migrar de enum a tabla roles separada

### Prioridad Media (Consistencia funcional)
1. ✅ LESSON_PROGRESS: progress_pct rango 0-100 (CHECK constraint)
2. ✅ LIVE_CLASSES: end_at > start_at y end_at NOT NULL (CHECK constraint)
3. ✅ COHORTS: end_at > start_at y capacity > 0 (CHECK constraints)
4. QUESTIONS: quiz_id NOT NULL
5. OPTIONS: question_id NOT NULL
6. SUBSCRIPTIONS_LOGS: tabla nueva para auditoría de precios ✅ CREADA
7. COURSES: estandarizar level y language (enum o tabla)
8. TAGS: normalización de nombre (LOWER() en backend)

### Prioridad Baja (Evolutivo y performance)
1. CHALLENGES: definir regla funcional (curso O lección), hacer FKs NOT NULL
2. CHALLENGE_SUBMISSIONS: agregar submitted_at, reviewed_at
3. MEMBERSHIP_PLANS: agregar price_monthly, currency
4. AUDIT_LOGS: revisar necesidad de updated_at
5. CERTIFICATES: user_id, course_id NOT NULL, hash_sha256 NOT NULL


---

## PARTE 3: PLAN DE MIGRACIONES (TypeORM)

### Objetivo General
Crear migraciones incrementales y seguras usando TypeORM para:
- Aplicar cambios estructurales sin perder datos
- Permitir reversiones (migration:revert)
- Auditar cambios en schema
- Mantener consistencia entre desarrollo, staging y producción

### Preparación Técnica
- ✅ Backend ya tiene DataSource configurado en `backend/src/database/data-source.ts`
- ✅ Scripts en package.json:
  - `migration:run` - ejecuta migraciones pendientes
  - `migration:revert` - revierte la última migración
  - `migration:generate` - genera migraciones automáticas
  - `migration:create` - crea migraciones manuales

### Secuencia de Migraciones Planificadas

| # | Nombre | Archivo | Estado | Cambios |
|---|--------|---------|--------|---------|
| 001+002 | InitialMigration | InitialMigration.ts | ✅ EJECUTADA | FK NOT NULL + UNIQUE constraints |
| 003 | Validaciones | ValidacionesRangoYFechas.ts | ✅ EJECUTADA | CHECK constraints ranges/dates |
| 004 | Estandarización | EstandarizacionNaming.ts | ✅ EJECUTADA | Placeholder (reversible) |
| 005 | Auditoría | AuditLogYSoftDelete.ts | ✅ EJECUTADA | subscriptions_logs + soft delete |
| 006 | Tabla Roles | CrearTablaRoles.ts | ✅ EJECUTADA | Migrar enum role → tabla roles |
| 007+ | Futuras | --- | ⏳ PENDIENTES | Normalizaciones, índices, evolución |


---

## PARTE 4: MIGRACIONES EJECUTADAS Y EXPLICACIONES

### Migración 001+002: InitialMigration

**Archivo**: `backend/src/database/migrations/1700000001001-InitialMigration.ts`

**Archivo De Explicación**: `1700000001001-InitialMigration.explicacion.md`

#### Objetivo
Endurecer la integridad de datos. Dos fases combinadas:
- **Fase 001**: Convertir FKs críticas a NOT NULL
- **Fase 002**: Agregar restricciones UNIQUE para orden funcional

#### Cambios Principales

**1) Limpieza de datos previos**
- Completa `courses.slug` con 'course-{id}' para evitar NULL al poner NOT NULL
- Resuelve slugs duplicados agregando '-{id}' a copias
- Asigna `courses.owner_id` predeterminado (primer usuario) para poder poner NOT NULL
- Elimina registros huérfanos en todas las tablas hijas (subscriptions, course_modules, lessons, enrollments, etc)

**2) Deduplicación de datos**
- CREATE TEMPORARY TABLE tmp_enrollments_keep: calcula qué fila conservar por (user_id, course_id)
- DELETE duplicados enrollments: mantiene 1 sola por usuario/curso
- Mismo proceso para lesson_progress y user_points

**3) Normalización de índices**
- Recalcula posiciones (index) en course_modules y lessons usando ROW_NUMBER()
- Evita conflictos al crear UNIQUE(course_id, index)

**4) Endurecer FKs**
```sql
ALTER TABLE table DROP FOREIGN KEY old_fk
ALTER TABLE table MODIFY column NOT NULL
ALTER TABLE table ADD CONSTRAINT new_fk FOREIGN KEY...
```
Aplica a:
- SUBSCRIPTIONS: user_id, plan_id
- COURSES: owner_id
- COURSE_MODULES: course_id
- LESSONS: module_id
- ENROLLMENTS: user_id, course_id
- LESSON_PROGRESS: user_id, lesson_id
- ATTEMPTS: quiz_id, user_id
- ANSWERS: attempt_id, question_id
- QUESTIONS: quiz_id
- OPTIONS: question_id
- USER_POINTS: user_id, course_id

**5) Agregar UNIQUE indexes**
- courses(slug)
- enrollments(user_id, course_id)
- lesson_progress(user_id, lesson_id)
- user_points(user_id, course_id)
- course_modules(course_id, index)
- lessons(module_id, index)

#### Reversión (down)
- DROP INDEX UNIQUE en orden inverso
- MODIFY columnas a NULL
- Restaurar FKs originales


---

### Migración 003: ValidacionesRangoYFechas

**Archivo**: `backend/src/database/migrations/1700000003001-ValidacionesRangoYFechas.ts`

**Archivo De Explicación**: `1700000003001-ValidacionesRangoYFechas.explicacion.md`

#### Objetivo
Agregar validaciones de negocio usando CHECK constraints en MySQL 8.0+

#### Cambios Principales

**1) lesson_progress.progress_pct rango 0-100**
```sql
ALTER TABLE lesson_progress 
ADD CONSTRAINT chk_progress_pct CHECK (progress_pct BETWEEN 0 AND 100)
```
- Previene valores fuera de rango
- Valida a nivel DB, no solo backend

**2) live_classes validaciones**
```sql
ALTER TABLE live_classes MODIFY end_at datetime NOT NULL
ALTER TABLE live_classes 
ADD CONSTRAINT chk_live_end_after_start CHECK (end_at > start_at)
```
- end_at ahora obligatorio
- Asegura que fin sea posterior al inicio

**3) cohorts validaciones**
```sql
ALTER TABLE cohorts 
ADD CONSTRAINT chk_cohort_end_after_start CHECK (end_at > start_at)
ALTER TABLE cohorts 
ADD CONSTRAINT chk_cohort_capacity_positive CHECK (capacity > 0)
```
- Valida rango de fechas
- Valida que capacidad sea positiva

#### Ventajas
- ✅ Validación centralizada en DB, no depende de backend
- ✅ Imposible insertar datos inválidos desde cualquier fuente
- ✅ Performance: validación rápida en DB

#### Reversión (down)
- DROP CONSTRAINT por constraint


---

### Migración 004: EstandarizacionNaming

**Archivo**: `backend/src/database/migrations/1700000004001-EstandarizacionNaming.ts`

#### Objetivo
Placeholder seguro para operaciones futuras de renombrado de campos.

**Status**: ✅ EJECUTADA como placeholder
**Nota**: El renombrado real de `index` → `position` se implementará cuando se cumpla con todas las dependencias de FK.

#### Por qué Placeholder?
- Renombrar columnas con FK en MySQL requiere:
  1. Eliminar FK
  2. Eliminar índices UNIQUE que dependan
  3. Renombrar columna
  4. Recrear índices
  5. Recrear FKs
- La lógica es defensiva y requiere análisis profundo de dependencias
- Implementación pospuesta para evitar riesgos innecesarios

#### Próximos Pasos
- Cuando se necesite renombrar en producción, ejecutar plan defensivo con backup previo


---

### Migración 005: AuditLogYSoftDelete

**Archivo**: `backend/src/database/migrations/1700000002001-AuditLogYSoftDelete.ts`

**Archivo De Explicación**: `1700000002001-AuditLogYSoftDelete.explicacion.md`

#### Objetivo
Implementar auditoría de cambios de suscripciones y soft delete en usuarios.

#### Cambios Principales

**1) Crear tabla subscriptions_logs**
```sql
CREATE TABLE subscriptions_logs (
  id, subscription_id (FK), price_monthly, currency, plan_name, status, created_at...
)
```
- Guarda snapshot de precio/moneda en cada cambio
- Permite auditar cambios históricos sin perder precisión
- Evita inconsistencias al cambiar planes de precio

**2) Soft Delete en USERS**
```sql
ALTER TABLE users ADD COLUMN deleted_at datetime(6) NULL
ALTER TABLE users ADD COLUMN status varchar(50) NOT NULL DEFAULT 'ACTIVE'
ALTER TABLE users ADD INDEX (deleted_at)
ALTER TABLE users ADD INDEX (deleted_at, status)
```
- Marca usuarios como eliminados sin borrar datos
- Permite recuperar usuarios si es necesario
- Índices para filtros rápidos (usuarios activos, histórico de eliminados)

#### Beneficios
- ✅ Auditoría completa de cambios en suscripciones
- ✅ Datos de usuario recuperables
- ✅ Cumple con RGPD (posibilidad de restaurar antes de eliminación definitiva)
- ✅ Performance: índices optimizados

#### Reversión (down)
- Elimina campos soft delete
- Elimina tabla subscriptions_logs


---

### Migración 006: CrearTablaRoles

**Archivo**: `backend/src/database/migrations/1700000005001-CrearTablaRoles.ts`

**Archivo De Explicación**: `1700000005001-CrearTablaRoles.explicacion.md`

#### Objetivo
Reemplazar el enum `role` en USERS por una tabla `roles` separada para mayor escalabilidad.

#### Cambios Principales

**1) Crear tabla roles**
```sql
CREATE TABLE roles (
  id, code (ADMIN/INSTRUCTOR/STUDENT), name, description, created_at, updated_at...
)
```
- Estructura normalizada
- Permite agregar campos futuros (permissions, etc)
- Índice en code para búsquedas rápidas

**2) Insertar roles estándar**
- ADMIN: Acceso total
- INSTRUCTOR: Crear y gestionar cursos
- STUDENT: Acceso a contenido

**3) Migrar datos de users**
```sql
ALTER TABLE users ADD COLUMN role_id int NOT NULL DEFAULT 3
UPDATE users u JOIN roles r ON (CASE WHEN u.role='ADMIN' THEN r.code='ADMIN'...)
ALTER TABLE users ADD CONSTRAINT FK_users_role_id FOREIGN KEY (role_id)...
ALTER TABLE users DROP COLUMN role
```
- Conserva mapeo 1:1 de valores enum
- Sin pérdida de datos
- FK garantiza integridad referencial

#### Ventajas vs Enum
| Aspecto | Enum | Tabla roles |
|---------|------|------------|
| Agregar roles | ❌ ALTER COLUMN | ✅ INSERT simple |
| Permisos | ❌ No | ✅ Puede expandir |
| Auditoría | ❌ No | ✅ created_at/updated_at |
| FK integrity | ❌ No | ✅ ON DELETE RESTRICT |
| Cambios futuros | ❌ Migration | ✅ Solo datos |

#### Reversión (down)
- Elimina FK
- Restaura columna role enum
- Migra datos inversos
- Elimina tabla roles
- Sin pérdida de datos


---

## PARTE 5: ANALISIS DE 5 CONSULTAS CRÍTICAS Y OPTIMIZACIÓN

### Consulta Crítica 1: Catálogo de cursos con filtros
**Ubicación**: `courses.service.ts` findAll()

**Patrón**:
```sql
SELECT c.* FROM courses c
LEFT JOIN course_tags ct ON c.id = ct.courses_id
LEFT JOIN tags t ON ct.tags_id = t.id
LEFT JOIN users u ON c.owner_id = u.id
WHERE c.visibility='PUBLIC' AND c.modality='SELF_PACED' AND c.tier_required=?...
```

**Riesgos**:
- Full table scan en courses si crece catálogo
- JOINs sin índices indexados apropiadamente

**Optimización Recomendada**:
- INDEX courses(visibility, modality, tier_required)
- INDEX courses(owner_id)
- UNIQUE courses(slug)

---

### Consulta Crítica 2: Progreso del usuario en curso
**Ubicación**: `lesson-progress.service.ts` findByUser()

**Riesgos**:
- N+1: cargar lecciones de módulos sin índices

**Optimización**:
- INDEX lesson_progress(user_id, course_id)
- INDEX lessons(module_id)

---

### Consulta Crítica 3: Scoreboards de intentos
**Ubicación**: `attempts.service.ts` getLeaderboard()

**Riesgos**:
- GROUP BY sin índices degrada con volumen

**Optimización**:
- INDEX attempts(quiz_id, score)
- INDEX attempts(user_id, created_at)

---

### Consulta Crítica 4: Historial de cambios (auditoría)
**Ubicación**: `audit-logs.service.ts`

**Riesgos**:
- TABLE SCAN si no hay índices en timestamps

**Optimización**:
- INDEX audit_logs(user_id, created_at)
- INDEX audit_logs(action, created_at)

---

### Consulta Crítica 5: Validación de respuesta en examen
**Ubicación**: `answers.service.ts` validateAnswer()

**Riesgos**:
- Inconsistencia si option.question_id ≠ answer.question_id

**Optimización**:
- UNIQUE answers(attempt_id, question_id)
- INDEX answers(question_id)
- Validación en backend antes de INSERT

---

## Resumen General

✅ **Migraciones Completadas**: 6/6 (Hardening, Validaciones, Placeholder, Auditoría, Roles)

✅ **Integridad de Datos**: Hardened con NOT NULL + UNIQUE + CHECK constraints

✅ **Soft Delete**: Implementado para usuarios

✅ **Auditoría**: Tabla subscriptions_logs para historial de precios

✅ **Escalabilidad**: Tabla roles separada (evolutiva vs enum fijo)

⏳ **Próximos Pasos**:
- Crear índices de performance según consultas críticas
- Normalizar level/language en COURSES
- Definir reglas funcionales para CHALLENGES (curso O lección)
- Agregar timestamps a CHALLENGE_SUBMISSIONS
