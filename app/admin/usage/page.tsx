import { listUsage } from "@/lib/usage";
import { computeAdminStats } from "@/lib/admin-stats";
import { StatCard } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminUsagePage() {
  const [rawEvents, s] = await Promise.all([listUsage(), computeAdminStats()]);
  const sortedEvents = [...rawEvents].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 50);
  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>API & revenue</h2>
      <p style={{ color: "var(--calm-ink-70)", marginBottom: 32 }}>
        API spend is estimated against published pricing. Nothing is for sale yet.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 32,
        }}
      >
        <StatCard label="API spend, last 30 days" value={`$${s.api.last30d.totalCostUsd.toFixed(2)}`} />
        <StatCard label="API spend, all time" value={`$${s.api.totalCostUsd.toFixed(2)}`} hint="Nothing is for sale yet; this is cost only" />
        <StatCard label="Tokens in / out" value={`${s.api.totalTokensIn.toLocaleString()} / ${s.api.totalTokensOut.toLocaleString()}`} />
        <StatCard label="Model requests" value={s.api.llmRequests} />
        <StatCard label="Voice sessions" value={s.api.voiceRequests} />
      </div>

      <h3 style={{ marginBottom: 16 }}>Recent API sortedEvents</h3>
      {sortedEvents.length === 0 ? (
        <p style={{ color: "var(--calm-ink-40)", fontSize: 14 }}>No sortedEvents recorded yet.</p>
      ) : (
        <div style={{ background: "var(--calm-white)", border: "1px solid var(--calm-ink-10)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--calm-mist)" }}>
                <Th>When</Th>
                <Th>Service</Th>
                <Th>Tokens</Th>
                <Th>Duration</Th>
                <Th>Est. cost</Th>
                <Th>User</Th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((e, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--calm-ink-10)" }}>
                  <Td>{new Date(e.at).toLocaleString()}</Td>
                  <Td>{e.service}</Td>
                  <Td>{e.tokensIn ?? "—"} / {e.tokensOut ?? "—"}</Td>
                  <Td>{e.durationMs ? `${(e.durationMs / 1000).toFixed(1)}s` : "—"}</Td>
                  <Td>{e.estimatedCostUsd != null ? `$${e.estimatedCostUsd.toFixed(4)}` : "—"}</Td>
                  <Td style={{ color: "var(--calm-ink-70)", fontSize: 12 }}>{e.userId ?? "anon"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--calm-ink-70)" }}>
      {children}
    </th>
  );
}
function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "12px 16px", fontSize: 14, color: "var(--calm-ink)", ...style }}>{children}</td>;
}
