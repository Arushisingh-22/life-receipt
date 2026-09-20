import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  Search,
  ArrowRight,
  X,
  Music2,
  CreditCard,
  Home,
  FileText,
  Clock3,
  Sparkles,
  SlidersHorizontal,
  CalendarDays,
  ChevronDown,
  CircleDot,
} from "lucide-react";
import "./index.css";

const SOURCES = [
  { key: "music", label: "Music", icon: Music2, file: "/data/spotify_history.csv", source: "Spotify" },
  { key: "purchase", label: "Purchases", icon: CreditCard, file: "/data/india_transactions.csv", source: "India Transactions" },
  { key: "home", label: "Household", icon: Home, file: "/data/household_transactions.csv", source: "Household Transactions" },
];

const ICONS = { music: Music2, purchase: CreditCard, home: Home };
const COLORS = { music: "violet", purchase: "amber", home: "cyan" };

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function parseDate(value, type) {
  if (!value) return null;
  if (type === "home") {
    const [d, t = "00:00:00"] = String(value).split(" ");
    const [dd, mm, yyyy] = d.split("/");
    const out = new Date(`${yyyy}-${mm}-${dd}T${t}`);
    return Number.isNaN(out.getTime()) ? null : out;
  }
  const out = new Date(value);
  return Number.isNaN(out.getTime()) ? null : out;
}

function normalize(rows, type) {
  return rows.map((r, i) => {
    const date = parseDate(
      type === "music" ? r.ts : type === "purchase" ? r.trans_date_trans_time : r.Date,
      type
    );
    if (!date) return null;

    if (type === "music") {
      return {
        id: `m${i}`, type, date,
        title: r.track_name || "Unknown track",
        subtitle: r.artist_name || "Unknown artist",
        meta: r.album_name || "Spotify",
        amount: null, location: null, source: "Spotify",
      };
    }

    if (type === "purchase") {
      return {
        id: `p${i}`, type, date,
        title: r.merchant || "Unknown merchant",
        subtitle: r.category || "Purchase",
        meta: r.city || r.state || "India",
        amount: Number(r.amt) || 0,
        location: r.city || r.state || null,
        source: "India Transactions",
      };
    }

    return {
      id: `h${i}`, type, date,
      title: r.Note || r.Subcategory || r.Category || "Household activity",
      subtitle: r.Category || "Household",
      meta: r.Mode || r.Currency || "Household",
      amount: Number(r.Amount) || 0,
      location: null,
      source: "Household Transactions",
    };
  }).filter(Boolean);
}

function loadCSV(file, type) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (r) => resolve(normalize(r.data, type)),
      error: reject,
    });
  });
}

function typeLabel(type) {
  return SOURCES.find((s) => s.key === type)?.label || type;
}

function hour(d) {
  const x = d instanceof Date ? d : new Date(d);
  return Number.isNaN(x.getTime()) ? 0 : x.getHours();
}

