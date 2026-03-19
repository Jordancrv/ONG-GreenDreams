import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class RolesTableMigration1700000001002 implements MigrationInterface {
  name = 'RolesTableMigration1700000001002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasRolesTable = await queryRunner.hasTable('roles');

    if (!hasRolesTable) {
      await queryRunner.createTable(
        new Table({
          name: 'roles',
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
              name: 'updated_at',
              type: 'datetime',
              precision: 6,
              default: 'CURRENT_TIMESTAMP(6)',
              onUpdate: 'CURRENT_TIMESTAMP(6)',
            },
            {
              name: 'code',
              type: 'enum',
              enum: ['STUDENT', 'INSTRUCTOR', 'ADMIN'],
              isUnique: true,
            },
            {
              name: 'name',
              type: 'varchar',
              length: '100',
            },
          ],
        }),
      );
    }

    await queryRunner.query(`
      INSERT INTO roles (code, name)
      SELECT 'STUDENT', 'Student'
      FROM DUAL
      WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'STUDENT')
    `);
    await queryRunner.query(`
      INSERT INTO roles (code, name)
      SELECT 'INSTRUCTOR', 'Instructor'
      FROM DUAL
      WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'INSTRUCTOR')
    `);
    await queryRunner.query(`
      INSERT INTO roles (code, name)
      SELECT 'ADMIN', 'Admin'
      FROM DUAL
      WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'ADMIN')
    `);

    const hasRoleId = await queryRunner.hasColumn('users', 'role_id');
    const hasRoleEnum = await queryRunner.hasColumn('users', 'role');

    if (!hasRoleId) {
      await queryRunner.query(`ALTER TABLE users ADD COLUMN role_id int NULL`);
    }

    if (hasRoleEnum) {
      await queryRunner.query(`
        UPDATE users u
        JOIN roles r ON r.code = u.role
        SET u.role_id = r.id
        WHERE u.role_id IS NULL
      `);
    }

    await queryRunner.query(`
      UPDATE users u
      JOIN roles r ON r.code = 'STUDENT'
      SET u.role_id = r.id
      WHERE u.role_id IS NULL
    `);

    await queryRunner.query(`ALTER TABLE users MODIFY role_id int NOT NULL`);

    const hasRoleIdIndex = await queryRunner.query(`
      SELECT 1
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND INDEX_NAME = 'idx_users_role_id'
      LIMIT 1
    `);

    if (hasRoleIdIndex.length === 0) {
      await queryRunner.query(`ALTER TABLE users ADD INDEX idx_users_role_id (role_id)`);
    }

    const hasRoleFk = await queryRunner.query(`
      SELECT 1
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND CONSTRAINT_NAME = 'FK_users_role_id'
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      LIMIT 1
    `);

    if (hasRoleFk.length === 0) {
      await queryRunner.query(`
        ALTER TABLE users
        ADD CONSTRAINT FK_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id)
      `);
    }

    const hasRoleEnumAfter = await queryRunner.hasColumn('users', 'role');
    if (hasRoleEnumAfter) {
      await queryRunner.query(`ALTER TABLE users DROP COLUMN role`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasRoleEnum = await queryRunner.hasColumn('users', 'role');

    if (!hasRoleEnum) {
      await queryRunner.query(`
        ALTER TABLE users
        ADD COLUMN role enum('STUDENT','INSTRUCTOR','ADMIN') NOT NULL DEFAULT 'STUDENT'
      `);
    }

    const hasRoleId = await queryRunner.hasColumn('users', 'role_id');
    if (hasRoleId) {
      await queryRunner.query(`
        UPDATE users u
        JOIN roles r ON r.id = u.role_id
        SET u.role = r.code
      `);

      const hasRoleFk = await queryRunner.query(`
        SELECT 1
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND CONSTRAINT_NAME = 'FK_users_role_id'
          AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        LIMIT 1
      `);

      if (hasRoleFk.length > 0) {
        await queryRunner.query(`ALTER TABLE users DROP FOREIGN KEY FK_users_role_id`);
      }

      const hasRoleIdIndex = await queryRunner.query(`
        SELECT 1
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND INDEX_NAME = 'idx_users_role_id'
        LIMIT 1
      `);

      if (hasRoleIdIndex.length > 0) {
        await queryRunner.query(`ALTER TABLE users DROP INDEX idx_users_role_id`);
      }

      await queryRunner.query(`ALTER TABLE users DROP COLUMN role_id`);
    }

    const hasRolesTable = await queryRunner.hasTable('roles');
    if (hasRolesTable) {
      await queryRunner.dropTable('roles');
    }
  }
}
