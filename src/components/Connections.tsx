import { useMemo } from "react";
import { Link } from "react-router";
import { CONNECTIONS } from "../data/pillars";
import { usePillarList } from "../lib/pillars";
import { useSkills } from "../lib/skills";
import { useStore } from "../store";
import type { PillarId } from "../types";
import { Medallion } from "./Pips";

export function Connections({ pillarId }: { pillarId: PillarId }) {
  const skills = useSkills();
  const pillars = useStore((s) => s.pillars);
  const list = usePillarList();
  const incoming = useMemo(
    () =>
      list
        .filter((p) => p.id !== pillarId)
        .flatMap((p) => p.rungs.filter((r) => r.related.includes(pillarId)).map((rung) => ({ pillarId: p.id, rung }))),
    [list, pillarId],
  );

  const links = CONNECTIONS.filter((c) => c.a === pillarId || c.b === pillarId)
    .map((c) => ({ other: c.a === pillarId ? c.b : c.a, why: c.why }))
    .filter((l) => pillars[l.other] && skills[l.other]);

  return (
    <section aria-labelledby="conn-h" className="stack-s">
      <div className="section-head">
        <h2 id="conn-h">Connections</h2>
        <span className="small muted">Where this skill meets the others</span>
      </div>
      {links.length === 0 && incoming.length === 0 && (
        <p className="small muted">
          Not linked to anything yet. Tag a resource here or in another pillar with “Also builds” to connect them on
          the web.
        </p>
      )}
      <ul className="connections">
        {links.map((l) => (
          <li key={l.other}>
            <Link to={`/pillar/${l.other}`} className="connection">
              <Medallion steps={skills[l.other]!.steps} level={skills[l.other]!.level} />
              <span className="stack-s" style={{ gap: 0 }}>
                <strong>{pillars[l.other]!.short}</strong>
                <span className="small muted">{l.why}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {incoming.length > 0 && (
        <div className="stack-s" style={{ marginTop: "var(--space-s)" }}>
          <span className="note__label">steps elsewhere that build this</span>
          <ul className="incoming">
            {incoming.map(({ pillarId: from, rung }) => (
              <li key={rung.id} data-done={!!rung.doneAt}>
                <Link to={`/pillar/${from}`} className="tag">
                  {pillars[from]?.short}
                </Link>
                <span>{rung.label}</span>
                {rung.doneAt && <span className="small muted">done</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
