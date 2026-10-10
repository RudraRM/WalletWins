export interface ImportedTransaction {
  id: string;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  paymentMode: "physical";
}

const CATEGORIES = [
  "Travel",
  "Dining",
  "Groceries",
  "Gas",
  "Delivery",
  "Streaming",
  "Shopping",
  "Entertainment",
  "General",
  "Other",
];

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseAmount(value: string) {
  const trimmed = value.trim();
  const isNegative = /^\(.*\)$/.test(trimmed);
  const number = Number(trimmed.replace(/[,$()\s]/g, ""));
  if (!Number.isFinite(number)) return null;
  return isNegative ? -number : number;
}

function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && char === delimiter) {
      row.push(cell.trim());
      cell = "";
    } else if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function normalizeDate(value: string): string | null {
  const trimmed = value.trim();
  const ofxDate = trimmed.match(/^(\d{4})(\d{2})(\d{2})/);
  if (ofxDate) return `${ofxDate[1]}-${ofxDate[2]}-${ofxDate[3]}`;

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function inferCategory(description: string, statementCategory?: string) {
  const supplied = statementCategory?.trim();
  if (supplied) {
    const match = CATEGORIES.find((category) => category.toLowerCase() === supplied.toLowerCase());
    if (match) return match;
  }

  const merchant = description.toLowerCase();
  const rules: Array<[RegExp, string]> = [
    [/airline|hotel|airbnb|uber\s*trip|lyft|railway|flight|travel/, "Travel"],
    [/restaurant|cafe|coffee|pizza|taco|burger|dining|doordash|grubhub|uber\s*eats/, "Dining"],
    [/grocery|market|supermarket|whole foods|trader joe|aldi|kroger|costco/, "Groceries"],
    [/shell|chevron|exxon|mobil|bp\b|fuel|gas station/, "Gas"],
    [/netflix|spotify|hulu|disney\+|youtube premium|subscription/, "Streaming"],
    [/amazon|target|walmart|best buy|shopping|store/, "Shopping"],
    [/movie|cinema|theatre|concert|ticket/, "Entertainment"],
    [/instacart|delivery/, "Delivery"],
  ];

  return rules.find(([pattern]) => pattern.test(merchant))?.[1] ?? "Other";
}

function isNonPurchase(description: string, type = "") {
  const nonPurchaseDescription = /payment|autopay|refund|return|cash advance|interest|fee|balance transfer|deposit|reversal/i;
  const nonPurchaseType = /payment|refund|return|credit|deposit|reversal|cashback|reward/i;
  return nonPurchaseDescription.test(description) || nonPurchaseType.test(type);
}

function csvTransactions(text: string): ImportedTransaction[] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiters = [",", "\t", ";"];
  const delimiter = delimiters.reduce((best, candidate) =>
    (firstLine.split(candidate).length > firstLine.split(best).length ? candidate : best), ",");
  const rows = parseDelimited(text.replace(/^\uFEFF/, ""), delimiter);
  if (rows.length < 2) throw new Error("The CSV file has no transaction rows.");

  const headers = rows[0].map(normalizeHeader);
  const findColumn = (names: string[]) => headers.findIndex((header) => names.includes(header));
  const dateIndex = findColumn(["date", "transactiondate", "posteddate", "postingdate", "transdate"]);
  const merchantIndex = findColumn(["description", "merchant", "merchantname", "name", "payee", "transactiondescription", "details"]);
  const amountIndex = findColumn(["amount", "transactionamount", "debitamount"]);
  const debitIndex = findColumn(["debit", "withdrawal", "charge", "debits"]);
  const creditIndex = findColumn(["credit", "deposit", "credits"]);
  const categoryIndex = findColumn(["category", "transactioncategory", "spendingcategory"]);
  const typeIndex = findColumn(["type", "transactiontype", "transaction"]);

  if (dateIndex < 0 || merchantIndex < 0 || (amountIndex < 0 && debitIndex < 0 && creditIndex < 0)) {
    throw new Error("Couldn't find transaction columns. Include Date, Description, and Amount (or Debit/Credit) headers.");
  }

  const transactions: ImportedTransaction[] = [];
  rows.slice(1).forEach((row, rowIndex) => {
    const merchant = row[merchantIndex]?.trim();
    const date = normalizeDate(row[dateIndex] ?? "");
    if (!merchant || !date) return;

    let amount: number | null = null;
    if (debitIndex >= 0) {
      amount = parseAmount(row[debitIndex] ?? "");
      if (amount === null || amount === 0) return;
      amount = Math.abs(amount);
    } else if (amountIndex >= 0) {
      amount = parseAmount(row[amountIndex] ?? "");
      if (amount === null) return;
      amount = Math.abs(amount);
    }

    if (!amount || amount <= 0 || isNonPurchase(merchant, row[typeIndex] ?? "")) return;
    transactions.push({
      id: `row-${rowIndex}`,
      date,
      merchant,
      category: inferCategory(merchant, row[categoryIndex]),
      amount: Math.round(amount * 100) / 100,
      paymentMode: "physical",
    });
  });

  return transactions;
}

function ofxTransactions(text: string): ImportedTransaction[] {
  const blocks = text.match(/<STMTTRN>[\s\S]*?(?=<STMTTRN>|<\/BANKTRANLIST>|$)/gi) ?? [];
  return blocks.flatMap((block, index) => {
    const read = (tag: string) =>
      block.match(new RegExp(`<${tag}>([^<\\r\\n]+)`, "i"))?.[1]?.trim() ?? "";
    const amountValue = parseAmount(read("TRNAMT"));
    const date = normalizeDate(read("DTPOSTED"));
    const merchant = read("NAME") || read("MEMO");
    const description = `${merchant} ${read("TRNTYPE")}`;
    if (!amountValue || amountValue >= 0 || !date || !merchant || isNonPurchase(description)) return [];

    return [{
      id: `row-${index}`,
      date,
      merchant,
      category: inferCategory(merchant),
      amount: Math.round(Math.abs(amountValue) * 100) / 100,
      paymentMode: "physical" as const,
    }];
  });
}

export function parseStatement(text: string, fileName: string): ImportedTransaction[] {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const transactions = extension === "ofx" || extension === "qfx"
    ? ofxTransactions(text)
    : csvTransactions(text);

  if (transactions.length === 0) {
    throw new Error("No purchases were found. Export a CSV or OFX file with posted debit transactions and try again.");
  }
  if (transactions.length > 5000) {
    throw new Error("This statement has more than 5,000 purchases. Split it into smaller files before importing.");
  }
  return transactions;
}
