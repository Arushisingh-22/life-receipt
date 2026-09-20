import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  CreditCard,
  Home,
  Music2,
  Search,
  Sparkles,
  X,
} from "lucide-react";

const money = (value) =>
  Number(value)
    ? `₹${Number(value).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
      })}`
    : "";

const formatDate = (date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatTime = (date) =>
  date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

const iconFor = (type) => {
  if (type === "music") return <Music2 size={17} />;
  if (type === "purchase") return <CreditCard size={17} />;
  return <Home size={17} />;
};

const sourceFor = (type) => {
  if (type === "music") return "MUSIC";
  if (type === "purchase") return "PURCHASE";
  return "HOUSEHOLD";
};

function Stat({ value, label, note }) {
  return (
    <div className="statCard">
      <div className="statValue">{value}</div>
      <div className="statLabel">{label}</div>
      {note && <div className="statNote">{note}</div>}
    </div>
  );
}

function ReceiptMini({ r, onClick }) {
  return (
    <button className="miniReceipt" onClick={onClick}>
      <span className="miniIcon">{iconFor(r.type)}</span>

      <span className="miniInfo">
        <b>{r.title}</b>
        <small>
          {r.subtitle} · {formatTime(r.date)}
        </small>
      </span>

      <ChevronRight size={16} />
    </button>
  );
}

export function Overview({
  stats,
  chapters,
  connections,
  setView,
}) {
  const feature = connections[0];

  return (
    <section className="page">
      <div className="hero">
        <div>
          <div className="eyebrow">YOUR LIFE, IN RECEIPTS</div>

          <h1>
            Your life left clues.
            <br />
            <em>We connected them.</em>
          </h1>

          <p className="heroText">
            A visual archive built from the traces everyday life leaves
            behind.
          </p>

          <button
            className="primary"
            onClick={() => setView("connections")}
          >
            Discover your story
            <ArrowRight size={17} />
          </button>
        </div>

        <div className="heroStamp">
          <span>LR</span>
          <small>ARCHIVE<br />01</small>
        </div>
      </div>

      <div className="statsGrid">
        <Stat
          value={stats.counts.music.toLocaleString()}
          label="MUSIC TRACES"
          note="listening moments"
        />

        <Stat
          value={stats.counts.purchase.toLocaleString()}
          label="PURCHASE TRACES"
          note="transaction moments"
        />

        <Stat
          value={stats.counts.home.toLocaleString()}
          label="HOUSEHOLD TRACES"
          note="everyday activity"
        />

        <Stat
          value={stats.busiestYear}
          label="BUSIEST YEAR"
          note="highest activity density"
        />
      </div>

      <section className="sectionBlock">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">01 / DIGITAL PULSE</div>
            <h2>When your archive was awake.</h2>
          </div>

          <span className="sectionMeta">
            PEAK {String(stats.peak).padStart(2, "0")}:00
          </span>
        </div>

        <div className="pulse">
          {stats.hours.map((count, index) => {
            const max = Math.max(...stats.hours, 1);
            const height = Math.max(5, (count / max) * 100);

            return (
              <div className="pulseCol" key={index}>
                <div
                  className="pulseBar"
                  style={{ height: `${height}%` }}
                  title={`${index}:00 · ${count} traces`}
                />
              </div>
            );
          })}
        </div>

        <div className="pulseLabels">
          <span>00</span>
          <span>06</span>
          <span>12</span>
          <span>18</span>
          <span>24</span>
        </div>
      </section>

      {feature && (
        <section className="featureThread">
          <div className="featureCopy">
            <div className="eyebrow">A THREAD WORTH FOLLOWING</div>

            <h2>
              One moment
              <br />
              <em>pulled another.</em>
            </h2>

            <p>
              {feature.a.title} sits near {feature.b.title} in the
              archive. Independent traces, close enough in time to
              become a clue.
            </p>

            <button
              className="textButton"
              onClick={() => setView("connections")}
            >
              Follow the thread <ArrowRight size={16} />
            </button>
          </div>

          <div className="featureVisual">
            <div className="node nodeA">
              <span>{iconFor(feature.a.type)}</span>
              <b>{feature.a.title}</b>
              <small>{formatTime(feature.a.date)}</small>
            </div>

            <div className="threadLine">
              <span>{feature.minutes} MIN</span>
            </div>

            <div className="node nodeB">
              <span>{iconFor(feature.b.type)}</span>
              <b>{feature.b.title}</b>
              <small>{formatTime(feature.b.date)}</small>
            </div>
          </div>
        </section>
      )}

      <section className="sectionBlock">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">02 / CHAPTERS</div>
            <h2>Your life had chapters.</h2>
          </div>

          <button
            className="textButton"
            onClick={() => setView("chapters")}
          >
            See all <ArrowRight size={15} />
          </button>
        </div>

        <div className="chapterGrid">
          {chapters.slice(0, 3).map((chapter) => (
            <article className="chapterCard" key={chapter.year}>
              <div className="chapterYear">{chapter.year}</div>

              <h3>{chapter.title}</h3>

              <p>{chapter.desc}</p>

              <div className="chapterFooter">
                <span>{chapter.records.length} traces</span>
                <span>{chapter.top}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export function Chapters({
  chapters,
  activeChapter,
  setActiveChapter,
  setSelected,
}) {
  return (
    <section className="page">
      <div className="pageHero">
        <div className="eyebrow">02 / CHAPTERS</div>

        <h1>
          Your life had chapters.
          <br />
          <em>You just never named them.</em>
        </h1>

        <p>
          Years become stories when you look at what kept repeating.
        </p>
      </div>

      <div className="chapterList">
        {chapters.map((chapter, index) => (
          <article
            className={`chapterLarge ${
              activeChapter === chapter.year ? "open" : ""
            }`}
            key={chapter.year}
          >
            <button
              className="chapterTrigger"
              onClick={() =>
                setActiveChapter(
                  activeChapter === chapter.year
                    ? null
                    : chapter.year
                )
              }
            >
              <span className="chapterIndex">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="chapterLargeYear">
                {chapter.year}
              </span>

              <span className="chapterLargeTitle">
                {chapter.title}
              </span>

              <span className="chapterCount">
                {chapter.records.length} traces
              </span>

              <ChevronRight
                size={20}
                className="chapterChevron"
              />
            </button>

            {activeChapter === chapter.year && (
              <div className="chapterReveal">
                <div>
                  <div className="eyebrow">THE CLUE</div>
                  <p>{chapter.desc}</p>
                </div>

                <div className="chapterSample">
                  {chapter.records.slice(0, 5).map((record) => (
                    <ReceiptMini
                      key={record.id}
                      r={record}
                      onClick={() => setSelected(record)}
                    />
                  ))}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function ConnectionCard({ connection, onSelect }) {
  const [hover, setHover] = useState(false);

  const { a, b, minutes, type } = connection;

  return (
    <button
      className="threadCard"
      onClick={() => onSelect(a)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="threadTop">
        <span>{sourceFor(a.type)}</span>
        <ArrowRight size={14} />
        <span>{sourceFor(b.type)}</span>
      </div>

      <div className="threadNodes">
        <div className="threadNode">
          <span>{iconFor(a.type)}</span>
          <strong>{a.title}</strong>
          <small>{formatTime(a.date)}</small>
        </div>

        <div className="threadConnector">
          <span>{minutes}m</span>
        </div>

        <div className="threadNode">
          <span>{iconFor(b.type)}</span>
          <strong>{b.title}</strong>
          <small>{formatTime(b.date)}</small>
        </div>
      </div>

      <div className="threadBottom">
        <span>{type}</span>

        <span className="threadInsight">
          {hover
            ? "Open this thread →"
            : "Independent records · temporal clue"}
        </span>
      </div>
    </button>
  );
}

export function Connections({
  connections,
  setSelected,
}) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return connections;

    return connections.filter(
      (connection) => connection.type === filter
    );
  }, [connections, filter]);

  const types = [
    "all",
    "Almost simultaneous",
    "Nearby moment",
    "Same window",
    "Same day",
    "Longer thread",
    "Different day",
  ];

  return (
    <section className="page">
      <div className="pageHero connectionHero">
        <div className="eyebrow">03 / CONNECTIONS</div>

        <h1>
          Pull one thread.
          <br />
          <em>See what moves.</em>
        </h1>

        <p>
          The archive contains independent moments. Time gives some
          of them a relationship.
        </p>

        <div className="connectionCount">
          <strong>{connections.length}</strong>
          <span>temporal threads found</span>
        </div>
      </div>

      <div className="filterRail" role="group" aria-label="Connection filters">
        {types.map((type) => (
          <button
            key={type}
            className={filter === type ? "selected" : ""}
            onClick={() => setFilter(type)}
          >
            {type === "all" ? "All threads" : type}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className="threadBoard">
          {filtered.map((connection, index) => (
            <ConnectionCard
              key={`${connection.a.id}-${connection.b.id}-${index}`}
              connection={connection}
              onSelect={setSelected}
            />
          ))}
        </div>
      ) : (
        <div className="emptyState">
          <Sparkles size={25} />
          <h3>No thread here yet.</h3>
          <p>Try another connection type.</p>
        </div>
      )}
    </section>
  );
}

export function Receipts({
  receipts,
  filter,
  setFilter,
  query,
  setSelected,
}) {
  const [visible, setVisible] = useState(80);

  const displayed = receipts.slice(0, visible);

  const filters = [
    ["all", "Everything"],
    ["music", "Music"],
    ["purchase", "Purchases"],
    ["home", "Household"],
  ];

  return (
    <section className="page archivePage">
      <div className="pageHero archiveHero">
        <div className="eyebrow">04 / ARCHIVE</div>

        <h1>
          Every little thing
          <br />
          <em>leaves a trace.</em>
        </h1>

        <p>
          Browse the raw moments behind the story. Nothing here needs
          to be important to still be part of the archive.
        </p>

        <div className="archiveCount">
          <strong>{receipts.length.toLocaleString()}</strong>
          <span>matching records</span>
        </div>
      </div>

      <div className="archiveToolbar">
        <div className="archiveFilters">
          {filters.map(([key, label]) => (
            <button
              key={key}
              className={filter === key ? "selected" : ""}
              onClick={() => {
                setFilter(key);
                setVisible(80);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {query && (
          <div className="searchResult">
            <Search size={14} />
            <span>
              Searching for <b>“{query}”</b>
            </span>
          </div>
        )}
      </div>

      <div className="archiveIndex">
        <div className="archiveHeader">
          <span>INDEX</span>
          <span>RECORD</span>
          <span>SOURCE</span>
          <span>DATE</span>
          <span>VALUE</span>
        </div>

        {displayed.map((receipt, index) => (
          <button
            className="archiveRow"
            key={receipt.id}
            onClick={() => setSelected(receipt)}
          >
            <span className="archiveNumber">
              #{String(index + 1).padStart(3, "0")}
            </span>

            <span className="archiveRecord">
              <span className="archiveIcon">
                {iconFor(receipt.type)}
              </span>

              <span>
                <strong>{receipt.title}</strong>
                <small>{receipt.subtitle}</small>
              </span>
            </span>

            <span className="archiveSource">
              {sourceFor(receipt.type)}
            </span>

            <span className="archiveDate">
              <strong>{formatDate(receipt.date)}</strong>
              <small>{formatTime(receipt.date)}</small>
            </span>

            <span className="archiveValue">
              {money(receipt.amount)}
              <ChevronRight size={15} />
            </span>
          </button>
        ))}
      </div>

      {visible < receipts.length && (
        <button
          className="loadMore"
          onClick={() => setVisible((value) => value + 80)}
        >
          Load more records
          <ArrowRight size={16} />
        </button>
      )}

      {!displayed.length && (
        <div className="emptyState">
          <Search size={25} />
          <h3>Nothing matched.</h3>
          <p>Try a different search or archive filter.</p>
        </div>
      )}
    </section>
  );
}

function MiniReceipt({ r }) {
  return (
    <div className="modalMini">
      <span>{iconFor(r.type)}</span>

      <div>
        <b>{r.title}</b>
        <small>
          {r.subtitle} · {formatTime(r.date)}
        </small>
      </div>
    </div>
  );
}

export function Detail({ r, close, all }) {
  const related = useMemo(() => {
    return all
      .filter((x) => {
        if (x.id === r.id) return false;

        const diff = Math.abs(
          x.date.getTime() - r.date.getTime()
        );

        return diff <= 30 * 60 * 1000;
      })
      .sort(
        (a, b) =>
          Math.abs(a.date - r.date) -
          Math.abs(b.date - r.date)
      )
      .slice(0, 5);
  }, [all, r]);

  return (
    <div
      className="overlay"
      onClick={close}
      role="presentation"
    >
      <div
        className="detail"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Receipt details"
      >
        <button
          className="close"
          onClick={close}
          aria-label="Close receipt details"
        >
          <X size={19} />
        </button>

        <div className="eyebrow">{r.source}</div>

        <div className="detailIcon">
          {iconFor(r.type)}
        </div>

        <h2>{r.title}</h2>

        <p className="detailSubtitle">
          {r.subtitle} · {formatDate(r.date)} ·{" "}
          {formatTime(r.date)}
        </p>

        {r.amount ? (
          <div className="amount">{money(r.amount)}</div>
        ) : null}

        <div className="raw">
          <span>RECEIPT ID</span>
          <b>{r.id}</b>

          <span>TYPE</span>
          <b>{sourceFor(r.type)}</b>

          <span>DATE</span>
          <b>{formatDate(r.date)}</b>

          {r.location ? (
            <>
              <span>LOCATION</span>
              <b>{r.location}</b>
            </>
          ) : null}
        </div>

        {related.length > 0 && (
          <>
            <div className="eyebrow relatedTitle">
              NEARBY MOMENTS
            </div>

            <div className="relatedList">
              {related.map((item) => (
                <MiniReceipt
                  key={item.id}
                  r={item}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}