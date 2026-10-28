export function ThreatLink({ region }: { region: string }) {
  return <a className="gaeria-entry" href={`/bestiario/ameacas?regiao=${region}`}><small>ETAPAS I–IV</small><h4>Monstros e ameaças de rota</h4><p>Cinco fichas da região, com recursos, ataques, traços e técnicas para consulta em mesa.</p><span>Consultar ameaças →</span></a>;
}
