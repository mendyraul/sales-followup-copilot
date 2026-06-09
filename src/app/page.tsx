import { listFollowUpStages } from '../domain/followup';

const cardStyle: React.CSSProperties = {
  border: '1px solid #d0d7de',
  borderRadius: 12,
  padding: 16,
  background: '#fff'
};

export default function HomePage() {
  const stages = listFollowUpStages();

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif', background: '#f6f8fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 24 }}>
        <section style={{ display: 'grid', gap: 12 }}>
          <h1 style={{ margin: 0 }}>Sales Follow-Up Copilot</h1>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5 }}>
            Manual-safe MVP for moving leads from intake to reviewed follow-up without letting automation send anything on its own.
          </p>
        </section>

        <section style={{ ...cardStyle, display: 'grid', gap: 12 }}>
          <h2 style={{ margin: 0 }}>Follow-up sequence stages</h2>
          <p style={{ margin: 0, color: '#57606a' }}>
            The product now has an explicit stage model so humans can see where a lead sits in the outreach workflow and what should happen next.
          </p>
          <div style={{ display: 'grid', gap: 12 }}>
            {stages.map(stage => (
              <article key={stage.stage} style={{ border: '1px solid #eaeef2', borderRadius: 10, padding: 14, background: '#fdfdfd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <div>
                    <strong>{stage.label}</strong>
                    <div style={{ fontSize: 12, color: '#57606a', textTransform: 'uppercase', letterSpacing: 0.04 + 'em' }}>{stage.stage}</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{stage.progressPercent}% complete</div>
                </div>
                <p style={{ marginBottom: 8 }}>{stage.description}</p>
                <p style={{ margin: 0, color: '#0969da' }}>Next action: {stage.recommendedAction}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ ...cardStyle, display: 'grid', gap: 8 }}>
          <h2 style={{ margin: 0 }}>MVP status</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>Lead status transitions are already modeled.</li>
            <li>Queue logic, feedback capture, and timeline support are in place on the integration branch.</li>
            <li>Follow-up stages now define a shared workflow contract for draft, review, and send steps.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
