import eggData from "@/data/eggs.json";

export type EggConfig = {
  id: number;
  nestId: number;
  name: string;
};

export const eggs = eggData as EggConfig[];

export function getEggById(id: number) {
  return eggs.find((e) => e.id === id);
}

export function isValidEgg(id: number): boolean {
  return eggs.some((e) => e.id === id);
}
