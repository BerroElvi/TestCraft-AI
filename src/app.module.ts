import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// 1. Importamos el nuevo servicio (fíjate en la ruta exacta)
import { TestGeneratorService } from './domain/service/test-generator.service';

@Module({
  imports: [],
  controllers: [AppController],
  // 2. Agregamos TestGeneratorService a la lista de providers
  providers: [AppService, TestGeneratorService], 
})
export class AppModule {}