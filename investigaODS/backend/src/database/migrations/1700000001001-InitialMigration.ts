import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * InitialMigration: Consolidación TOTAL de todas las migraciones en una sola
 *
 * Este archivo contiene todas las 9 fases de migración de la base de datos:
 * - FASE 1-5: Hardening inicial (limpieza, deduplicación, normalización, FK, UNIQUE)
 * - FASE 6: Validaciones de rango y fechas
 * - FASE 7: Estandarización de naming (placeholder)
 * - FASE 8: Auditoría y soft delete
 * - FASE 9: Tabla de roles
 *
 * Estructura: 9 fases principales, cada una independiente pero secuencial
 * Reversión: LIFO (Last In, First Out)
 */
export class InitialHardeningWeek121700000001001 implements MigrationInterface {
  name = 'InitialHardeningWeek121700000001001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================================
    // FASE 1: LIMPIEZA DE DATOS
    // ============================================================================
    console.log('[MIGRACION] FASE 1: Limpieza de datos...');

    await queryRunner.query(`
      UPDATE courses
      SET slug = CONCAT('course-', id)
      WHERE slug IS NULL OR slug = ''
    `);

    await queryRunner.query(`
      UPDATE courses c
      JOIN (
        SELECT slug
        FROM courses
        GROUP BY slug
        HAVING COUNT(*) > 1
      ) d ON d.slug = c.slug
      SET c.slug = CONCAT(c.slug, '-', c.id)
    `);

    await queryRunner.query(`
      UPDATE courses
      SET owner_id = (SELECT id FROM users ORDER BY id LIMIT 1)
      WHERE owner_id IS NULL
    `);

    await queryRunner.query(`DELETE FROM subscriptions WHERE user_id IS NULL OR plan_id IS NULL`);
    await queryRunner.query(`DELETE FROM course_modules WHERE course_id IS NULL`);
    await queryRunner.query(`DELETE FROM lessons WHERE module_id IS NULL`);
    await queryRunner.query(`DELETE FROM enrollments WHERE user_id IS NULL OR course_id IS NULL`);
    await queryRunner.query(`DELETE FROM lesson_progress WHERE user_id IS NULL OR lesson_id IS NULL`);
    await queryRunner.query(`DELETE FROM attempts WHERE quiz_id IS NULL OR user_id IS NULL`);
    await queryRunner.query(`DELETE FROM answers WHERE attempt_id IS NULL OR question_id IS NULL`);
    await queryRunner.query(`DELETE FROM questions WHERE quiz_id IS NULL`);
    await queryRunner.query(`DELETE FROM options WHERE question_id IS NULL`);
    await queryRunner.query(`DELETE FROM user_points WHERE user_id IS NULL OR course_id IS NULL`);

    console.log('[MIGRACION] FASE 1: Limpieza completada ✓');

    // ============================================================================
    // FASE 2: DEDUPLICACIÓN DE DATOS
    // ============================================================================
    console.log('[MIGRACION] FASE 2: Deduplicación de registros...');

    await queryRunner.query(`
      CREATE TEMPORARY TABLE tmp_enrollments_keep AS
      SELECT MIN(id) AS keep_id, user_id, course_id
      FROM enrollments
      GROUP BY user_id, course_id
    `);

    await queryRunner.query(`
      DELETE e
      FROM enrollments e
      JOIN tmp_enrollments_keep k
        ON e.user_id = k.user_id
       AND e.course_id = k.course_id
      WHERE e.id <> k.keep_id
    `);

    await queryRunner.query(`DROP TEMPORARY TABLE tmp_enrollments_keep`);

    await queryRunner.query(`
      CREATE TEMPORARY TABLE tmp_progress_keep AS
      SELECT MIN(id) AS keep_id, user_id, lesson_id
      FROM lesson_progress
      GROUP BY user_id, lesson_id
    `);

