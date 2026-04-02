import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FileUploadService } from './file-upload.service';

@ApiTags('Files')
@Controller('files')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  /**
   * POST /api/files/upload
   * Endpoint PROTEGIDO: solo usuarios autenticados pueden subir archivos.
   * Se requiere enviar el archivo en un campo llamado "file" (form-data).
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard) // ← Protección: necesitas el accessToken
  @ApiBearerAuth()         // ← Le dice a Swagger que este endpoint pide Bearer token
  @ApiConsumes('multipart/form-data') // ← Le dice a Swagger que acepta archivos
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' }, // el campo se llama "file"
      },
    },
  })
  @UseInterceptors(
    // FileInterceptor intercepta la petición y extrae el archivo del campo "file"
    FileInterceptor('file', (() => {
      const service = new FileUploadService();
      return service.getMulterOptions();
    })()),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    // Si no se envió ningún archivo, lanzamos un error
    if (!file) {
      throw new BadRequestException('No se envió ningún archivo');
    }

    // Construimos la URL pública del archivo
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = this.fileUploadService.getFileUrl(file.filename, baseUrl);

    // Devolvemos la información del archivo subido
    return {
      message: 'Archivo subido correctamente',
      filename: file.filename,       // nombre único generado (uuid)
      originalname: file.originalname, // nombre original del archivo
      mimetype: file.mimetype,       // tipo del archivo (image/jpeg, video/mp4, etc.)
      size: file.size,               // tamaño en bytes
      url,                           // URL para acceder al archivo
    };
  }

  /**
   * GET /api/files/:filename
   * Endpoint PÚBLICO: cualquiera puede ver o descargar un archivo.
   * Ejemplo: GET /api/files/a3f2c1d4-uuid.mp4
   */
  @Get(':filename')
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    // Construimos la ruta física del archivo en el servidor
    const filePath = join(process.cwd(), 'uploads', filename);

    // Verificamos que el archivo exista
    if (!existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    // Enviamos el archivo al cliente
    return res.sendFile(filePath);
  }
}
