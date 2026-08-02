import { describe, it, expect } from 'vitest';
import { evaluateBodyCompositionProgress, generateProgram } from './prescriptionEngine';
import { Client } from '../types';

describe('prescriptionEngine', () => {
  it('should detect stagnated lean mass if adherence is high and gains are low', () => {
    const mockClient = {
      id: '123',
      name: 'Test Client',
      gender: 'Feminino',
      level: 'Intermediário',
      goal: 'Ganho de massa (hipertrofia)',
      eq: 'Academia completa',
      days: '4',
      bodyCompositionHistory: [
        { date: '2023-01-01T00:00:00Z', leanMassKg: 50, fatMassKg: 15, bodyFatPct: 20, weightKg: 65, adherenceRatePct: 90 },
        { date: '2023-02-01T00:00:00Z', leanMassKg: 50.1, fatMassKg: 14.5, bodyFatPct: 19.5, weightKg: 64.6, adherenceRatePct: 90 }
      ]
    } as unknown as Client;

    const result = evaluateBodyCompositionProgress(mockClient);
    expect(result.stagnatedLeanMass).toBe(true);
    expect(result.recommendationType).toBe('increase_volume');
    expect(result.volumeAdjustmentPct).toBe(15);
  });

  it('should return maintain if only 1 bioimpedance history exists', () => {
    const mockClient = {
      id: '123',
      name: 'Test Client',
      gender: 'Feminino',
      level: 'Intermediário',
      goal: 'Ganho de massa (hipertrofia)',
      eq: 'Academia completa',
      days: '4',
      bodyCompositionHistory: [
        { date: '2023-01-01T00:00:00Z', leanMassKg: 50, fatMassKg: 15, bodyFatPct: 20, weightKg: 65, adherenceRatePct: 90 }
      ]
    } as unknown as Client;

    const result = evaluateBodyCompositionProgress(mockClient);
    expect(result.stagnatedLeanMass).toBe(false);
    expect(result.recommendationType).toBe('maintain');
    expect(result.volumeAdjustmentPct).toBe(0);
  });

  it('should generate a valid program for a given client', () => {
    const mockClient = {
      id: '123',
      name: 'Test Client',
      gender: 'Masculino',
      level: 'Iniciante',
      goal: 'Força',
      eq: 'Peso do corpo',
      days: '3',
      parq: { 0: 'nao', 1: 'nao', 2: 'nao', 3: 'nao', 4: 'nao', 5: 'nao', 6: 'nao' },
      diseases: [],
    } as unknown as Client;

    const result = generateProgram(mockClient);
    expect(result).toBeDefined();
    expect(result.days.length).toBeGreaterThan(0);
    expect(result.days[0].exercises.length).toBeGreaterThan(0);
  });
});
