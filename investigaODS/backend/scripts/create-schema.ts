import 'reflect-metadata';
import AppDataSource from '../src/database/data-source';

async function createSchema() {
  try {
    console.log('Inicializando conexión a BD...');
    await AppDataSource.initialize();
    
    console.log('Sincronizando esquema...');
    await AppDataSource.synchronize(true);
    
    console.log('✅ Esquema creado exitosamente');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error al crear esquema:', error);
    process.exit(1);
  }
}

createSchema();
