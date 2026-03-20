# Auditoria de Base de Datos - Estructura y Análisis

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


### ROLES (Catálogo de roles del sistema) - ✅ ACTIVA

#### Estructura Actual
- **id**: int NOT NULL IDENTITY PK
- **created_at**: datetime(6) NOT NULL
- **updated_at**: datetime(6) NOT NULL
- **code**: varchar(50) NOT NULL UNIQUE
- **name**: varchar(100) NOT NULL

#### Relación con USERS
- `users.role_id` apunta a `roles.id` mediante FK (`FK_users_role_id`)
- `users.role_id` es NOT NULL

#### Estado Actual
- ✅ Tabla activa y poblada con roles base (`STUDENT`, `INSTRUCTOR`, `ADMIN`)
- ✅ `users.role` enum fue migrado a `users.role_id`
- ✅ Modelo más flexible para agregar nuevos roles sin alterar enum en BD

#### Recomendaciones
- Mantener `code` como identificador técnico estable
- Evitar eliminar roles con usuarios asignados
- Definir catálogo funcional de permisos por rol (RBAC) para crecimiento


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
9. ✅ USERS: Soft delete + status (se mantiene role como enum en users)

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
| 000 | InitialSchema | 1699999999999-InitialSchema.ts | ✅ EJECUTADA | Crea esquema base vía synchronize() |
| 001 | InitialMigration | 1700000001001-InitialMigration.ts | ✅ EJECUTADA | Hardening + validaciones + auditoría + soft delete |
| 002+ | Futuras | --- | ⏳ PENDIENTES | Performance, normalización y reglas de negocio |


---

## PARTE 4: MIGRACIONES EJECUTADAS Y EXPLICACIONES

### Migración 000: InitialSchema

**Archivo**: `backend/src/database/migrations/1699999999999-InitialSchema.ts`

#### Objetivo
Garantizar que la base tenga el esquema inicial completo antes de ejecutar hardening.

#### Cambios Principales

**1) Creación de esquema base**
- Ejecuta `queryRunner.connection.synchronize()` en el `up`.
- Materializa tablas desde entidades para evitar errores por tablas inexistentes.

**2) Reversión controlada**
- Ejecuta `queryRunner.clearDatabase()` en el `down`.

#### Resultado
- Se eliminó el fallo inicial donde la migración consolidada corría sobre una BD sin tablas base.


---

### Migración: InitialMigration

**Archivo**: `backend/src/database/migrations/1700000001001-InitialMigration.ts`

#### Objetivo
Consolidar hardening funcional en una sola migración robusta e idempotente.

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

**6) Validaciones de negocio**
- CHECK de `lesson_progress.progress_pct` en rango 0-100.
- `live_classes.end_at` obligatorio y validación `end_at > start_at`.
- CHECK de fechas en `cohorts`.
- Limpieza de capacidades inválidas (`<= 0`) en `cohorts` y `live_classes`.

**7) Estandarización (placeholder)**
- Se mantiene sin renombrados destructivos para no romper FKs.

**8) Auditoría + Soft Delete**
- Creación de `subscriptions_logs`.
- En `users`: agrega `deleted_at`, `status`, e índices para filtrado de activos.

**9) Endurecimiento idempotente**
- Antes de crear índices/constraints/columnas, verifica existencia con `INFORMATION_SCHEMA` o `hasTable/hasColumn`.
- Evita fallos por re-ejecución parcial (duplicados de índices/constraints/columnas).

#### Reversión (down)
- Reversión LIFO de todas las fases integradas en el mismo archivo.
- Incluye eliminación de índices/checks/columnas agregadas durante hardening.

#### Nota de alcance
- En esta iteración quedó **activa** la migración de tabla `roles`.
- `users.role` enum fue reemplazado por `users.role_id` con FK a `roles`.


---

## PARTE 5: ANALISIS DE 5 CONSULTAS CRÍTICAS Y OPTIMIZACIÓN

### Consulta Crítica 1: Catálogo de cursos con filtros
**Ubicación real en código**: `backend/src/courses/courses.service.ts` método `findAll()`
**Endpoint asociado**: `GET /courses` en `backend/src/courses/courses.controller.ts`

**Cómo se construye en el código (TypeORM QueryBuilder):**
- Base: `FROM courses course`
- JOINs: `LEFT JOIN tags tag`, `LEFT JOIN owner owner`
- Filtro fijo: `course.visibility = 'PUBLIC'`
- Filtros opcionales: `q`, `tag`, `modality`, `owner(email)`, `tier`

