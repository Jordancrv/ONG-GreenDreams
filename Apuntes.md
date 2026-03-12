# Apuntes de Base de Datos


## PRIORIDADES DE IMPLEMENTACION (Semana 1-2)

### Prioridad Alta (Integridad de datos)
- SUBSCRIPTIONS: user_id y plan_id en NOT NULL.
- COURSES: slug en NOT NULL + UNIQUE, owner_id en NOT NULL.
- COURSE_MODULES: course_id en NOT NULL + UNIQUE(course_id, position).
- LESSONS: module_id en NOT NULL + UNIQUE(module_id, position).
- ENROLLMENTS: user_id y course_id en NOT NULL + UNIQUE(user_id, course_id).
- LESSON_PROGRESS: user_id y lesson_id en NOT NULL + UNIQUE(user_id, lesson_id).
- ATTEMPTS: quiz_id y user_id en NOT NULL.
- ANSWERS: attempt_id y question_id en NOT NULL (option_id nullable solo en OPEN).

### Prioridad Media (Consistencia funcional)
- QUESTIONS: quiz_id en NOT NULL.
- OPTIONS: question_id en NOT NULL.
- LIVE_CLASSES y COHORTS: reglas de validacion de fechas (end_at > start_at).
- COURSES: estandarizar level y language (enum o tabla catalogo).
- TAGS: normalizacion de nombre para evitar duplicados semanticos.

### Prioridad Baja (Evolutivo y performance)
- USERS: evaluar status/deleted_at para Soft Delete.
- MEMBERSHIP_PLANS: campos de monetizacion (price_monthly, currency).
- AUDIT_LOGS: evaluar uso de updated_at segun politica de auditoria.
- CHALLENGE_SUBMISSIONS: agregar submitted_at y trazabilidad de evaluacion.


## PLAN DE MIGRACIONES INICIALES (TypeORM)

### Objetivo
- Crear migraciones incrementales y seguras para aplicar cambios sin perder datos.

### Preparacion tecnica (backend)
- El proyecto ya tiene DataSource en backend/src/database/data-source.ts.
- Actualmente no hay scripts de migration en package.json (solo schema:sync y seed).

### Scripts recomendados para package.json
- migration:generate: typeorm-ts-node-commonjs -d src/database/data-source.ts migration:generate src/database/migrations/Auto
- migration:create: typeorm-ts-node-commonjs -d src/database/data-source.ts migration:create src/database/migrations/Manual
- migration:run: typeorm-ts-node-commonjs -d src/database/data-source.ts migration:run
- migration:revert: typeorm-ts-node-commonjs -d src/database/data-source.ts migration:revert

### Orden sugerido de migraciones iniciales

#### Migracion 001 - Integridad de FKs criticas
- Alterar a NOT NULL:
	- subscriptions.user_id, subscriptions.plan_id
	- courses.owner_id
	- course_modules.course_id
	- lessons.module_id
	- enrollments.user_id, enrollments.course_id
	- lesson_progress.user_id, lesson_progress.lesson_id
	- attempts.quiz_id, attempts.user_id
	- answers.attempt_id, answers.question_id
	- questions.quiz_id
	- options.question_id

#### Migracion 002 - Unicidad y orden funcional
- Agregar restricciones UNIQUE:
	- courses.slug
	- enrollments(user_id, course_id)
	- lesson_progress(user_id, lesson_id)
	- user_points(user_id, course_id)
	- course_modules(course_id, index)
	- lessons(module_id, index)

#### Migracion 003 - Validaciones de rango y fechas
- Validar progress_pct en rango 0-100 (si aplica CHECK o validar en backend).
- Validar end_at > start_at para live_classes y cohorts (regla en backend o constraint segun soporte).

#### Migracion 004 - Estandarizacion de naming
- Renombrar index a position en:
	- course_modules
	- lessons
- Ajustar codigo backend y DTOs para reflejar el cambio.

