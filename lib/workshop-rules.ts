import projects from "@/data/inventor-projects.json";

export function kineticShieldProfile(stage: string) {
  const step = Math.max(
    1,
    projects.stages.findIndex((profile) => profile.stage === stage) + 1,
  );
  const armor = 12 + step;
  return {
    armor,
    partial: Math.floor(armor / 2),
    life: 6 + 2 * step,
    protection: 10 + 3 * step,
  };
}

export function workshopProfile(stage: string) {
  return (
    projects.stages.find((profile) => profile.stage === stage) ?? {
      ...projects.stages[0],
      stage: "Criação",
      prepared: 1,
    }
  );
}
