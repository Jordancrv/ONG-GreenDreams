import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FileUploadController } from './file-upload.controller';
import { FileUploadService } from './file-upload.service';

@Module({
  imports: [
    // MulterModule registra Multer en este módulo
    // Lo dejamos vacío aquí porque la configuración
    // la pasamos directamente en el controlador con FileInterceptor
    MulterModule.register({}),
  ],
  controllers: [FileUploadController], // ← los endpoints
  providers: [FileUploadService],      // ← la lógica
})
export class FileUploadModule {}
