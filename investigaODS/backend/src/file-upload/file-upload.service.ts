import { Injectable, BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadService {

  getMulterOptions(): MulterOptions {
    return {
      storage: diskStorage({
        destination: './uploads',

        // Nombre que tendrá el archivo al guardarse
        // Usamos UUID para que cada archivo tenga un nombre único
        // Ejemplo: "a3f2c1d4-uuid.jpg"
        filename: (
          _req: Express.Request,
          file: Express.Multer.File,
          callback: (error: Error | null, filename: string) => void,
        ) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),

      // Validación: aceptamos imágenes, PDFs y videos
      fileFilter: (
        _req: Express.Request,
        file: Express.Multer.File,
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|webp|mp4|mov|avi|webm|mkv/;
        const isValidExt = allowedTypes.test(extname(file.originalname).toLowerCase());
        const isValidMime = /image|pdf|video/.test(file.mimetype);

        if (isValidExt && isValidMime) {
          callback(null, true);
        } else {
          callback(new BadRequestException(
            'Solo se permiten imágenes (jpg, png, gif, webp), PDFs y videos (mp4, mov, avi, webm, mkv)',
          ), false);
        }
      },

      // Límite de tamaño:
      // - Imágenes/PDF: hasta 5 MB
      // - Videos: hasta 500 MB (los videos de clases pueden ser grandes)
      limits: {
        fileSize: 500 * 1024 * 1024, // 500 MB en bytes
      },
    };
  }

  /**
   * Construye y devuelve la URL pública del archivo subido.
   * Ejemplo: "http://localhost:3000/api/files/a3f2c1d4-uuid.jpg"
   */
  getFileUrl(filename: string, baseUrl?: string): string {
    if (!baseUrl) {
      return `/api/files/${filename}`;
    }
    return `${baseUrl}/api/files/${filename}`;
  }
}
