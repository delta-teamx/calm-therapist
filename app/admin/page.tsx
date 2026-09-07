import { StatCard } from "@/components/admin/AdminShell";
import { GrowthCharts } from "@/components/admin/GrowthCharts";
import { computeAdminStats } from "@/lib/admin-stats";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const s = await computeAdminStats();
  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Overview</h2>
      <p style={{ color: "var(--calm-ink-70)", marginBottom: 32 }}>
        Live state from the in-memory MVP store. Numbers reset on server restart until Prisma is wired up.
      </p>

      <GrowthCharts />

      <Section title="Acquisition">
        <Grid>
          <StatCard label="Total signups" value={s.signups.total} hint={`${s.signups.last7d} in last 7d · ${s.signups.last30d} in 30d`} />
          <StatCard label="Total leads (popup)" value={s.leads.total} hint={`${s.leads.last7d} in last 7d`} />
          <StatCard label="Lead → signup" value={`${s.conversion.leadsToSignups}%`} />
          <StatCard label="Email verified" value={`${s.conversion.verified}%`} />
        </Grid>
      </Section>

      <Section title="Engagement">
        <Grid>
          <StatCard label="Live users (5 min)" value={s.liveUsers} hint="Active API events in the last 5 minutes" />
          <StatCard label="Recurring users" value={s.recurringUsers} hint="Active on two or more days in the last 30" />
          <StatCard label="Model requests" value={s.api.llmRequests} hint={`${s.api.totalTokensIn.toLocaleString()} in / ${s.api.totalTokensOut.toLocaleString()} out`} />
          <StatCard label="Voice sessions" value={s.api.voiceRequests} />
        </Grid>
      </Section>

      <Section title="Founding period and cost">
        <Grid>
          <StatCard label="Founding seats" value={`${s.founding.seatsTaken} / ${s.founding.cap}`} hint="Free for four months each" />
          <StatCard label="Circles gate" value={`${Math.min(s.signups.total, s.founding.circlesOpenAt)} / ${s.founding.circlesOpenAt}`} hint="Circles open at this many members" />
          <StatCard label="API spend, last 30 days" value={`$${s.api.last30d.totalCostUsd.toFixed(2)}`} hint={`${s.api.last30d.llmRequests} model · ${s.api.last30d.voiceRequests} voice`} />
          <StatCard label="API spend, all time" value={`$${s.api.totalCostUsd.toFixed(2)}`} hint="Model + voice estimate" />
        </Grid>
      </Section>

      <Section title="Feedback">
        <Grid>
          <StatCard label="Total feedback" value={s.feedback.total} />
          <StatCard label="Average rating" value={s.feedback.average || "—"} hint="Across all sessions" />
          <StatCard label="Positive (4★+)" value={s.feedback.positive} />
          <StatCard label="Needs attention (<3★)" value={s.feedback.needsAttention} hint="Visible in Feedback tab" />
        </Grid>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 12 }}>{title}</p>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}