**Patrón SQL aproximado (realista):**
```sql
SELECT
  c.id,
  c.title,
  c.slug,
  c.summary,
  c.thumbnail_url,
  c.modality,
  c.tier_required,
  c.visibility,
  c.owner_id,
  u.id AS owner_id,
  u.email AS owner_email,
  t.id AS tag_id,
  t.name AS tag_name
FROM courses c
LEFT JOIN users u ON u.id = c.owner_id
LEFT JOIN course_tags ct ON ct.courses_id = c.id
LEFT JOIN tags t ON t.id = ct.tags_id
WHERE c.visibility = 'PUBLIC'
  AND (:q IS NULL OR (c.title LIKE CONCAT('%', :q, '%') OR c.summary LIKE CONCAT('%', :q, '%')))
  AND (:tag IS NULL OR t.name = :tag)
  AND (:modality IS NULL OR c.modality = :modality)
  AND (:ownerEmail IS NULL OR u.email = :ownerEmail)
  AND (:tier IS NULL OR c.tier_required = :tier);
```

**¿Es realmente crítica?**
- ✅ Sí, crítica alta. Es la consulta principal de catálogo y afecta navegación, búsqueda y conversión.

**¿Para qué sirve?**
- Lista cursos públicos para explorar, buscar y filtrar en la plataforma.
- Es una consulta de lectura frecuente (alta repetición), por eso impacta UX y costo de BD.

**Riesgos actuales**
- `LIKE '%texto%'` rompe uso eficiente de índices BTREE en `title/summary`.
- `LEFT JOIN` + filtro por tag puede multiplicar filas y aumentar costo de sort/scan.
- Sin paginación, el costo crece linealmente con el catálogo.

**Mejoras recomendadas (ordenadas por impacto/seguridad):**
1. **Paginación obligatoria** (`LIMIT/OFFSET` o cursor) para reducir filas por request.
2. **Seleccionar columnas necesarias** (evitar `SELECT *`) para bajar I/O.
3. **Índices base**:
   - `INDEX courses(visibility, modality, tier_required)`
   - `INDEX courses(owner_id)`
   - `INDEX tags(name)`
   - `UNIQUE courses(slug)` (ya existe y se mantiene)
4. **Búsqueda de texto**: migrar de `LIKE '%q%'` a `FULLTEXT(title, summary)` cuando el volumen suba.
5. **Tag filter más eficiente**: usar `EXISTS` en lugar de `LEFT JOIN` cuando solo se filtra por tag.

**Versión optimizada sugerida (patrón SQL):**
```sql
SELECT
  c.id,
  c.title,
  c.slug,
  c.summary,
  c.thumbnail_url,
  c.modality,
  c.tier_required,
  c.visibility,
  u.id AS owner_id,
  u.email AS owner_email
FROM courses c
JOIN users u ON u.id = c.owner_id
WHERE c.visibility = 'PUBLIC'
  AND (:modality IS NULL OR c.modality = :modality)
  AND (:tier IS NULL OR c.tier_required = :tier)
  AND (:ownerEmail IS NULL OR u.email = :ownerEmail)
  AND (
    :tag IS NULL OR EXISTS (
      SELECT 1
      FROM course_tags ct
      JOIN tags t ON t.id = ct.tags_id
      WHERE ct.courses_id = c.id
        AND t.name = :tag
    )
  )
  AND (
    :q IS NULL OR MATCH(c.title, c.summary) AGAINST(:q IN NATURAL LANGUAGE MODE)
  )
ORDER BY c.created_at DESC
LIMIT :limit OFFSET :offset;
```

**Nota práctica para tu backend actual:**
- Puedes empezar ya con paginación + selección de columnas + índices base (cambio de bajo riesgo).
- FULLTEXT y `EXISTS` los aplicas en una segunda iteración para comparar `EXPLAIN` antes/después.

---

### Consulta Crítica 2: Progreso del usuario en curso
**Ubicación real en código**: `backend/src/progress/progress.service.ts` método `getCourseProgress()`
**Endpoint asociado**: `GET /progress/me/courses/:courseId` en `backend/src/progress/progress.controller.ts`

**¿Es realmente crítica?**
- ✅ Sí, crítica media-alta. Impacta directamente la experiencia del alumno y dashboards de avance.

**¿Para qué sirve?**
- Calcula total de lecciones, completadas y porcentaje de progreso por curso/usuario.

