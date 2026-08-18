import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      /**
       * Los mensajes de validación se le muestran TAL CUAL al usuario en el
       * frontend (`api()` toma el primero del arreglo). Por defecto, en un DTO
       * anidado Nest le pega la ruta del campo delante y sale algo como
       * "items.0.Cada renglón de la receta necesita el medicamento".
       *
       * Esto aplana los errores y devuelve solo el texto, que ya viene escrito
       * en español y nombrando el campo desde el propio DTO.
       */
      exceptionFactory: (errors) => {
        const mensajes: string[] = [];
        const recorrer = (lista: typeof errors) => {
          for (const e of lista) {
            if (e.constraints) mensajes.push(...Object.values(e.constraints));
            if (e.children?.length) recorrer(e.children);
          }
        };
        recorrer(errors);
        return new BadRequestException(
          mensajes.length > 0 ? mensajes : ['Los datos enviados no son válidos'],
        );
      },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('TurnoMedico API')
    .setDescription('API para gestión de turnos médicos en República Dominicana')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🏥 TurnoMedico API running on port ${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
