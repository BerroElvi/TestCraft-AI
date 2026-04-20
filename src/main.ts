import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ¡ESTA LÍNEA ES CLAVE! Sin esto, React no puede hablar con NestJS
  app.enableCors(); 
  
  await app.listen(3000);
}
bootstrap();