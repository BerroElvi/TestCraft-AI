import { Injectable } from '@nestjs/common';

export interface TestCase {
  title: string;
  steps: { action: string; expected: string }[];
  priority: 'High' | 'Medium' | 'Low';
  type: 'Positive' | 'Negative' | 'Boundary';
}

@Injectable()
export class TestGeneratorService {
  generateFromRequirement(requirement: string): TestCase[] {
    const requirementLower = requirement.toLowerCase();
    
    // Simulación de lógica de IA para generar casos basados en el requerimiento
    const cases: TestCase[] = [
      {
        title: `Verificar flujo exitoso de ${requirementLower}`,
        type: 'Positive',
        priority: 'High',
        steps: [
          { action: `Ingresar datos válidos en ${requirementLower}`, expected: 'El sistema acepta los datos' },
          { action: 'Presionar el botón de enviar', expected: 'Operación exitosa' }
        ]
      },
      {
        title: `Validar campos obligatorios en ${requirementLower}`,
        type: 'Negative',
        priority: 'Medium',
        steps: [
          { action: `Dejar campos vacíos en ${requirementLower}`, expected: 'El sistema muestra mensaje de error' }
        ]
      },
      {
        title: `Prueba de límites de caracteres en ${requirementLower}`,
        type: 'Boundary',
        priority: 'Low',
        steps: [
          { action: 'Ingresar 255 caracteres', expected: 'El sistema trunca o valida el límite' }
        ]
      }
    ];

    return cases;
  }
}