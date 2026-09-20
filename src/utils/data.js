import Papa from "papaparse";

export const SOURCES = [
  {
    key: "music",
    label: "Music",
    source: "Spotify",
    file: "/data/spotify_history.csv",
  },
  {
    key: "purchase",
    label: "Purchases",
    source: "India Transactions",
    file: "/data/india_transactions.csv",
  },
  {
    key: "home",
    label: "Household",
    source: "Household Transactions",
    file: "/data/household_transactions.csv",
  },
];

function clean(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function field(row, ...names) {
  for (const name of names) {
    if (
      Object.prototype.hasOwnProperty.call(
        row,
        name
      )
    ) {
      const value = row[name];

      if (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
      ) {
        return value;
      }
    }
  }

  return "";
}

export function parseDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value;
  }

  const text = clean(value);

  if (!text) return null;

  /*
   * YYYY-MM-DD
   * YYYY-MM-DD HH:mm
   * YYYY-MM-DD HH:mm:ss
   *
   * Important:
   * Construct manually so the CSV's local time is preserved
   * exactly instead of letting the browser reinterpret it.
   */
  const iso = text.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]) - 1;
    const day = Number(iso[3]);
    const hours = Number(iso[4] || 0);
    const minutes = Number(iso[5] || 0);
    const seconds = Number(iso[6] || 0);

    const date = new Date(
      year,
      month,
      day,
      hours,
      minutes,
      seconds
    );

    if (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day &&
      date.getHours() === hours &&
      date.getMinutes() === minutes &&
      date.getSeconds() === seconds
    ) {
      return date;
    }
  }

  /*
   * DD/MM/YYYY
   * DD/MM/YYYY HH:mm
   * DD/MM/YYYY HH:mm:ss
   *
   * Household dataset.
   */
  const ddmmyyyy = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1]);
    const month = Number(ddmmyyyy[2]) - 1;
    const year = Number(ddmmyyyy[3]);
    const hours = Number(ddmmyyyy[4] || 0);
    const minutes = Number(ddmmyyyy[5] || 0);
    const seconds = Number(ddmmyyyy[6] || 0);

    const date = new Date(
      year,
      month,
      day,
      hours,
      minutes,
      seconds
    );

    if (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day &&
      date.getHours() === hours &&
      date.getMinutes() === minutes &&
      date.getSeconds() === seconds
    ) {
      return date;
    }
  }

  /*
   * MM/DD/YYYY
   * MM/DD/YYYY HH:mm
   *
   * India Transactions dataset.
   */
  const mmddyyyy = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/
  );

  if (mmddyyyy) {
    const month = Number(mmddyyyy[1]) - 1;
    const day = Number(mmddyyyy[2]);
    const year = Number(mmddyyyy[3]);
    const hours = Number(mmddyyyy[4] || 0);
    const minutes = Number(mmddyyyy[5] || 0);

    const date = new Date(
      year,
      month,
      day,
      hours,
      minutes,
      0
    );

    if (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day &&
      date.getHours() === hours &&
      date.getMinutes() === minutes
    ) {
      return date;
    }
  }

  /*
   * Final fallback for unexpected formats.
   */
  const fallback = new Date(text);

  if (!Number.isNaN(fallback.getTime())) {
    return fallback;
  }

  return null;
}

export function hour(value) {
  const date =
    value instanceof Date
      ? value
      : parseDate(value);

  if (!date) return 0;

  return date.getHours();
}

