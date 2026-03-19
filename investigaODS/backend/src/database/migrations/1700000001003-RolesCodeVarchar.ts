import { MigrationInterface, QueryRunner } from 'typeorm';

export class RolesCodeVarchar1700000001003 implements MigrationInterface {
  name = 'RolesCodeVarchar1700000001003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasRoles = await queryRunner.hasTable('roles');
    if (!hasRoles) {
      return;
    }

    const rolesCodeColumn = await queryRunner.query(`
      SELECT DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'roles'
        AND COLUMN_NAME = 'code'
      LIMIT 1
    `);

    if (rolesCodeColumn.length > 0 && rolesCodeColumn[0].DATA_TYPE === 'enum') {
      await queryRunner.query(`ALTER TABLE roles MODIFY code varchar(50) NOT NULL`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasRoles = await queryRunner.hasTable('roles');
    if (!hasRoles) {
      return;
    }

    const invalidCodes = await queryRunner.query(`
      SELECT code
      FROM roles
      WHERE code NOT IN ('STUDENT','INSTRUCTOR','ADMIN')
      LIMIT 1
    `);

    if (invalidCodes.length > 0) {
      return;
    }

    const rolesCodeColumn = await queryRunner.query(`
      SELECT DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'roles'
        AND COLUMN_NAME = 'code'
      LIMIT 1
    `);

    if (rolesCodeColumn.length > 0 && rolesCodeColumn[0].DATA_TYPE !== 'enum') {
      await queryRunner.query(
        `ALTER TABLE roles MODIFY code enum('STUDENT','INSTRUCTOR','ADMIN') NOT NULL`,
      );
    }
  }
}