    await queryRunner.query(`
      DELETE lp
      FROM lesson_progress lp
      JOIN tmp_progress_keep k
        ON lp.user_id = k.user_id
       AND lp.lesson_id = k.lesson_id
      WHERE lp.id <> k.keep_id
    `);

    await queryRunner.query(`DROP TEMPORARY TABLE tmp_progress_keep`);

    await queryRunner.query(`
      CREATE TEMPORARY TABLE tmp_user_points_agg AS
      SELECT MIN(id) AS keep_id, user_id, course_id, SUM(points) AS total_points
      FROM user_points
      GROUP BY user_id, course_id
    `);

    await queryRunner.query(`
      UPDATE user_points up
      JOIN tmp_user_points_agg agg ON up.id = agg.keep_id
      SET up.points = agg.total_points
    `);

    await queryRunner.query(`
      DELETE up
      FROM user_points up
      JOIN tmp_user_points_agg agg
        ON up.user_id = agg.user_id
       AND up.course_id = agg.course_id
      WHERE up.id <> agg.keep_id
    `);

    await queryRunner.query(`DROP TEMPORARY TABLE tmp_user_points_agg`);

    console.log('[MIGRACION] FASE 2: Deduplicación completada ✓');

    // ============================================================================
    // FASE 3: NORMALIZACIÓN DE ÍNDICES
    // ============================================================================
    console.log('[MIGRACION] FASE 3: Normalización de índices...');

    await queryRunner.query(`
      CREATE TEMPORARY TABLE tmp_module_positions AS
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY \`index\`, id) AS new_position
      FROM course_modules
    `);

    await queryRunner.query(`
      UPDATE course_modules cm
      JOIN tmp_module_positions p ON cm.id = p.id
      SET cm.\`index\` = p.new_position
    `);

    await queryRunner.query(`DROP TEMPORARY TABLE tmp_module_positions`);

    await queryRunner.query(`
      CREATE TEMPORARY TABLE tmp_lesson_positions AS
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY module_id ORDER BY \`index\`, id) AS new_position
      FROM lessons
    `);

    await queryRunner.query(`
      UPDATE lessons l
      JOIN tmp_lesson_positions p ON l.id = p.id
      SET l.\`index\` = p.new_position
    `);

    await queryRunner.query(`DROP TEMPORARY TABLE tmp_lesson_positions`);

    console.log('[MIGRACION] FASE 3: Normalización completada ✓');

    // ============================================================================
    // FASE 4: HARDENING DE FOREIGN KEYS
    // ============================================================================
    console.log('[MIGRACION] FASE 4: Hardening de Foreign Keys...');

    console.log('[MIGRACION] FASE 4.1: Hardening SUBSCRIPTIONS...');
    await queryRunner.query(`ALTER TABLE subscriptions DROP FOREIGN KEY FK_d0a95ef8a28188364c546eb65c1`);
    await queryRunner.query(`ALTER TABLE subscriptions DROP FOREIGN KEY FK_e45fca5d912c3a2fab512ac25dc`);
    await queryRunner.query(`ALTER TABLE subscriptions MODIFY user_id int NOT NULL`);
    await queryRunner.query(`ALTER TABLE subscriptions MODIFY plan_id int NOT NULL`);
    await queryRunner.query(`ALTER TABLE subscriptions ADD CONSTRAINT FK_d0a95ef8a28188364c546eb65c1 FOREIGN KEY (user_id) REFERENCES users(id)`);
    await queryRunner.query(`ALTER TABLE subscriptions ADD CONSTRAINT FK_e45fca5d912c3a2fab512ac25dc FOREIGN KEY (plan_id) REFERENCES membership_plans(id)`);