function dayStart(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function dayDifference(a, b) {
  return Math.round(Math.abs(dayStart(a) - dayStart(b)) / 86400000);
}

function sameDay(a, b) {
  return dayDifference(a, b) === 0;
}

function formatGap(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h} hr`;
}

function connectionType(minutes, same) {
  if (!same) return "DATE ECHO";
  if (minutes <= 10) return "NEARLY TOGETHER";
  if (minutes <= 45) return "SAME HOUR";
  if (minutes <= 120) return "CLOSE ENCOUNTER";
  if (minutes <= 300) return "SAME PART OF DAY";
  return "SAME DAY";
}

function connectionDescription(c) {
  if (!c.sameDay) return `${c.dayGap} day${c.dayGap === 1 ? "" : "s"} apart. A date-level echo, not a claim of shared identity.`;
  if (c.minutes <= 10) return `Only ${formatGap(c.minutes)} separates the two records.`;
  if (c.minutes <= 45) return `Both traces appeared within roughly the same hour.`;
  if (c.minutes <= 120) return `The two records sit inside a ${formatGap(c.minutes)} window.`;
  if (c.minutes <= 300) return `Both traces surfaced during the same broad part of the day.`;
  return `Two independent sources left traces on the same calendar day.`;
}

function App() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("overview");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);

  useEffect(() => {
    Promise.all(SOURCES.map((s) => loadCSV(s.file, s.key)))
      .then((parts) => setReceipts(parts.flat()))
      .catch((e) => setError(`Could not load the datasets. ${e.message || ""}`))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const counts = Object.fromEntries(SOURCES.map((s) => [s.key, 0]));
    const hours = Array(24).fill(0);
    const years = {};
    let spending = 0;

    receipts.forEach((r) => {
      counts[r.type]++;
      hours[hour(r.date)]++;
      const y = r.date.getFullYear();
      years[y] = (years[y] || 0) + 1;
      if (r.type === "purchase" || r.type === "home") spending += r.amount || 0;
    });

    const peak = hours.indexOf(Math.max(...hours));
    const busiestYear =
      Object.entries(years).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    return { counts, hours, peak, busiestYear, spending };
  }, [receipts]);

  const chapters = useMemo(() => {
    if (!receipts.length) return [];

    const byYear = new Map();
    receipts.forEach((r) => {
      const y = r.date.getFullYear();
      if (!byYear.has(y)) byYear.set(y, []);
      byYear.get(y).push(r);
    });

    return [...byYear.entries()].sort((a, b) => b[0] - a[0]).map(([year, rs]) => {
      const counts = {};
      rs.forEach((r) => { counts[r.type] = (counts[r.type] || 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "music";
      const late = rs.filter((r) => hour(r.date) >= 22 || hour(r.date) < 3).length;
      const lateRatio = late / rs.length;

      const title =
        lateRatio > 0.22 ? "THE MIDNIGHT ERA" :
        top === "purchase" ? "THE SPENDING YEARS" :
        top === "home" ? "THE EVERYDAY YEARS" :
        "THE SOUNDTRACK YEARS";

      const desc =
        lateRatio > 0.22
          ? "Late-night activity keeps surfacing across the archive."
          : `A dense year led by ${typeLabel(top).toLowerCase()}, surrounded by everyday traces.`;

      return { year, rs, top, late, title, desc };
    });
  }, [receipts]);

  const connections = useMemo(() => {
    const music = receipts.filter((r) => r.type === "music").sort((a, b) => a.date - b.date);
    const purchases = receipts.filter((r) => r.type === "purchase").sort((a, b) => a.date - b.date);
    const candidates = [];

    const nearest = (arr, target) => {
      let lo = 0, hi = arr.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid].date < target) lo = mid + 1;
        else hi = mid - 1;
      }

      let best = null, diff = Infinity;
      for (const idx of [hi, lo]) {
        if (idx < 0 || idx >= arr.length) continue;
        const d = Math.abs(arr[idx].date.getTime() - target.getTime());
        if (d < diff) { diff = d; best = arr[idx]; }
      }
      return { best, diff };
    };

    purchases.forEach((p) => {
      const n = nearest(music, p.date);
      if (!n.best) return;

      const minutes = Math.max(1, Math.round(n.diff / 60000));
      if (minutes > 720) return;

      const same = sameDay(n.best.date, p.date);

      candidates.push({
        a: n.best,
        b: p,
        minutes,
        sameDay: same,
        dayGap: dayDifference(n.best.date, p.date),
        type: connectionType(minutes, same),
      });
    });

    const buckets = [
      candidates.filter((c) => c.sameDay && c.minutes <= 10),
      candidates.filter((c) => c.sameDay && c.minutes > 10 && c.minutes <= 45),
      candidates.filter((c) => c.sameDay && c.minutes > 45 && c.minutes <= 120),
      candidates.filter((c) => c.sameDay && c.minutes > 120 && c.minutes <= 300),
      candidates.filter((c) => c.sameDay && c.minutes > 300),
      candidates.filter((c) => !c.sameDay),
    ];

    buckets.forEach((b) => b.sort((a, z) => a.minutes - z.minutes));

    const result = [];
    const seen = new Set();
    let pointer = 0;

    while (result.length < 36) {
      let added = false;

      for (const bucket of buckets) {
        const item = bucket[pointer];
        if (!item) continue;

        const key = `${item.a.id}-${item.b.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push(item);
          added = true;
        }
      }

      if (!added) break;
      pointer++;
    }

    return result;
  }, [receipts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return receipts
      .filter(
        (r) =>
          (filter === "all" || r.type === filter) &&
          (!q ||
            `${r.title} ${r.subtitle} ${r.meta} ${r.location || ""}`
              .toLowerCase()
              .includes(q))
      )
      .sort((a, b) => b.date - a.date);
  }, [receipts, query, filter]);

  // The raw data can contain hundreds of moments on the exact same day.
  // For the visual archive, spread the first 120 visible records across the
  // timeline so the page tells a story instead of showing one date repeatedly.
  const archiveDisplay = useMemo(() => {
    if (filtered.length <= 120) return filtered;
    const picked = [];
    const step = (filtered.length - 1) / 119;
    for (let i = 0; i < 120; i++) {
      picked.push(filtered[Math.round(i * step)]);
    }
    return picked;
  }, [filtered]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loadingMark">LR</div>
        <div className="loadingCopy">
          <div className="eyebrow">LIFE//RECEIPT</div>
          <h1>Finding the shape<br />inside the noise.</h1>
          <div className="loadingBar"><span /></div>
          <p>Finding the moments that matter.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading">
        <div>
          <div className="eyebrow">DATA ERROR</div>
          <h1>Couldn’t read the archive.</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="lrHeader">
        <button className="brand" onClick={() => setView("overview")}>
          <span className="brandMark">LR</span>
          <span>LIFE<i>//</i>RECEIPT</span>
        </button>

        <nav>
          {[
            ["overview", "Overview"],
            ["chapters", "Chapters"],
            ["connections", "Connections"],
            ["receipts", "Archive"],
          ].map(([key, label]) => (
            <button key={key} className={view === key ? "active" : ""} onClick={() => setView(key)}>
              {label}
            </button>
          ))}
        </nav>

        <div className="headerSearch">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the archive" />
          {query && <button onClick={() => setQuery("")}><X size={14} /></button>}
        </div>
      </header>

      <main>
        {view === "overview" && (
          <Overview stats={stats} chapters={chapters} connections={connections} setView={setView} />
        )}

        {view === "chapters" && (
          <Chapters chapters={chapters} activeChapter={activeChapter} setActiveChapter={setActiveChapter} setSelected={setSelected} />
        )}

        {view === "connections" && (
          <Connections connections={connections} setSelected={setSelected} />
        )}

        {view === "receipts" && (
          <Receipts filtered={filtered} filter={filter} setFilter={setFilter} setSelected={setSelected} />
        )}
      </main>

      {selected && <Detail r={selected} close={() => setSelected(null)} all={receipts} />}
    </div>
  );
}

