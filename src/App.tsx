import { useEffect, useRef } from "react";
import { BrowserRouter, Link, NavLink, Outlet, Route, Routes, useLocation } from "react-router";
import { ConfirmButton } from "./components/ConfirmButton";
import { Toast, useToast } from "./components/Toast";
import { todayISO } from "./lib/util";
import { BookPage } from "./pages/BookPage";
import { BooksPage } from "./pages/BooksPage";
import { LeetCodePage } from "./pages/LeetCodePage";
import { NotFound } from "./pages/NotFound";
import { PillarPage } from "./pages/PillarPage";
import { RoadmapPage } from "./pages/RoadmapPage";
import { isAppData, pickData, useStore } from "./store";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<RoadmapPage />} />
          <Route path="pillar/:id" element={<PillarPage />} />
          <Route path="leetcode" element={<LeetCodePage />} />
          <Route path="books" element={<BooksPage />} />
          <Route path="books/:id" element={<BookPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        el.scrollIntoView({ block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function Layout() {
  const { pathname } = useLocation();
  const onRoadmap = pathname === "/" || pathname.startsWith("/pillar");

  return (
    <div className="shell">
      <ScrollManager />
      <header className="masthead">
        <div className="masthead__inner">
          <Link to="/" className="wordmark">
            <span className="wordmark__dot" aria-hidden="true" />
            CS Progression <em>tracker</em>
          </Link>
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end className={onRoadmap ? "active" : ""}>
              Roadmap
            </NavLink>
            <NavLink to="/leetcode">LeetCode</NavLink>
            <NavLink to="/books">Books</NavLink>
          </nav>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="colophon">
        <div className="colophon__inner">
          <span>
            Saved in this browser. Curriculum from{" "}
            <a className="link" href="https://teachyourselfcs.com" target="_blank" rel="noreferrer">
              teachyourselfcs.com
            </a>
            .
          </span>
          <DataControls />
        </div>
      </footer>
      <Toast />
    </div>
  );
}

function DataControls() {
  const importData = useStore((s) => s.importData);
  const resetAll = useStore((s) => s.resetAll);
  const toast = useToast((s) => s.show);
  const fileRef = useRef<HTMLInputElement>(null);

  function exportData() {
    const data = pickData(useStore.getState());
    const blob = new Blob([JSON.stringify({ app: "cs-tracker", version: 1, exportedAt: new Date().toISOString(), data }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cs-tracker-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Backup downloaded");
  }

  async function handleImport(file: File | undefined) {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const data = parsed && typeof parsed === "object" && "data" in parsed ? (parsed as { data: unknown }).data : parsed;
      if (!isAppData(data)) throw new Error("bad shape");
      const before = pickData(useStore.getState());
      importData(data);
      toast("Backup restored", { label: "Undo", run: () => importData(before) });
    } catch {
      toast("That file isn’t a CS tracker backup.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="colophon__actions">
      <button type="button" className="btn btn--ghost btn--sm" onClick={exportData}>
        Export backup
      </button>
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()}>
        Import backup
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => handleImport(e.target.files?.[0])}
      />
      <ConfirmButton
        confirmLabel="Erase everything"
        onConfirm={() => {
          const before = pickData(useStore.getState());
          resetAll();
          toast("All progress reset", { label: "Undo", run: () => importData(before) });
        }}
      >
        Reset
      </ConfirmButton>
    </div>
  );
}