    console.log('[MIGRACION] FASE 4.2: Hardening COURSES...');
    await queryRunner.query(`ALTER TABLE courses DROP FOREIGN KEY FK_8e2bcdb457d982b1dc39e5e0edb`);
    await queryRunner.query(`ALTER TABLE courses MODIFY owner_id int NOT NULL`);
    await queryRunner.query(`ALTER TABLE courses MODIFY slug varchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE courses ADD CONSTRAINT FK_8e2bcdb457d982b1dc39e5e0edb FOREIGN KEY (owner_id) REFERENCES users(id)`);

    console.log('[MIGRACION] FASE 4.3: Hardening COURSE_MODULES...');
    await queryRunner.query(`ALTER TABLE course_modules DROP FOREIGN KEY FK_81644557c2401f37fe9e884e884`);
    await queryRunner.query(`ALTER TABLE course_modules MODIFY course_id int NOT NULL`);
    await queryRunner.query(`ALTER TABLE course_modules ADD CONSTRAINT FK_81644557c2401f37fe9e884e884 FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE`);

    console.log('[MIGRACION] FASE 4.4: Hardening LESSONS...');
    await queryRunner.query(`ALTER TABLE lessons DROP FOREIGN KEY FK_35fb2307535d90a6ed290af1f4a`);
    await queryRunner.query(`ALTER TABLE lessons MODIFY module_id int NOT NULL`);
    await queryRunner.query(`ALTER TABLE lessons ADD CONSTRAINT FK_35fb2307535d90a6ed290af1f4a FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE`);

    console.log('[MIGRACION] FASE 4.5: Hardening ENROLLMENTS...');
    await queryRunner.query(`ALTER TABLE enrollments DROP FOREIGN KEY FK_ff997f5a39cd24a491b9aca45c9`);
    await queryRunner.query(`ALTER TABLE enrollments DROP FOREIGN KEY FK_b79d0bf01779fdf9cfb6b092af3`);
    await queryRunner.query(`ALTER TABLE enrollments MODIFY user_id int NOT NULL`);
    await queryRunner.query(`ALTER TABLE enrollments MODIFY course_id int NOT NULL`);
    await queryRunner.query(`ALTER TABLE enrollments ADD CONSTRAINT FK_ff997f5a39cd24a491b9aca45c9 FOREIGN KEY (user_id) REFERENCES users(id)`);
    await queryRunner.query(`ALTER TABLE enrollments ADD CONSTRAINT FK_b79d0bf01779fdf9cfb6b092af3 FOREIGN KEY (course_id) REFERENCES courses(id)`);

    console.log('[MIGRACION] FASE 4.6: Hardening LESSON_PROGRESS...');
    await queryRunner.query(`ALTER TABLE lesson_progress DROP FOREIGN KEY FK_0d9292b3eb40707950eeeba9617`);
    await queryRunner.query(`ALTER TABLE lesson_progress DROP FOREIGN KEY FK_980e74721039ebe210fee2eeca2`);
    await queryRunner.query(`ALTER TABLE lesson_progress MODIFY user_id int NOT NULL`);
    await queryRunner.query(`ALTER TABLE lesson_progress MODIFY lesson_id int NOT NULL`);
    await queryRunner.query(`ALTER TABLE lesson_progress ADD CONSTRAINT FK_0d9292b3eb40707950eeeba9617 FOREIGN KEY (user_id) REFERENCES users(id)`);
    await queryRunner.query(`ALTER TABLE lesson_progress ADD CONSTRAINT FK_980e74721039ebe210fee2eeca2 FOREIGN KEY (lesson_id) REFERENCES lessons(id)`);

    console.log('[MIGRACION] FASE 4.7: Hardening ATTEMPTS...');
    await queryRunner.query(`ALTER TABLE attempts DROP FOREIGN KEY FK_1f23e642cf6e009c61cc2c214e2`);
    await queryRunner.query(`ALTER TABLE attempts DROP FOREIGN KEY FK_249da279880fff0c23541e52515`);
    await queryRunner.query(`ALTER TABLE attempts MODIFY quiz_id int NOT NULL`);
    await queryRunner.query(`ALTER TABLE attempts MODIFY user_id int NOT NULL`);
    await queryRunner.query(`ALTER TABLE attempts ADD CONSTRAINT FK_1f23e642cf6e009c61cc2c214e2 FOREIGN KEY (user_id) REFERENCES users(id)`);
    await queryRunner.query(`ALTER TABLE attempts ADD CONSTRAINT FK_249da279880fff0c23541e52515 FOREIGN KEY (quiz_id) REFERENCES quizzes(id)`);

