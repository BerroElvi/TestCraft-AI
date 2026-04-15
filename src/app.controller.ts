import { Controller, Get, Query } from '@nestjs/common';
import { TestGeneratorService, TestCase } from './domain/service/test-generator.service';

@Controller('tests') // La URL será: http://localhost:3000/tests
export class AppController {
  constructor(private readonly testGenerator: TestGeneratorService) {}

  @Get('generate') // El endpoint será: /generate
  generateTests(@Query('requirement') requirement: string): TestCase[] {
    if (!requirement) {
      return []; // Podríamos lanzar un error, pero por ahora devolvemos vacío si no hay texto
    }
    return this.testGenerator.generateFromRequirement(requirement);
  }
}