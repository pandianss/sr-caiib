/** Exact-match curriculum lookups. Ancestry is resolved through catalogue membership, never string prefixes. */
import type { CurriculumCatalogue, ModuleId, ObjectiveId, PaperId, UnitId } from '../types/contracts.ts';

export type CatModule = CurriculumCatalogue['modules'][number];
export type CatUnit = CurriculumCatalogue['units'][number];
export type CatObjective = CurriculumCatalogue['objectives'][number];

export interface CatalogueIndex {
  catalogue: CurriculumCatalogue;
  modulesOf(paper: PaperId): CatModule[];
  unitsOf(moduleId: ModuleId): CatUnit[];
  objectivesOf(unitId: UnitId): CatObjective[];
  module(id: string): CatModule | undefined;
  unit(id: string): CatUnit | undefined;
  objective(id: string): CatObjective | undefined;
  moduleOfObjective(id: string): CatModule | undefined;
  unitOfObjective(id: string): CatUnit | undefined;
  paperOfObjective(id: string): PaperId | undefined;
  objectivesOfPaper(paper: PaperId): CatObjective[];
  unitsOfPaper(paper: PaperId): CatUnit[];
}

export function indexCatalogue(catalogue: CurriculumCatalogue): CatalogueIndex {
  const modules = new Map(catalogue.modules.map(m => [m.id as string, m]));
  const units = new Map(catalogue.units.map(u => [u.id as string, u]));
  const objectives = new Map(catalogue.objectives.map(o => [o.id as string, o]));
  const byPaper = new Map<PaperId, CatModule[]>();
  for (const m of catalogue.modules) byPaper.set(m.paper_id, [...(byPaper.get(m.paper_id) ?? []), m]);
  const unitsByModule = new Map<string, CatUnit[]>();
  for (const u of catalogue.units) unitsByModule.set(u.module_id, [...(unitsByModule.get(u.module_id) ?? []), u]);
  const objectivesByUnit = new Map<string, CatObjective[]>();
  for (const o of catalogue.objectives) objectivesByUnit.set(o.unit_id, [...(objectivesByUnit.get(o.unit_id) ?? []), o]);
  const unitOfObjective = (id: string) => { const o = objectives.get(id); return o ? units.get(o.unit_id) : undefined; };
  const moduleOfObjective = (id: string) => { const u = unitOfObjective(id); return u ? modules.get(u.module_id) : undefined; };
  const modulesOf = (paper: PaperId) => byPaper.get(paper) ?? [];
  const unitsOfPaper = (paper: PaperId) => modulesOf(paper).flatMap(m => unitsByModule.get(m.id) ?? []);
  return {
    catalogue,
    modulesOf,
    unitsOf: id => unitsByModule.get(id) ?? [],
    objectivesOf: id => objectivesByUnit.get(id) ?? [],
    module: id => modules.get(id),
    unit: id => units.get(id),
    objective: id => objectives.get(id),
    moduleOfObjective,
    unitOfObjective,
    paperOfObjective: id => moduleOfObjective(id)?.paper_id,
    objectivesOfPaper: paper => unitsOfPaper(paper).flatMap(u => objectivesByUnit.get(u.id) ?? []),
    unitsOfPaper,
  };
}

export const PAPER_NAMES: Record<PaperId, string> = {
  ABM: 'Advanced Bank Management',
  BFM: 'Bank Financial Management',
  ABFM: 'Advanced Business & Financial Management',
  BRBL: 'Banking Regulations and Business Laws',
  CB: 'Central Banking',
  RM: 'Risk Management',
  ITDB: 'Information Technology & Digital Banking',
  HRM: 'Human Resources Management',
  RB: 'Rural Banking',
};
export const COMPULSORY_PAPERS: readonly PaperId[] = ['ABM', 'BFM', 'ABFM', 'BRBL'];
export const ELECTIVE_PAPERS: readonly PaperId[] = ['CB', 'RM', 'ITDB', 'HRM', 'RB'];
export const isElective = (p: PaperId): boolean => ELECTIVE_PAPERS.includes(p);
export type { ObjectiveId };
