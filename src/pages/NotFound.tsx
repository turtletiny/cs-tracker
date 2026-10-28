import { Link } from "react-router";

export function NotFound({ what = "page" }: { what?: string }) {
  return (
    <div className="stack" style={{ maxWidth: "40rem" }}>
      <span className="hand" style={{ color: "var(--pencil-red)", fontSize: "2rem" }}>
        hmm.
      </span>
      <h1 style={{ fontSize: "var(--step-3)" }}>This {what} isn’t in the notebook.</h1>
      <p className="lede">It may have been deleted, or the link is out of date.</p>
      <div className="row">
        <Link className="btn btn--primary" to="/">
          Back to the roadmaps
        </Link>
        <Link className="btn" to="/books">
          Book log
        </Link>
      </div>
    </div>
  );
}