#### Migracion 005 - Auditoria y negocio evolutivo
- Crear tabla subscriptions_logs con snapshot de precio y moneda.
- Evaluar agregar status/deleted_at en users.

### Checklist para ejecutar cada migracion
- 1. Backup de BD antes de correr migration:run.
- 2. Ejecutar migracion en entorno local.
- 3. Validar integridad con consultas de conteo y null checks.
- 4. Probar endpoints criticos (auth, courses, enrollments, quizzes).
- 5. Registrar evidencia en el documento de auditoria.




## TABLAS:

### USERS (Gestión de cuentas del sistema)

- id: int NOT NULL IDENTITY PK
- created_at: datetime(6) NOT NULL
- updated_at: datetime(6) NOT NULL 
- email: varchar(255) NOT NULL UNIQUE 
- password_hash: varchar(255) NOT NULL 
- first_name: varchar(255) 
- last_name: varchar(255) 
- avatar_url: varchar(255) 
- role: enum('ADMIN','INSTRUCTOR','STUDENT') NOT NULL

#### Problemas Actuales
- first_name y last_name permiten valores nulos generando posibles registros incompletos en el registro.
-  El campo role debería integrarse en una nueva tabla en la cual se puede integrar nuevos roles en un futuro y tener mayor flexibilidad.
- Implementar un campo status, con la finalidad de usar Soft Delete, esto sirve para no eliminar datos en caso un usuario desee eliminar su cuenta y no desencadenar en perdida de datos.

### SUBSCRIPTIONS (Gestión de subscripciones)

- id: int NOT NULL IDENTITY PK
- created_at: datetime(6) NOT NULL
- updated_at: datetime(6) NOT NULL 
- start_at: datetime NOT NULL 
- end_at: datetime 
- status: enum('ACTIVE','CANCELLED','EXPIRED') NOT NULL
- user_id: int (users)
- plan_id: int (membership_plans)

#### Problemas Actuales
- user_id y plan_id no deberia permitir valores nulos, puesto que un usuario al registrarse deberia agregarse al plan free, basico o gratuito, esto se debe para no tener perdida de datos en el registro de planes de los usuarios.
- Deberia crearse una tabla llamada subscriptions_logs con un campo el cual guarde el precio en el que el usuario se suscribio en el plan ya que al momento de realizar una auditoria de datos y los planes hayan sido modificados apareceran con los ultimos precios generando un desbalance en los ingresos.


### MEMBERSHIP_PLANS (Planes)

- id: int NOT NULL IDENTITY PK
- created_at: datetime(6) NOT NULL
- updated_at: datetime(6) NOT NULL 
- code: enum('BASIC','PRO') NOT NULL
- name: varchar(255) NOT NULL
- features: json
- status: tinyint NOT NUL

#### POSIBLES MEJORAS
- Se podria agregar nuevos campos price_monthly y currency por si se desea cobrar por los planes y los cursos, ademas de agregar el historial historico de los precios en un log. 

### AUDIT_LOGS (Registro de eventos de los usuarios)
- id: int NOT NULL IDENTITY PK
- created_at: datetime(6) NOT NULL
- updated_at: datetime(6) NOT NULL 
- action: varchar(255) 
- metadata: json 
- user_id: int (users)

#### POSIBLES MEJORAS
- Deberia eliminarse el campo de updated_at, probablemente fue creada al usar la plantilla ORM, lo importante aqui es guardar las acciones de los usuarios sin actualizarse a menos de que se trate de pagos o transacciones y el estado de la transaccion se actualice.

### COURSES (Gestión de catálogo de cursos)
- id: int NOT NULL IDENTITY PK
- created_at: datetime(6) NOT NULL
- updated_at: datetime(6) NOT NULL
- title: varchar(255) NOT NULL
- slug: varchar(255) NULL
- summary: varchar(255) NULL
- description: text NULL
- thumbnail_url: varchar(255) NULL
- level: varchar(255) NULL
- language: varchar(255) NULL
- visibility: enum('PUBLIC','PRIVATE') NOT NULL default 'PUBLIC'
- modality: enum('SELF_PACED','GUIDED') NOT NULL default 'SELF_PACED'
- tier_required: enum('FREE','BASIC','PRO') NOT NULL default 'FREE'
- has_certificate: tinyint NOT NULL default 0
- supports_live: tinyint NOT NULL default 0
- supports_challenges: tinyint NOT NULL default 0
- owner_id: int NULL (users)