    console.log('[MIGRACION] FASE 4.8: Hardening ANSWERS...');
    await queryRunner.query(`ALTER TABLE answers DROP FOREIGN KEY FK_e600c136cef60f166f0b315ab19`);
    await queryRunner.query(`ALTER TABLE answers DROP FOREIGN KEY FK_677120094cf6d3f12df0b9dc5d3`);
    await queryRunner.query(`ALTER TABLE answers MODIFY attempt_id int NOT NULL`);
    await queryRunner.query(`ALTER TABLE answers MODIFY question_id int NOT NULL`);
    await queryRunner.query(`ALTER TABLE answers ADD CONSTRAINT FK_e600c136cef60f166f0b315ab19 FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE answers ADD CONSTRAINT FK_677120094cf6d3f12df0b9dc5d3 FOREIGN KEY (question_id) REFERENCES questions(id)`);

    console.log('[MIGRACION] FASE 4.9: Hardening QUESTIONS...');
    await queryRunner.query(`ALTER TABLE questions DROP FOREIGN KEY FK_46b3c125e02f7242662e4ccb307`);
    await queryRunner.query(`ALTER TABLE questions MODIFY quiz_id int NOT NULL`);
    await queryRunner.query(`ALTER TABLE questions ADD CONSTRAINT FK_46b3c125e02f7242662e4ccb307 FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE`);

    console.log('[MIGRACION] FASE 4.10: Hardening OPTIONS...');
    await queryRunner.query(`ALTER TABLE options DROP FOREIGN KEY FK_2bdd03245b8cb040130fe16f21d`);
    await queryRunner.query(`ALTER TABLE options MODIFY question_id int NOT NULL`);
    await queryRunner.query(`ALTER TABLE options ADD CONSTRAINT FK_2bdd03245b8cb040130fe16f21d FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE`);

    console.log('[MIGRACION] FASE 4.11: Hardening USER_POINTS...');
    await queryRunner.query(`ALTER TABLE user_points DROP FOREIGN KEY FK_b63a87a96091c755b78a75eecbc`);
    await queryRunner.query(`ALTER TABLE user_points DROP FOREIGN KEY FK_44f02f2ff7d0ae4bd9be9cd24cf`);
    await queryRunner.query(`ALTER TABLE user_points MODIFY user_id int NOT NULL`);
    await queryRunner.query(`ALTER TABLE user_points MODIFY course_id int NOT NULL`);
    await queryRunner.query(`ALTER TABLE user_points ADD CONSTRAINT FK_b63a87a96091c755b78a75eecbc FOREIGN KEY (user_id) REFERENCES users(id)`);
    await queryRunner.query(`ALTER TABLE user_points ADD CONSTRAINT FK_44f02f2ff7d0ae4bd9be9cd24cf FOREIGN KEY (course_id) REFERENCES courses(id)`);

    console.log('[MIGRACION] FASE 4: Hardening completado ✓');

    // ============================================================================
    // FASE 5: AGREGAR RESTRICCIONES UNIQUE
    // ============================================================================
    console.log('[MIGRACION] FASE 5: Agregando restricciones UNIQUE...');