function PageTitle({ eyebrow, title, desc, children }) {
  return (
    <section className="pageTitle">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      {children}
    </section>
  );
}

function Overview({ stats, chapters, connections, setView }) {
  const c = connections[0];

  return (
    <>
      <PageTitle
        eyebrow="YOUR LIFE, IN RECEIPTS"
        title="Your life left clues. We connected them."
        desc="A visual archive built from the traces everyday life leaves behind."
      >
        <button className="primary" onClick={() => setView("connections")}>
          Discover your story <ArrowRight size={17} />
        </button>
      </PageTitle>

      <section className="heroStats">
        <div className="bigStat">
          <span>ARCHIVE SIZE</span>
          <strong>{Object.values(stats.counts).reduce((a, b) => a + b, 0).toLocaleString()}</strong>
          <small>recorded moments</small>
        </div>
        <div>
          <span>MOST ACTIVE HOUR</span>
          <strong>{String(stats.peak).padStart(2, "0")}:00</strong>
          <small>across the archive</small>
        </div>
        <div>
          <span>BUSIEST YEAR</span>
          <strong>{stats.busiestYear}</strong>
          <small>highest activity density</small>
        </div>
        <div>
          <span>THREADS FOUND</span>
          <strong>{connections.length}</strong>
          <small>temporal relationships</small>
        </div>
      </section>

      <section className="section">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">01 / DIGITAL PULSE</div>
            <h2>The rhythm of a life.</h2>
          </div>
          <span className="muted">Activity by hour</span>
        </div>
        <Pulse values={stats.hours} />
      </section>

      <section className="feature">
        <div className="featureCopy">
          <div className="eyebrow">A THREAD WORTH FOLLOWING</div>
          <h2>{c ? "Different traces. One moment in time." : "The story is in the details."}</h2>
          <p>
            {c
              ? `We found two independent records separated by ${formatGap(c.minutes)}. Explore it as a clue, not a claim.`
              : "Explore the connections engine to see what the archive reveals."}
          </p>
          <button className="textBtn" onClick={() => setView("connections")}>
            Follow the thread <ArrowRight size={16} />
          </button>
        </div>

        {c && (
          <div className="connectionPreview">
            <MiniReceipt r={c.a} />
            <div className="connector">
              <span>{formatGap(c.minutes)}</span>
              <i />
            </div>
            <MiniReceipt r={c.b} />
          </div>
        )}
      </section>

      <section className="section">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">02 / CHAPTERS</div>
            <h2>Moments became chapters.</h2>
          </div>
          <button className="textBtn" onClick={() => setView("chapters")}>
            See all <ArrowRight size={16} />
          </button>
        </div>

        <div className="chapterGrid">
          {chapters.slice(0, 3).map((ch) => (
            <ChapterCard key={ch.year} ch={ch} onClick={() => setView("chapters")} />
          ))}
        </div>
      </section>
    </>
  );
}

