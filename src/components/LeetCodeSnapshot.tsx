import { Link } from "react-router";
import { NEETCODE_150, TOPICS } from "../data/neetcode";
import { useStore } from "../store";
import { ProgressBar } from "./ProgressBar";

export function LeetCodeSnapshot() {
  const attempts = useStore((s) => s.attempts);
  const learnt = useStore((s) => s.learntTopics);
  const solved = new Set(attempts.filter((a) => a.rating !== "failed").map((a) => a.problemId));
  const neetSolved = NEETCODE_150.filter((p) => solved.has(p.id)).length;
  const weekAgo = Date.now() - 7 * 86_400_000;
  const thisWeek = attempts.filter((a) => new Date(a.at).getTime() >= weekAgo).length;

  return (
    <section aria-labelledby="lc-h" className="stack-s">
      <div className="section-head">
        <h2 id="lc-h">LeetCode</h2>
        <Link className="btn btn--sm" to="/leetcode">
          Draw a problem →
        </Link>
      </div>
      <div className="lc-snapshot">
        <div>
          <p className="big-figure num">
            {neetSolved}
            <small> / {NEETCODE_150.length}</small>
          </p>
          <span className="small muted">NeetCode 150 solved</span>
        </div>
        <div>
          <p className="big-figure num">
            {learnt.length}
            <small> / {TOPICS.length}</small>
          </p>
          <span className="small muted">topics learnt</span>
        </div>
        <div>
          <p className="big-figure num">{thisWeek}</p>
          <span className="small muted">attempts this week</span>
        </div>
      </div>
      <ProgressBar value={neetSolved / NEETCODE_150.length} label="NeetCode 150 progress" />
    </section>
  );
}
