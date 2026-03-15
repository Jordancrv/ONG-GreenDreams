import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1699999999999 implements MigrationInterface {
  name = 'InitialSchema1699999999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Build base schema from current entities so next migrations run against real tables.
    await queryRunner.connection.synchronize();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.clearDatabase();
  }
}
