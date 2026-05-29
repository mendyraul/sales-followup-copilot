export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Sales Follow-Up Copilot</h1>
      <p>MVP scaffold is active. Milestone 1 implementation in progress.</p>
      <ul>
        <li>Lead CRUD: in progress</li>
        <li>Status pipeline: baseline rules added</li>
        <li>Dashboard: baseline route added</li>
      </ul>

      <section style={{ marginTop: 24 }}>
        <h2>Feedback Capture (MVP)</h2>
        <p>Capture qualitative feedback and a 1-5 rating per lead interaction.</p>
        <ol>
          <li>Select lead</li>
          <li>Set rating (1-5)</li>
          <li>Add notes for objections/outcomes</li>
        </ol>
      </section>
    </main>
  );
}