**Riesgos**:
- Joins encadenados (lesson -> module -> course) costosos sin índices adecuados
- Recalcular progreso completo en cada request puede escalar mal

**Optimización**:
- Ajuste importante: en el modelo actual `lesson_progress` no tiene `course_id`, por lo que ese índice no aplica
- Mantener/asegurar UNIQUE o INDEX en lesson_progress(user_id, lesson_id)
- INDEX lessons(module_id)
- INDEX course_modules(course_id)
- Cache de progreso por usuario/curso si aumenta tráfico

---

### Consulta Crítica 3: Scoreboards de intentos
**Ubicación real en código**: No existe actualmente `getLeaderboard()` en `backend/src/attempts/attempts.service.ts`

**¿Es realmente crítica?**
- ⚠️ No es crítica hoy en producción porque aún no está implementada.
- ✅ Sí sería crítica al activarla para ranking y analítica.

**¿Para qué serviría?**
- Ranking de desempeño por quiz, curso, cohorte o ventana de tiempo.

**Riesgos**:
- GROUP BY sin índices degrada con volumen

**Optimización**:
- INDEX attempts(quiz_id, score)
- INDEX attempts(user_id, created_at)
- Definir regla de ranking (mejor intento, último intento o promedio) para evitar resultados ambiguos

---

### Consulta Crítica 4: Historial de cambios (auditoría)
**Ubicación real en código**:
- Escritura de logs: `backend/src/audit/audit.service.ts` método `record()`
- Disparador transversal: `backend/src/common/interceptors/audit.interceptor.ts`

**¿Es realmente crítica?**
- ✅ Sí, crítica de trazabilidad/compliance.

**¿Para qué sirve?**
- Registra acción HTTP, metadata y usuario para auditoría operativa.

**Riesgos**:
- TABLE SCAN si no hay índices en timestamps
- Crecimiento rápido de metadata JSON puede afectar I/O y backup

**Optimización**:
- INDEX audit_logs(user_id, created_at)
- INDEX audit_logs(action, created_at)
- Política de retención/archivado para logs históricos

---

### Consulta Crítica 5: Validación de respuesta en examen
**Ubicación real en código**: `backend/src/attempts/attempts.service.ts` método `addAnswer()`
**Endpoint asociado**: `POST /attempts/:id/answers` en `backend/src/attempts/attempts.controller.ts`

**¿Es realmente crítica?**
- ✅ Sí, crítica alta por integridad académica y cálculo de notas.

**¿Para qué sirve?**
- Valida que la pregunta pertenezca al intento/quiz y registra respuesta con corrección/puntaje.

**Riesgos**:
- Inconsistencia si option.question_id ≠ answer.question_id
- Condición de carrera sin UNIQUE puede permitir respuestas duplicadas por pregunta

**Optimización**:
- UNIQUE answers(attempt_id, question_id)
- INDEX answers(question_id)
- Validación en backend antes de INSERT
- Validar explícitamente que `option.question_id == question.id` antes de guardar

---

## Resumen General

✅ **Migraciones Completadas**: 2/2 activas (InitialSchema + InitialMigration)

✅ **Integridad de Datos**: Hardened con NOT NULL + UNIQUE + CHECK constraints

✅ **Soft Delete**: Implementado para usuarios

✅ **Auditoría**: Tabla subscriptions_logs para historial de precios

✅ **Estabilidad de Roles**: Activo `users.role_id` + tabla `roles` (modelo escalable)

⏳ **Próximos Pasos**:
- Crear índices de performance según consultas críticas
- Normalizar level/language en COURSES
- Definir reglas funcionales para CHALLENGES (curso O lección)
- Agregar timestamps a CHALLENGE_SUBMISSIONS


**PROBLEMAS ENCONTRADOS**

- No existe limite al mostrar los tags en el apartado explorar, mientras mas tags existan y vayan creciendo los cursos agregados, sera una fatiga visual para el estudiante que quiera inscribirse a un curso.

- Error al agregar cursos a favoritos 
{statusCode: 500, message: "Internal server error"}
message
: 
"Internal server error"
statusCode
: 
500


- Error al actualizar contraseña del usuario

{firstName: "Ana", lastName: "Garcia", email: "estudiante@test.com", currentPassword: "123456",…}
currentPassword
: 
"123456"
email
: 
"estudiante@test.com"
firstName
: 
"Ana"
lastName
: 
"Garcia"
password
: 
"123456789"

- Doble creacion de datos en audit_logs debido a la doble peticion de API