#### Problemas Actuales
- slug permite valores nulos y no cuenta con UNIQUE por lo que se pueden crear slugs duplicados y existir cursos sin slugs. 
- Pueden existir cursos sin owner.
- level y language son varchar(255) lo que puede permitir datos inconsistentes por si no se sigue una regla de estandarizacion.
- summary varchar(255) podria quedar corto en algunos casos.
### RECOMENDACION
- slug NOT NULL UNIQUE
- owner_id NOT NULL
- level y language estandarizar con enum o crear una tabla para estandarizar estos datos


### COURSES_MODULES (Gestión de catálogo de cursos)
- id: int NOT NULL IDENTITY PK
- created_at: datetime(6) NOT NULL
- updated_at: datetime(6) NOT NULL
- index: int NOT NULL
- title: varchar(255) NOT NULL
- summary: varchar(255)
- course_id: int (courses)

#### Problemas Actuales
- Renonbrar el campo index ya que al ser una palabra reservada por sql puede traer inconsistencias.
- course_id permite valores nulos pudiendo registrar datos huerfanos.
- course_id e index deberian integrarse con UNIQUE para mantener un orden entre curso e index permitiendo reutilizarlo
### RECOMENDACION
- position (index) int NOT NULL
- course_id: int NOT NULL
- UNIQUE(course_id, position)

### LESSONS (Lecciones)
- id: int NOT NULL IDENTITY PK
- created_at: datetime(6) NOT NULL
- updated_at: datetime(6) NOT NULL
- index: int NOT NULL
- title: varchar(255) NOT NULL
- content: text
- video_url: varchar(255)
- duration_min: int
- resources: json
- module_id: int (course_modules)

#### Problemas Actuales
- module_id esta permitiendo el registro de lecciones sin modulo.
- Renombrar el campo de index ya que al ser una palabra reservada por sql puede traer inconsistencias.
- module_id y index deberian agregarse en UNIQUE por lo cual se podria repetir el index y mantener un orden entre los modulos y el index.

### RECOMENDACION
- module_id NOT NULL
- position (index) int NOT NULL
- UNIQUE (module_id, position)
 
### CHALLENGE ()
- id: int NOT NULL
- created_at: datetime(6) NOT NULL
- updated_at: datetime(6) NOT NULL
- title: varchar(255) NOT NULL
- description: text
- points: int NOT NULL
- rules: json
- course_id: int (courses)
- lesson_id: int (lessons)