    await queryRunner.query(`ALTER TABLE courses ADD UNIQUE INDEX UQ_courses_slug (slug)`);
    await queryRunner.query(`ALTER TABLE enrollments ADD UNIQUE INDEX UQ_enrollments_user_course (user_id, course_id)`);
    await queryRunner.query(`ALTER TABLE lesson_progress ADD UNIQUE INDEX UQ_lesson_progress_user_lesson (user_id, lesson_id)`);
    await queryRunner.query(`ALTER TABLE user_points ADD UNIQUE INDEX UQ_user_points_user_course (user_id, course_id)`);
    await queryRunner.query('ALTER TABLE course_modules ADD UNIQUE INDEX UQ_course_modules_course_index (course_id, `index`)');
    await queryRunner.query('ALTER TABLE lessons ADD UNIQUE INDEX UQ_lessons_module_index (module_id, `index`)');

    console.log('[MIGRACION] FASE 5: Restricciones UNIQUE agregadas ✓');

    // ============================================================================
    // FASE 6: VALIDACIONES DE RANGO Y FECHAS
    // ============================================================================
    console.log('[MIGRACION] FASE 6: Validaciones de rango y fechas...');

    console.log('[MIGRACION] FASE 6.1: Validar progress_pct en lesson_progress...');
    await queryRunner.query(`
      UPDATE lesson_progress
      SET progress_pct = 0
      WHERE progress_pct < 0
    `);

    await queryRunner.query(`
      UPDATE lesson_progress
      SET progress_pct = 100
      WHERE progress_pct > 100
    `);

    await queryRunner.query(`
      ALTER TABLE lesson_progress
      ADD CONSTRAINT chk_progress_pct_range CHECK (progress_pct >= 0 AND progress_pct <= 100)
    `);

    console.log('[MIGRACION] FASE 6.2: Validar end_at > start_at en live_classes...');
    await queryRunner.query(`
      DELETE FROM live_classes
      WHERE end_at IS NULL OR end_at <= start_at
    `);

    await queryRunner.query(`
      ALTER TABLE live_classes MODIFY end_at datetime NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE live_classes
      ADD CONSTRAINT chk_live_classes_dates CHECK (end_at > start_at)
    `);

    console.log('[MIGRACION] FASE 6.3: Validar end_at > start_at en cohorts...');
    await queryRunner.query(`
      DELETE FROM cohorts
      WHERE end_at IS NOT NULL AND end_at <= start_at
    `);

    await queryRunner.query(`
      ALTER TABLE cohorts
      ADD CONSTRAINT chk_cohorts_dates CHECK (end_at IS NULL OR end_at > start_at)
    `);

    console.log('[MIGRACION] FASE 6.4: Limpiar capacidades inválidas...');
    await queryRunner.query(`
      UPDATE live_classes
      SET capacity = NULL
      WHERE capacity IS NOT NULL AND capacity <= 0
    `);

    await queryRunner.query(`
      UPDATE cohorts
      SET capacity = NULL
      WHERE capacity IS NOT NULL AND capacity <= 0
    `);

    console.log('[MIGRACION] FASE 6: Validaciones completadas ✓');

    // ============================================================================
    // FASE 7: ESTANDARIZACIÓN DE NAMING (PLACEHOLDER)
    // ============================================================================
    console.log('[MIGRACION] FASE 7: Estandarización de naming...');
    console.log('[MIGRACION] FASE 7: Nota - renaming de index a position pospuesto para seguridad de FK');
    console.log('[MIGRACION] FASE 7: Estandarización completada ✓');

    // ============================================================================
    // FASE 8: AUDITORÍA Y SOFT DELETE
    // ============================================================================
    console.log('[MIGRACION] FASE 8: Agregando auditoría y soft delete...');

