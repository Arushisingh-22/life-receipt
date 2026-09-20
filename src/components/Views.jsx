import React, { useState } from "react";
import { ArrowRight, X, FileText, Sparkles, SlidersHorizontal, ChevronDown, CircleDot } from "lucide-react";
import { ICONS, COLORS, money, typeLabel, formatGap, connectionDescription } from "../utils/data";

function exactDate(date) {
  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
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
        <div
          className="pulseColumn"
          key={i}
          title={`${String(i).padStart(2, "0")}:00 — ${v.toLocaleString()} records`}
          aria-label={`${String(i).padStart(2, "0")}:00, ${v.toLocaleString()} records`}
        >
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

      <div className="evidenceNote" role="note">
        <Sparkles size={14} aria-hidden="true" />
        <span><b>How threads work:</b> connections use timestamp proximity only. A thread is a clue between independent records, not proof they belong to the same person.</span>
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
      aria-label={`Open temporal thread ${index + 1}: ${a.title} and ${b.title}`}
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
        <small>{r.subtitle} · {exactDate(r.date)}</small>
      </div>
    </div>
  );
}

function Receipts({ filtered, filter, setFilter, setSelected }) {
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

        <div className="archiveSort" aria-label="Archive sort order">
          <SlidersHorizontal size={15} aria-hidden="true" />
          Latest first
          <ChevronDown size={14} aria-hidden="true" />
        </div>
      </div>

      <div className="archiveMeta" aria-live="polite">
        <span><b>{filtered.length.toLocaleString()}</b> records match your current view</span>
        <span>Click any row to inspect its raw evidence</span>
      </div>

      <section className="archive">
        <div className="archiveHead">
          <span>INDEX</span>
          <span>RECORD</span>
          <span>SOURCE</span>
          <span>DATE</span>
          <span />
        </div>

        {filtered.slice(0, 300).map((r, i) => (
          <ArchiveRow key={r.id} r={r} index={i} onOpen={() => setSelected(r)} />
        ))}
      </section>

      <div className="archiveFooter">
        Showing {Math.min(filtered.length, 300).toLocaleString()} of {filtered.length.toLocaleString()} records
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
        <small>{r.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</small>
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
        <p>{r.subtitle} · {exactDate(r.date)}</p>

        {r.amount ? <div className="amount">{money(r.amount)}</div> : null}

        <div className="raw">
          <span>RECEIPT ID</span><b>{r.id}</b>
          <span>TYPE</span><b>{typeLabel(r.type)}</b>
          <span>DATE</span><b>{exactDate(r.date)}</b>
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


export { PageTitle, Overview, Pulse, ChapterCard, Chapters, ChapterModal, Connections, ThreadCard, MiniReceipt, Receipts, ArchiveRow, Detail };
