import projects from "@/data/inventor-projects.json";

export function workshopProfile(stage: string) {
  return projects.stages.find(profile => profile.stage === stage) ?? { ...projects.stages[0], stage: "Criação", prepared: 1 };
}
