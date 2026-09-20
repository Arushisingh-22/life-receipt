import React, { Component, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import "./index.css";

import {
  SOURCES,
  loadCSV,
  hour,
  sameDay,
  dayDifference,
  connectionType,
  typeLabel,
} from "./utils/data";

import {
  Overview,
  Chapters,
  Connections,
  Receipts,
  Detail,
} from "./components/Views";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("LIFE//RECEIPT error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="loading">
          <div className="recoveryCard">
            <div className="eyebrow">RECOVERY MODE</div>

            <h1>Something interrupted the archive.</h1>

            <p>
              The interface hit an unexpected error while rendering the
              archive.
            </p>

            <button
              className="primary"
              onClick={() => window.location.reload()}
            >
              Reload archive
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
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
    let mounted = true;

    Promise.all(
      SOURCES.map((source) => loadCSV(source.file, source.key))
    )
      .then((parts) => {
        if (!mounted) return;
        setReceipts(parts.flat());
      })
      .catch((err) => {
        if (!mounted) return;

        setError(
          `Could not load the datasets. ${
            err?.message || "Unknown error"
          }`
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const counts = Object.fromEntries(
      SOURCES.map((source) => [source.key, 0])
    );

    const hours = Array(24).fill(0);
    const years = {};
    let spending = 0;

    for (const receipt of receipts) {
      counts[receipt.type] =
        (counts[receipt.type] || 0) + 1;

      const h = hour(receipt.date);
      hours[h] += 1;

      const year = receipt.date.getFullYear();
      years[year] = (years[year] || 0) + 1;

      if (
        receipt.type === "purchase" ||
        receipt.type === "home"
      ) {
        spending += Number(receipt.amount) || 0;
      }
    }

    const peak = hours.indexOf(Math.max(...hours));

    const busiestYear =
      Object.entries(years).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0] || "—";

    return {
      counts,
      hours,
      peak,
      busiestYear,
      spending,
    };
  }, [receipts]);

  const chapters = useMemo(() => {
    if (!receipts.length) return [];

    const byYear = new Map();

    for (const receipt of receipts) {
      const year = receipt.date.getFullYear();

      if (!byYear.has(year)) {
        byYear.set(year, []);
      }

      byYear.get(year).push(receipt);
    }

    return [...byYear.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, records]) => {
        const counts = {};

        for (const record of records) {
          counts[record.type] =
            (counts[record.type] || 0) + 1;
        }

        const top =
          Object.entries(counts).sort(
            (a, b) => b[1] - a[1]
          )[0]?.[0] || "music";

        const late = records.filter((record) => {
          const h = hour(record.date);
          return h >= 22 || h < 3;
        }).length;

        const lateRatio = late / records.length;

        const title =
          lateRatio > 0.22
            ? "THE MIDNIGHT ERA"
            : top === "purchase"
              ? "THE SPENDING YEARS"
              : top === "home"
                ? "THE EVERYDAY YEARS"
                : "THE SOUNDTRACK YEARS";

        const desc =
          lateRatio > 0.22
            ? "Late-night activity keeps surfacing across the archive."
            : `A dense year led by ${typeLabel(
                top
              ).toLowerCase()}, surrounded by everyday traces.`;

        return {
          year,
          records,
          top,
          late,
          title,
          desc,
        };
      });
  }, [receipts]);

  /*
   * CONNECTION ENGINE
   *
   * Compares all three datasets:
   * Music ↔ Purchases
   * Music ↔ Household
   * Purchases ↔ Household
   *
   * Connections are based only on temporal proximity.
   * They do NOT imply that records belong to the same person.
   */
  const connections = useMemo(() => {
    const groups = {
      music: receipts
        .filter((record) => record.type === "music")
        .sort((a, b) => a.date - b.date),

      purchase: receipts
        .filter((record) => record.type === "purchase")
        .sort((a, b) => a.date - b.date),

      home: receipts
        .filter((record) => record.type === "home")
        .sort((a, b) => a.date - b.date),
    };

    const pairings = [
      ["music", "purchase"],
      ["music", "home"],
      ["purchase", "home"],
    ];

    const candidates = [];

    const nearest = (arr, target) => {
      if (!arr.length) {
        return {
          best: null,
          diff: Infinity,
        };
      }

      let low = 0;
      let high = arr.length - 1;

      while (low <= high) {
        const mid = (low + high) >> 1;

        if (arr[mid].date < target) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      let best = null;
      let diff = Infinity;

      for (const index of [high, low]) {
        if (index < 0 || index >= arr.length) {
          continue;
        }

        const distance = Math.abs(
          arr[index].date.getTime() -
            target.getTime()
        );

        if (distance < diff) {
          diff = distance;
          best = arr[index];
        }
      }

      return {
        best,
        diff,
      };
    };

    /*
     * Find the nearest record from each dataset pairing.
     */
    for (const [typeA, typeB] of pairings) {
      const first = groups[typeA];
      const second = groups[typeB];

      for (const record of first) {
        const match = nearest(
          second,
          record.date
        );

        if (!match.best) continue;

        const minutes = Math.round(
          match.diff / 60000
        );

        const same = sameDay(
          record.date,
          match.best.date
        );

        candidates.push({
          a: record,
          b: match.best,
          minutes,
          sameDay: same,
          dayGap: dayDifference(
            record.date,
            match.best.date
          ),
          type: connectionType(
            minutes,
            same
          ),
        });
      }
    }

    /*
     * Group connections by relationship type.
     */
    const buckets = {
      "Almost simultaneous": [],
      "Nearby moment": [],
      "Same window": [],
      "Same day": [],
      "Longer thread": [],
      "Different day": [],
    };

    for (const candidate of candidates) {
      if (buckets[candidate.type]) {
        buckets[candidate.type].push(
          candidate
        );
      }
    }

    /*
     * Strongest temporal relationships first.
     */
    Object.values(buckets).forEach(
      (bucket) => {
        bucket.sort(
          (a, b) => a.minutes - b.minutes
        );
      }
    );

    const result = [];
    const seen = new Set();

    const order = [
      "Almost simultaneous",
      "Nearby moment",
      "Same window",
      "Same day",
      "Longer thread",
      "Different day",
    ];

    let pointer = 0;

    /*
     * Round-robin through the relationship
     * buckets so the board does not become
     * dominated by one connection type.
     */
    while (result.length < 60) {
      let added = false;

      for (const type of order) {
        const item = buckets[type][pointer];

        if (!item) continue;

        const key = [
          item.a.id,
          item.b.id,
        ]
          .sort()
          .join("-");

        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        result.push(item);
        added = true;
      }

      if (!added) break;

      pointer++;
    }

    return result;
  }, [receipts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return receipts
      .filter((receipt) => {
        const matchesFilter =
          filter === "all" ||
          receipt.type === filter;

        if (!matchesFilter) return false;

        if (!q) return true;

        return `${receipt.title} ${
          receipt.subtitle
        } ${receipt.meta || ""} ${
          receipt.location || ""
        }`
          .toLowerCase()
          .includes(q);
      })
      .sort(
        (a, b) => b.date - a.date
      );
  }, [receipts, query, filter]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loadingMark">LR</div>

        <div className="loadingCopy">
          <div className="eyebrow">
            LIFE//RECEIPT
          </div>

          <h1>
            Finding the shape
            <br />
            inside the noise.
          </h1>

          <div className="loadingBar">
            <span />
          </div>

          <p>
            Finding the moments that matter.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading">
        <div className="recoveryCard">
          <div className="eyebrow">
            DATA ERROR
          </div>

          <h1>
            Couldn’t read the archive.
          </h1>

          <p>{error}</p>

          <button
            className="primary"
            onClick={() =>
              window.location.reload()
            }
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="lrHeader">
          <button
            className="brand"
            onClick={() =>
              setView("overview")
            }
            aria-label="Go to LIFE Receipt overview"
          >
            <span className="brandMark">
              LR
            </span>

            <span>
              LIFE<i>//</i>RECEIPT
            </span>
          </button>

          <nav aria-label="Primary navigation">
            {[
              ["overview", "Overview"],
              ["chapters", "Chapters"],
              [
                "connections",
                "Connections",
              ],
              ["receipts", "Archive"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={
                  view === key ? "active" : ""
                }
                onClick={() =>
                  setView(key)
                }
                aria-current={
                  view === key
                    ? "page"
                    : undefined
                }
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="headerSearch">
            <Search
              size={16}
              aria-hidden="true"
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="Search the archive"
              aria-label="Search the archive"
            />

            {query && (
              <button
                onClick={() =>
                  setQuery("")
                }
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </header>

        <main>
          {view === "overview" && (
            <Overview
              stats={stats}
              chapters={chapters}
              connections={connections}
              setView={setView}
            />
          )}

          {view === "chapters" && (
            <Chapters
              chapters={chapters}
              activeChapter={activeChapter}
              setActiveChapter={
                setActiveChapter
              }
              setSelected={setSelected}
            />
          )}

          {view === "connections" && (
            <Connections
              connections={connections}
              setSelected={setSelected}
            />
          )}

          {view === "receipts" && (
            <Receipts
              receipts={filtered}
              filter={filter}
              setFilter={setFilter}
              query={query}
              setSelected={setSelected}
            />
          )}
        </main>

        {selected && (
          <Detail
            r={selected}
            close={() =>
              setSelected(null)
            }
            all={receipts}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;