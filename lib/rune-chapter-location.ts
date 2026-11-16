export function legacyCursedRuneDestination(hash: string) {
  return hash === "#runas-amaldicoadas" || hash.startsWith("#cursed-")
    ? `/regras/14-corrupcao-e-a-marca${hash}`
    : undefined;
}
