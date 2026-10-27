"use client";
import { useState, type ReactNode } from "react";
type Row = { id: string };
type Props<T extends Row> = {
  items: T[];
  kind: string;
  leadId?: string;
  list?: boolean;
  render: (row: T) => ReactNode;
};
export function HistoryList<T extends Row>(props: Props<T>) {
  return <PagedHistory key={JSON.stringify(props.items)} {...props} />;
}
function PagedHistory<T extends Row>({
  items,
  kind,
  leadId,
  list = false,
  render,
}: Props<T>) {
  const [extra, setExtra] = useState<T[]>([]),
    [cursor, setCursor] = useState(items.at(-1)?.id),
    [done, setDone] = useState(!items.length),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function more() {
    setBusy(true);
    setError("");
    try {
      const query = new URLSearchParams({
        kind,
        ...(leadId ? { leadId } : {}),
        ...(cursor ? { cursor } : {}),
      });
      const response = await fetch("/api/history?" + query, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to load history.");
      setExtra((old) => [...old, ...data.items]);
      setCursor(data.nextCursor);
      setDone(!data.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load history.");
    } finally {
      setBusy(false);
    }
  }
  const control = (
    <>
      {!done && (
        <button
          className="secondary"
          disabled={busy}
          onClick={() => void more()}
        >
          Load older {kind}
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </>
  );
  return (
    <>
      {[...items, ...extra].map(render)}
      {list ? <li>{control}</li> : <div>{control}</div>}
    </>
  );
}