function Pulse({ values }) {
  const max = Math.max(...values, 1);

  return (
    <div className="pulse">
      {values.map((v, i) => (
        <div className="pulseColumn" key={i}>
          <div className="bar" style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
          <span>{String(i).padStart(2, "0")}</span>
        </div>
      ))}
    </div>
  );
}

function ChapterCard({ ch, onClick }) {
  return (
    <button className="chapterCard" onClick={onClick}>
      <div className="cardTop">
        <span>{ch.year}</span>
        <span>{ch.rs.length.toLocaleString()} moments</span>
      </div>
      <h3>{ch.title}</h3>
      <p>{ch.desc}</p>
      <div className="miniTypes">
        {Object.keys(ICONS).map((t) => {
          const I = ICONS[t];
          return <span className={ch.top === t ? "on" : ""} key={t}><I size={14} /></span>;
        })}
      </div>
      <ArrowRight className="corner" size={18} />
    </button>
  );
}

function Chapters({ chapters, activeChapter, setActiveChapter, setSelected }) {
  return (
    <>
      <PageTitle
        eyebrow="CHAPTERS"
        title="Your life had chapters. You just never named them."
        desc="Activity is grouped into eras, revealing the patterns that kept returning."
      />

      <div className="chapterList">
        {chapters.map((ch) => (
          <div key={ch.year} className="chapterRow">
            <ChapterCard ch={ch} onClick={() => setActiveChapter(ch.year)} />
            <div className="chapterEvidence">
              <div className="eyebrow">WHAT WE FOUND</div>
              <p>{ch.desc}</p>
              <div className="evidenceStats">
                <span>{ch.rs.length.toLocaleString()} moments</span>
                <span>{ch.late.toLocaleString()} late-night</span>
                <span>{new Set(ch.rs.map((r) => r.type)).size} sources</span>
              </div>
              <button className="textBtn" onClick={() => setActiveChapter(ch.year)}>
                Enter chapter <ArrowRight size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {activeChapter && (
        <ChapterModal
          ch={chapters.find((x) => x.year === activeChapter)}
          close={() => setActiveChapter(null)}
          setSelected={setSelected}
        />
      )}
    </>
  );
}

function ChapterModal({ ch, close, setSelected }) {
  if (!ch) return null;

  return (
    <div className="overlay" onClick={close}>
      <div className="chapterModal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={close}><X /></button>
        <div className="eyebrow">{ch.year} / CHAPTER</div>
        <h2>{ch.title}</h2>
        <p>{ch.desc}</p>

        <div className="storyLine">
          {ch.rs.slice().sort((a, b) => b.date - a.date).slice(0, 10).map((r) => (
            <button onClick={() => setSelected(r)} key={r.id}>
              <span className={`dot ${COLORS[r.type]}`} />
              <div>
                <b>{r.title}</b>
                <small>{r.date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</small>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Connections({ connections, setSelected }) {
  const [active, setActive] = useState(null);

  const visible = active === null ? connections : connections.filter((c) => c.type === active);

  const types = ["ALL", ...new Set(connections.map((c) => c.type))];

  return (
    <>
      <section className="connectionHero">
        <div>
          <div className="eyebrow">03 / CONNECTION ENGINE</div>
          <h1>Pull one thread.<br /><span>See what moves.</span></h1>
          <p>Separate records become interesting when they start appearing near one another.</p>
        </div>

        <div className="connectionHeroStat">
          <span>THREADS</span>
          <strong>{connections.length}</strong>
          <small>relationships surfaced</small>
        </div>
      </section>

      <div className="connectionFilters">
        {types.map((type) => (
          <button
            key={type}
            className={(active === null && type === "ALL") || active === type ? "active" : ""}
            onClick={() => setActive(type === "ALL" ? null : type)}
          >
            {type}
          </button>
        ))}
      </div>

      <section className="threadBoard">
        <div className="boardLabel">
          <span><CircleDot size={14} /> TEMPORAL THREADS</span>
          <span>{visible.length} visible</span>
        </div>

        {visible.map((c, i) => (
          <ThreadCard
            key={`${c.a.id}-${c.b.id}`}
            connection={c}
            index={i}
            onOpen={() => setSelected(c.a)}
          />
        ))}

        {!visible.length && <div className="emptyState">No threads in this view.</div>}
      </section>
    </>
  );
}

function ThreadCard({ connection, index, onOpen }) {
  const [hovered, setHovered] = useState(false);
  const { a, b, minutes, type, sameDay } = connection;

  return (
    <button
      className={`threadCard thread-${index % 4}`}
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="threadIndex">{String(index + 1).padStart(2, "0")}</div>

      <div className="threadSource">
        <span>{a.source}</span>
        <span>→</span>
        <span>{b.source}</span>
      </div>

      <div className="threadNodes">
        <div className="threadNode"><MiniReceipt r={a} /></div>

        <div className="threadMiddle">
          <div className="threadLine"><span /></div>
          <strong>{sameDay ? formatGap(minutes) : `${connection.dayGap} days`}</strong>
          <small>{type}</small>
        </div>

        <div className="threadNode"><MiniReceipt r={b} /></div>
      </div>

      <div className={`threadInsight ${hovered ? "show" : ""}`}>
        <Sparkles size={14} />
        <span>{connectionDescription(connection)}</span>
      </div>

      <ArrowRight className="threadArrow" size={17} />
    </button>
  );
}

function MiniReceipt({ r }) {
  const I = ICONS[r.type] || FileText;

  return (
    <div className="miniReceipt">
      <div className={`iconBox ${COLORS[r.type]}`}><I size={18} /></div>
      <div>
        <b>{r.title?.slice(0, 42) || "Untitled"}</b>
        <small>{r.subtitle} · {r.date.toLocaleDateString()}</small>
      </div>
    </div>
  );
}

function Receipts({ filtered, filter, setFilter, setSelected }) {
  // Keep the archive visually varied instead of showing the same date repeatedly.
  // We sample across the full filtered timeline while preserving chronological data.
  const archiveDisplay = React.useMemo(() => {
    if (filtered.length <= 120) return filtered;
    const picked = [];
    const step = (filtered.length - 1) / 119;
    for (let i = 0; i < 120; i++) {
      picked.push(filtered[Math.round(i * step)]);
    }
    return picked;
  }, [filtered]);

  return (
    <>
      <section className="archiveHero">
        <div>
          <div className="eyebrow">04 / THE ARCHIVE</div>
          <h1>Every little thing<br /><span>leaves a trace.</span></h1>
          <p>Browse the raw moments behind the story.</p>
        </div>

        <div className="archiveCount">
          <span>SHOWING</span>
          <strong>{filtered.length.toLocaleString()}</strong>
          <small>matching records</small>
        </div>
      </section>

      <div className="archiveToolbar">
        <div className="archiveFilters">
          {[
            ["all", "Everything"],
            ["music", "Music"],
            ["purchase", "Purchases"],
            ["home", "Household"],
          ].map(([key, label]) => (
            <button key={key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>

        <div className="archiveSort">
          <SlidersHorizontal size={15} />
          Across the timeline
          <ChevronDown size={14} />
        </div>
      </div>

      <section className="archive">
        <div className="archiveHead">
          <span>INDEX</span>
          <span>RECORD</span>
          <span>SOURCE</span>
          <span>DATE</span>
          <span />
        </div>

        {archiveDisplay.map((r, i) => (
          <ArchiveRow key={r.id} r={r} index={i} onOpen={() => setSelected(r)} />
        ))}
      </section>

      <div className="archiveFooter">
        Showing {archiveDisplay.length.toLocaleString()} moments across {filtered.length.toLocaleString()} matching records
      </div>
    </>
  );
}

function ArchiveRow({ r, index, onOpen }) {
  const I = ICONS[r.type] || FileText;

  return (
    <button className="archiveRow" onClick={onOpen}>
      <span className="archiveNumber">{String(index + 1).padStart(3, "0")}</span>

      <div className="archiveRecord">
        <div className={`archiveIcon ${COLORS[r.type]}`}><I size={17} /></div>
        <div>
          <b>{r.title}</b>
          <small>{r.subtitle}</small>
        </div>
      </div>

      <span className="archiveSource">{r.source}</span>

      <span className="archiveDate">
        {r.date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })}
        <small>{r.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
      </span>

      <span className="archiveAmount">
        {r.amount ? money(r.amount) : "VIEW"}
        <ArrowRight size={15} />
      </span>
    </button>
  );
}

function Detail({ r, close, all }) {
  const related = all
    .filter(
      (x) =>
        x.id !== r.id &&
        Math.abs(x.date - r.date) < 6 * 60 * 60 * 1000
    )
    .sort(
      (a, b) =>
        Math.abs(a.date - r.date) -
        Math.abs(b.date - r.date)
    )
    .slice(0, 5);

  return (
    <div className="overlay" onClick={close}>
      <div className="detail" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={close}><X /></button>

        <div className="detailTop">
          <div className="eyebrow">{r.source}</div>
          <div className="detailType">{typeLabel(r.type)}</div>
        </div>

        <h2>{r.title}</h2>
        <p>{r.subtitle} · {r.date.toLocaleString()}</p>

        {r.amount ? <div className="amount">{money(r.amount)}</div> : null}

        <div className="raw">
          <span>RECEIPT ID</span><b>{r.id}</b>
          <span>TYPE</span><b>{typeLabel(r.type)}</b>
          <span>DATE</span><b>{r.date.toLocaleString()}</b>
          {r.location ? <><span>LOCATION</span><b>{r.location}</b></> : null}
        </div>

        {related.length > 0 && (
          <>
            <div className="eyebrow relatedTitle">NEARBY MOMENTS</div>
            <div className="detailRelated">
              {related.map((x) => <MiniReceipt r={x} key={x.id} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
