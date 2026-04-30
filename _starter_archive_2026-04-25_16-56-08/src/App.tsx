import './App.css'

function App() {
  return (
    <div className="cth-shell">
      <aside className="cth-sidebar">
        <div className="cth-brand">
          <div className="cth-mark">CTH</div>
          <div>
            <strong>Core Truth House</strong>
            <span>Brand OS</span>
          </div>
        </div>

        <nav className="cth-nav">
          <button className="active">Dashboard</button>
          <button>Brand Foundation</button>
          <button>Campaign Builder</button>
          <button>Social Manager</button>
          <button>Media Studio</button>
        </nav>
      </aside>

      <main className="cth-main">
        <header className="cth-topbar">
          <div>
            <p>Command Center</p>
            <h1>Build the brand system people remember.</h1>
          </div>
          <button className="cth-cta">Create Campaign</button>
        </header>

        <section className="cth-grid">
          <article className="cth-card hero">
            <p className="eyebrow">Brand Infrastructure</p>
            <h2>Structure first. Beauty second. Trust always.</h2>
            <p>
              Core Truth House is being rebuilt as a clean, owned system with
              crimson structure, gold accents, and ivory support.
            </p>
          </article>

          <article className="cth-card">
            <p className="eyebrow">Today</p>
            <h3>Clean foundation active</h3>
            <p>No Jumbo dependency. No stale layout stack. One Core Truth House direction.</p>
          </article>

          <article className="cth-card">
            <p className="eyebrow">Next</p>
            <h3>Port only what matters</h3>
            <p>We extract patterns from references, then rebuild them in your own system.</p>
          </article>
        </section>
      </main>
    </div>
  )
}

export default App