### CHALLENGE_SUBMISSIONS ()
- id: int NOT NULL
- artifact_url: varchar(255) 
- score: int NOT NULL 
- status: enum('SUBMITTED','REVIEWING',APPROVED','REJECTED') NOT NULL
- challenge_id: int (challenges)
- user_id: int (users)

#### Problemas Actuales
- No existe campos que registren el momento en el que se mando la respuesta del challenge y tampoco de cuando se actualizo ese score.
- Agregar not null en challenge id ya que una entrega sin challenge id podria romper parte de la logica del sistema, lo mismo con los usuarios.
### RECOMENDACION
- submitted_at datetime(6) NOT NULL
- updated_at datetime(6)
- challenge_id: int NOT NULL
- user_id: int NOT NULL


### ATTEMPTS (Intentos de evaluacion)
- id: int NOT NULL IDENTITY PK
- created_at: datetime(6) NOT NULL
- updated_at: datetime(6) NOT NULL
- started_at: datetime NOT NULL
- submitted_at: datetime
- score: int NOT NULL default 0
- status: enum('IN_PROGRESS','SUBMITTED','GRADED') NOT NULL
- quiz_id: int (quizzes)
- user_id: int (users)

#### Problemas Actuales
- quiz_id y user_id permiten valores nulos pudiendo generar intentos vacios.
- No existe regla unica para evitar multiples intentos en paralelo del mismo usuario sobre el mismo quiz.

### RECOMENDACION
- quiz_id: int NOT NULL
- user_id: int NOT NULL
- evaluar UNIQUE(user_id, quiz_id, status) o regla de negocio para evitar intentos simultaneos en IN_PROGRESS.


### ANSWERS (Respuestas de intentos)
- id: int NOT NULL IDENTITY PK
- open_text: text
- is_correct: tinyint
- awarded_points: int
- attempt_id: int (attempts)
- question_id: int (questions)
- option_id: int (options)

#### Problemas Actuales
- attempt_id, question_id y option_id permiten nulos, lo que puede romper trazabilidad de evaluacion.
- Riesgo de inconsistencia: option_id podria pertenecer a otra question distinta de question_id si no se valida en backend.

### RECOMENDACION
- attempt_id: int NOT NULL
- question_id: int NOT NULL
- option_id nullable solo para preguntas OPEN.
- validar en backend que option.question_id coincida con answer.question_id.


### QUIZZES (Evaluaciones)
- id: int NOT NULL IDENTITY PK
- created_at: datetime(6) NOT NULL
- updated_at: datetime(6) NOT NULL
- title: varchar(255) NOT NULL
- type: enum('QUIZ','EXAM') NOT NULL
- pass_score: int
- attempt_limit: int
- time_limit_sec: int
- weight: int
- course_id: int (courses)
- lesson_id: int (lessons)

#### Problemas Actuales
- course_id y lesson_id permiten nulos, lo que puede crear quizzes sin contexto.
- No existe una regla clara para definir si un quiz debe ser por curso o por leccion (o ambos).

### RECOMENDACION
- definir regla funcional: quiz por leccion o por curso.
- hacer NOT NULL el FK obligatorio segun la regla funcional.


### QUESTIONS (Preguntas)
- id: int NOT NULL IDENTITY PK
- created_at: datetime(6) NOT NULL
- updated_at: datetime(6) NOT NULL
- type: enum('MCQ','TRUE_FALSE','OPEN') NOT NULL
- prompt: text NOT NULL
- points: int NOT NULL default 1
- metadata: json
- quiz_id: int (quizzes)

#### Problemas Actuales
- quiz_id permite nulos generando preguntas sin evaluacion.

### RECOMENDACION
- quiz_id NOT NULL
- estandarizar estructura de metadata para evitar JSON desordenado.


### OPTIONS (Opciones de respuesta)
- id: int NOT NULL IDENTITY PK
- text: text NOT NULL
- is_correct: tinyint NOT NULL default 0
- explanation: text
- question_id: int (questions)

#### Problemas Actuales
- question_id permite nulos pudiendo existir opciones sin pregunta.
- No hay control para evitar multiples opciones correctas cuando la pregunta deberia ser de respuesta unica.

### RECOMENDACION
- question_id NOT NULL
- validar en backend reglas por tipo de pregunta (una o multiples correctas).


### ENROLLMENTS (Inscripciones de usuarios en cursos)
- id: int NOT NULL IDENTITY PK
- status: enum('ACTIVE','COMPLETED','DROPPED') NOT NULL
- enrolled_at: datetime NOT NULL
- user_id: int (users)
- course_id: int (courses)
- cohort_id: int (cohorts)

#### Problemas Actuales
- user_id y course_id permiten nulos.
- Falta control de duplicidad de inscripcion del mismo usuario al mismo curso.

### RECOMENDACION
- user_id NOT NULL
- course_id NOT NULL
- UNIQUE(user_id, course_id)


### LESSON_PROGRESS (Progreso por leccion)
- id: int NOT NULL IDENTITY PK
- completed: tinyint NOT NULL default 0
- progress_pct: int NOT NULL default 0
- last_viewed_at: datetime
- user_id: int (users)
- lesson_id: int (lessons)

#### Problemas Actuales
- user_id y lesson_id permiten nulos.
- progress_pct no tiene restriccion de rango (deberia ser 0 a 100).
- Puede existir mas de un progreso para la misma combinacion usuario-leccion.

### RECOMENDACION
- user_id NOT NULL
- lesson_id NOT NULL
- UNIQUE(user_id, lesson_id)
- CHECK progress_pct entre 0 y 100 (o validacion en backend).


### CERTIFICATES (Certificados emitidos)
- id: int NOT NULL IDENTITY PK
- created_at: datetime(6) NOT NULL
- updated_at: datetime(6) NOT NULL
- serial: varchar(255) NOT NULL UNIQUE
- pdf_url: varchar(255)
- hash_sha256: varchar(255)
- issued_at: datetime NOT NULL
- user_id: int (users)
- course_id: int (courses)
- cohort_id: int (cohorts)

#### Problemas Actuales
- user_id y course_id permiten nulos, lo cual puede generar certificados sin contexto.
- hash_sha256 permite nulos, reduciendo control de integridad documental.

### RECOMENDACION
- user_id NOT NULL
- course_id NOT NULL
- hash_sha256 NOT NULL si se requiere validacion de integridad del PDF.


### LIVE_CLASSES (Clases en vivo)
- id: int NOT NULL IDENTITY PK
- created_at: datetime(6) NOT NULL
- updated_at: datetime(6) NOT NULL
- title: varchar(255) NOT NULL
- start_at: datetime NOT NULL
- end_at: datetime
- meeting_url: varchar(255)
- recording_url: varchar(255)
- capacity: int
- timezone: varchar(255)
- course_id: int (courses)
- cohort_id: int (cohorts)

#### Problemas Actuales
- course_id permite nulos, pudiendo crear clases en vivo sin curso asociado.
- No hay validacion de que end_at sea mayor a start_at.

### RECOMENDACION
- course_id NOT NULL
- validar end_at > start_at
- normalizar timezone con lista estandar (IANA).


### COHORTS (Cohortes)
- id: int NOT NULL IDENTITY PK
- created_at: datetime(6) NOT NULL
- updated_at: datetime(6) NOT NULL
- name: varchar(255) NOT NULL
- start_at: datetime
- end_at: datetime
- capacity: int
- course_id: int (courses)

#### Problemas Actuales
- course_id permite nulos.
- No hay regla para validar capacidad positiva ni rango de fechas.

### RECOMENDACION
- course_id NOT NULL
- validar capacity > 0
- validar end_at > start_at.


### TAGS (Etiquetas)
- id: int NOT NULL IDENTITY PK
- name: varchar(255) NOT NULL UNIQUE

#### Problemas Actuales
- Falta normalizacion de nombre para evitar duplicados semanticos (ej: "IA" vs "ia").

### RECOMENDACION
- aplicar normalizacion de mayusculas/minusculas en backend antes de guardar.


### COURSE_TAGS (Relacion cursos y etiquetas)
- courses_id: int NOT NULL PK (courses)
- tags_id: int NOT NULL PK (tags)

#### Problemas Actuales
- La tabla cumple bien como puente N:M, pero falta confirmar comportamiento ON DELETE.

### RECOMENDACION
- mantener PK compuesta (courses_id, tags_id)
- validar ON DELETE CASCADE para limpieza automatica en relaciones.


### USER_POINTS (Puntaje por usuario y curso)
- id: int NOT NULL IDENTITY PK
- points: int NOT NULL default 0
- user_id: int (users)
- course_id: int (courses)

#### Problemas Actuales
- user_id y course_id permiten nulos.
- Puede haber multiples filas para el mismo usuario y curso (duplicando acumulado).

### RECOMENDACION
- user_id NOT NULL
- course_id NOT NULL
- UNIQUE(user_id, course_id)