export function sameDay(a, b) {
  if (!a || !b) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dayDifference(a, b) {
  if (!a || !b) return 0;

  const first = new Date(a);
  const second = new Date(b);

  first.setHours(0, 0, 0, 0);
  second.setHours(0, 0, 0, 0);

  return Math.round(
    Math.abs(
      second.getTime() -
        first.getTime()
    ) / 86400000
  );
}

export function formatGap(minutes, same = true) {
  if (!same) {
    const days = Math.max(
      1,
      Math.round(minutes / 1440)
    );

    return `${days} day${
      days === 1 ? "" : "s"
    } apart`;
  }

  if (minutes < 1) {
    return "same moment";
  }

  if (minutes < 60) {
    return `${minutes} min apart`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return mins
    ? `${hours}h ${mins}m apart`
    : `${hours}h apart`;
}

export function connectionType(
  minutes,
  same
) {
  if (!same) {
    return "Different day";
  }

  if (minutes <= 10) {
    return "Almost simultaneous";
  }

  if (minutes <= 45) {
    return "Nearby moment";
  }

  if (minutes <= 120) {
    return "Same window";
  }

  if (minutes <= 300) {
    return "Same day";
  }

  return "Longer thread";
}

export function typeLabel(type) {
  if (type === "music") return "Music";
  if (type === "purchase") return "Purchase";
  if (type === "home") return "Household";

  return "Record";
}

function safeAmount(value) {
  const cleaned = clean(value)
    .replace(/,/g, "")
    .replace(/[₹$€£]/g, "");

  const amount = Number(cleaned);

  return Number.isFinite(amount)
    ? amount
    : 0;
}

function normaliseMusic(row, index) {
  const date = parseDate(
    field(
      row,
      "ts",
      "timestamp",
      "date"
    )
  );

  if (!date) return null;

  const title =
    clean(
      field(
        row,
        "track_name",
        "track",
        "song_name"
      )
    ) || "Unknown track";

  const artist =
    clean(
      field(
        row,
        "artist_name",
        "artist"
      )
    ) || "Unknown artist";

  const album = clean(
    field(
      row,
      "album_name",
      "album"
    )
  );

  const platform = clean(
    field(
      row,
      "platform",
      "platform_name"
    )
  );

  const skipped = clean(
    field(row, "skipped")
  );

  return {
    id: `music-${index}`,
    type: "music",
    source: "Spotify",
    title: title.slice(0, 180),
    subtitle: artist.slice(0, 180),
    meta: album.slice(0, 180),
    location: platform.slice(0, 120),
    amount: 0,
    date,
    skipped,
  };
}

function normalisePurchase(row, index) {
  /*
   * Actual India Transactions columns:
   * trans_date_trans_time
   * merchant
   * category
   * amt
   * city
   * state
   */
  const date = parseDate(
    field(
      row,
      "trans_date_trans_time",
      "timestamp",
      "date",
      "transaction_date"
    )
  );

  if (!date) return null;

  const title =
    clean(
      field(
        row,
        "merchant",
        "merchant_name",
        "description",
        "category"
      )
    ) || "Purchase";

  const category =
    clean(
      field(
        row,
        "category",
        "subcategory"
      )
    ) || "Transaction";

  const city = clean(
    field(
      row,
      "city",
      "location",
      "state"
    )
  );

  const amount = safeAmount(
    field(
      row,
      "amt",
      "amount",
      "transaction_amount"
    )
  );

  const paymentMethod = clean(
    field(
      row,
      "payment_method",
      "Mode",
      "mode"
    )
  );

  return {
    id: `purchase-${index}`,
    type: "purchase",
    source: "India Transactions",
    title: title.slice(0, 180),
    subtitle: category.slice(0, 180),
    meta: paymentMethod.slice(0, 120),
    location: city.slice(0, 120),
    amount,
    date,
  };
}

function normaliseHome(row, index) {
  /*
   * Actual Household columns:
   * Date
   * Mode
   * Category
   * Subcategory
   * Note
   * Amount
   * Income/Expense
   * Currency
   */
  const rawDate = field(
    row,
    "Date",
    "date",
    "datetime",
    "timestamp"
  );

  /*
   * Household dates are DD/MM/YYYY.
   */
  let date = null;

  const textDate = clean(rawDate);

  const match = textDate.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    const hours = Number(match[4] || 0);
    const minutes = Number(match[5] || 0);
    const seconds = Number(match[6] || 0);

    date = new Date(
      year,
      month,
      day,
      hours,
      minutes,
      seconds
    );
  } else {
    date = parseDate(textDate);
  }

  if (!date) return null;

  const title =
    clean(
      field(
        row,
        "Category",
        "category"
      )
    ) ||
    clean(
      field(
        row,
        "Subcategory",
        "subcategory"
      )
    ) ||
    "Household activity";

  const subtitle =
    clean(
      field(
        row,
        "Note",
        "note"
      )
    ) ||
    clean(
      field(
        row,
        "Subcategory",
        "subcategory"
      )
    ) ||
    "Everyday trace";

  const amount = safeAmount(
    field(
      row,
      "Amount",
      "amount"
    )
  );

  const mode = clean(
    field(
      row,
      "Mode",
      "mode"
    )
  );

  const incomeExpense = clean(
    field(
      row,
      "Income/Expense",
      "income_expense"
    )
  );

  return {
    id: `home-${index}`,
    type: "home",
    source: "Household Transactions",
    title: title.slice(0, 180),
    subtitle: subtitle.slice(0, 180),
    meta: `${mode}${
      mode && incomeExpense
        ? " · "
        : ""
    }${incomeExpense}`.slice(0, 120),
    location: "",
    amount,
    date,
  };
}

export function normalize(
  row,
  type,
  index
) {
  if (!row || typeof row !== "object") {
    return null;
  }

  if (type === "music") {
    return normaliseMusic(
      row,
      index
    );
  }

  if (type === "purchase") {
    return normalisePurchase(
      row,
      index
    );
  }

  if (type === "home") {
    return normaliseHome(
      row,
      index
    );
  }

  return null;
}

export function loadCSV(file, type) {
  return new Promise(
    (resolve, reject) => {
      Papa.parse(file, {
        download: true,
        header: true,
        skipEmptyLines: true,

        complete(results) {
          if (results.errors?.length) {
            console.warn(
              `CSV warnings for ${file}:`,
              results.errors.slice(0, 5)
            );
          }

          const rows = Array.isArray(
            results.data
          )
            ? results.data
            : [];

          const output = [];

          for (
            let i = 0;
            i < rows.length;
            i++
          ) {
            const normalized =
              normalize(
                rows[i],
                type,
                i
              );

            if (
              normalized?.date &&
              !Number.isNaN(
                normalized.date.getTime()
              )
            ) {
              output.push(
                normalized
              );
            }
          }

          console.log(
            `${type}: ${output.length} records loaded from ${file}`
          );

          resolve(output);
        },

        error(error) {
          reject(error);
        },
      });
    }
  );
}