    console.log('[MIGRACION] FASE 8.1: Crear tabla subscriptions_logs...');
    await queryRunner.createTable(
      new Table({
        name: 'subscriptions_logs',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'created_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'subscription_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'price_monthly',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            isNullable: true,
            default: "'USD'",
          },
          {
            name: 'plan_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'CANCELLED', 'EXPIRED'],
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['subscription_id'],
            referencedTableName: 'subscriptions',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          {
            columnNames: ['subscription_id'],
          },
          {
            columnNames: ['created_at'],
          },
        ],
      }),
    );

    console.log('[MIGRACION] FASE 8.2: Agregar soft delete a users...');
    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN deleted_at datetime(6) NULL AFTER updated_at`,
    );

    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN status varchar(50) NOT NULL DEFAULT 'ACTIVE' AFTER deleted_at`,
    );

    await queryRunner.query(
      `ALTER TABLE users ADD INDEX idx_users_deleted_at (deleted_at)`,
    );

    await queryRunner.query(
      `ALTER TABLE users ADD INDEX idx_users_active (deleted_at, status)`,
    );

    console.log('[MIGRACION] FASE 8: Auditoría y soft delete completados ✓');

    // ============================================================================
    // FASE 9: TABLA DE ROLES
    // ============================================================================
    console.log('[MIGRACION] FASE 9: Creando tabla de roles...');

    console.log('[MIGRACION] FASE 9.1: Crear tabla roles...');
    await queryRunner.query(`
      CREATE TABLE \`roles\` (
        \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`code\` varchar(50) NOT NULL UNIQUE,
        \`name\` varchar(255) NOT NULL,
        \`description\` text,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX \`idx_roles_code\` (\`code\`)
      ) ENGINE=InnoDB
    `);

    console.log('[MIGRACION] FASE 9.2: Insertar roles iniciales...');
    await queryRunner.query(`
      INSERT INTO \`roles\` (\`code\`, \`name\`, \`description\`) VALUES
      ('ADMIN', 'Administrador', 'Acceso total al sistema, gestión de usuarios y configuración'),
      ('INSTRUCTOR', 'Instructor', 'Crear y gestionar cursos, lecciones y evaluaciones'),
      ('STUDENT', 'Estudiante', 'Acceso a cursos, lecciones e intentos de evaluaciones')
    `);

    console.log('[MIGRACION] FASE 9.3: Migrar role enum a role_id FK...');
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      ADD COLUMN \`role_id\` int NOT NULL DEFAULT 3 AFTER \`role\`
    `);

    await queryRunner.query(`
      UPDATE \`users\` u
      JOIN \`roles\` r ON (
        CASE 
          WHEN u.\`role\` = 'ADMIN' THEN r.\`code\` = 'ADMIN'
          WHEN u.\`role\` = 'INSTRUCTOR' THEN r.\`code\` = 'INSTRUCTOR'
          WHEN u.\`role\` = 'STUDENT' THEN r.\`code\` = 'STUDENT'
        END
      )
      SET u.\`role_id\` = r.\`id\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`users\`
      ADD CONSTRAINT \`FK_users_role_id\` 
      FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE \`users\`
      ADD INDEX \`idx_users_role_id\` (\`role_id\`)
    `);

    console.log('[MIGRACION] FASE 9.4: Eliminar columna role enum...');
    await queryRunner.query(`
      ALTER TABLE \`users\`
      DROP COLUMN \`role\`
    `);

    console.log('[MIGRACION] FASE 9: Tabla de roles completada ✓');

    console.log('[MIGRACION] ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE - TODAS LAS 9 FASES EJECUTADAS');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('[MIGRACION] Iniciando REVERSIÓN de cambios...');

    // ========================================
    // FASE 9 REVERT: Tabla de roles
    // ========================================
    console.log('[REVERSIÓN] FASE 9: Revirtiendo tabla de roles...');
    await queryRunner.query(`
      ALTER TABLE \`users\`
      DROP FOREIGN KEY \`FK_users_role_id\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`users\`
      DROP INDEX \`idx_users_role_id\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`users\`
      ADD COLUMN \`role\` enum('ADMIN','INSTRUCTOR','STUDENT') NOT NULL DEFAULT 'STUDENT' AFTER \`avatar_url\`
    `);
    await queryRunner.query(`
      UPDATE \`users\` u
      JOIN \`roles\` r ON u.\`role_id\` = r.\`id\`
      SET u.\`role\` = r.\`code\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`users\`
      DROP COLUMN \`role_id\`
    `);
    await queryRunner.dropTable('roles');

    // ========================================
    // FASE 8 REVERT: Auditoría y soft delete
    // ========================================
    console.log('[REVERSIÓN] FASE 8: Revirtiendo auditoría y soft delete...');
    await queryRunner.query(`ALTER TABLE users DROP INDEX idx_users_active`);
    await queryRunner.query(`ALTER TABLE users DROP INDEX idx_users_deleted_at`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN status`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN deleted_at`);
    await queryRunner.dropTable('subscriptions_logs');

    // ========================================
    // FASE 7 REVERT: Estandarización (no-op)
    // ========================================
    console.log('[REVERSIÓN] FASE 7: Revirtiendo estandarización (no-op)...');
    // Placeholder - sin cambios

    // ========================================
    // FASE 6 REVERT: Validaciones
    // ========================================
    console.log('[REVERSIÓN] FASE 6: Revirtiendo validaciones...');
    await queryRunner.query(`ALTER TABLE cohorts DROP CONSTRAINT chk_cohorts_dates`);
    await queryRunner.query(`ALTER TABLE live_classes DROP CONSTRAINT chk_live_classes_dates`);
    await queryRunner.query(`ALTER TABLE lesson_progress DROP CONSTRAINT chk_progress_pct_range`);
    await queryRunner.query(`
      ALTER TABLE live_classes MODIFY end_at datetime NULL
    `);

    // ========================================
    // FASE 5 REVERT: UNIQUE constraints
    // ========================================
    console.log('[REVERSIÓN] FASE 5: Revirtiendo UNIQUE constraints...');
    await queryRunner.query(`ALTER TABLE lessons DROP INDEX UQ_lessons_module_index`);
    await queryRunner.query(`ALTER TABLE course_modules DROP INDEX UQ_course_modules_course_index`);
    await queryRunner.query(`ALTER TABLE user_points DROP INDEX UQ_user_points_user_course`);
    await queryRunner.query(`ALTER TABLE lesson_progress DROP INDEX UQ_lesson_progress_user_lesson`);
    await queryRunner.query(`ALTER TABLE enrollments DROP INDEX UQ_enrollments_user_course`);
    await queryRunner.query(`ALTER TABLE courses DROP INDEX UQ_courses_slug`);

    // ========================================
    // FASE 4 REVERT: Hardening FKs
    // ========================================
    console.log('[REVERSIÓN] FASE 4: Revirtiendo hardening de FKs...');
    await queryRunner.query(`ALTER TABLE lessons DROP FOREIGN KEY FK_35fb2307535d90a6ed290af1f4a`);
    await queryRunner.query(`ALTER TABLE course_modules DROP FOREIGN KEY FK_81644557c2401f37fe9e884e884`);
    await queryRunner.query(`ALTER TABLE enrollments DROP FOREIGN KEY FK_ff997f5a39cd24a491b9aca45c9`);
    await queryRunner.query(`ALTER TABLE enrollments DROP FOREIGN KEY FK_b79d0bf01779fdf9cfb6b092af3`);
    await queryRunner.query(`ALTER TABLE lesson_progress DROP FOREIGN KEY FK_0d9292b3eb40707950eeeba9617`);
    await queryRunner.query(`ALTER TABLE lesson_progress DROP FOREIGN KEY FK_980e74721039ebe210fee2eeca2`);
    await queryRunner.query(`ALTER TABLE user_points DROP FOREIGN KEY FK_b63a87a96091c755b78a75eecbc`);
    await queryRunner.query(`ALTER TABLE user_points DROP FOREIGN KEY FK_44f02f2ff7d0ae4bd9be9cd24cf`);

    await queryRunner.query(`ALTER TABLE subscriptions MODIFY user_id int NULL`);
    await queryRunner.query(`ALTER TABLE subscriptions MODIFY plan_id int NULL`);
    await queryRunner.query(`ALTER TABLE courses MODIFY owner_id int NULL`);
    await queryRunner.query(`ALTER TABLE courses MODIFY slug varchar(255) NULL`);
    await queryRunner.query(`ALTER TABLE course_modules MODIFY course_id int NULL`);
    await queryRunner.query(`ALTER TABLE lessons MODIFY module_id int NULL`);
    await queryRunner.query(`ALTER TABLE enrollments MODIFY user_id int NULL`);
    await queryRunner.query(`ALTER TABLE enrollments MODIFY course_id int NULL`);
    await queryRunner.query(`ALTER TABLE lesson_progress MODIFY user_id int NULL`);
    await queryRunner.query(`ALTER TABLE lesson_progress MODIFY lesson_id int NULL`);
    await queryRunner.query(`ALTER TABLE attempts MODIFY quiz_id int NULL`);
    await queryRunner.query(`ALTER TABLE attempts MODIFY user_id int NULL`);
    await queryRunner.query(`ALTER TABLE answers MODIFY attempt_id int NULL`);
    await queryRunner.query(`ALTER TABLE answers MODIFY question_id int NULL`);
    await queryRunner.query(`ALTER TABLE questions MODIFY quiz_id int NULL`);
    await queryRunner.query(`ALTER TABLE options MODIFY question_id int NULL`);
    await queryRunner.query(`ALTER TABLE user_points MODIFY user_id int NULL`);
    await queryRunner.query(`ALTER TABLE user_points MODIFY course_id int NULL`);

    await queryRunner.query(`ALTER TABLE course_modules ADD CONSTRAINT FK_81644557c2401f37fe9e884e884 FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE lessons ADD CONSTRAINT FK_35fb2307535d90a6ed290af1f4a FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE enrollments ADD CONSTRAINT FK_ff997f5a39cd24a491b9aca45c9 FOREIGN KEY (user_id) REFERENCES users(id)`);
    await queryRunner.query(`ALTER TABLE enrollments ADD CONSTRAINT FK_b79d0bf01779fdf9cfb6b092af3 FOREIGN KEY (course_id) REFERENCES courses(id)`);
    await queryRunner.query(`ALTER TABLE lesson_progress ADD CONSTRAINT FK_0d9292b3eb40707950eeeba9617 FOREIGN KEY (user_id) REFERENCES users(id)`);
    await queryRunner.query(`ALTER TABLE lesson_progress ADD CONSTRAINT FK_980e74721039ebe210fee2eeca2 FOREIGN KEY (lesson_id) REFERENCES lessons(id)`);
    await queryRunner.query(`ALTER TABLE user_points ADD CONSTRAINT FK_b63a87a96091c755b78a75eecbc FOREIGN KEY (user_id) REFERENCES users(id)`);
    await queryRunner.query(`ALTER TABLE user_points ADD CONSTRAINT FK_44f02f2ff7d0ae4bd9be9cd24cf FOREIGN KEY (course_id) REFERENCES courses(id)`);

    // ========================================
    // FASE 3 REVERT: Normalización (no-op)
    // ========================================
    console.log('[REVERSIÓN] FASE 3: Revirtiendo normalización (no-op)...');

    // ========================================
    // FASE 2 REVERT: Deduplicación (no-op)
    // ========================================
    console.log('[REVERSIÓN] FASE 2: Revirtiendo deduplicación (no-op)...');

    // ========================================
    // FASE 1 REVERT: Limpieza (no-op)
    // ========================================
    console.log('[REVERSIÓN] FASE 1: Revirtiendo limpieza (no-op)...');

    console.log('[MIGRACION] ✅ REVERSIÓN COMPLETADA EXITOSAMENTE');
  }
}
