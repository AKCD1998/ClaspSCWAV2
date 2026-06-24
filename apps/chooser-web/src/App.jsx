import { Routes, Route, Navigate } from "react-router-dom";
import { navigationConfig } from "./navigationConfig.js";

function LinkCard({ item }) {
  const disabled = !item.href;

  return (
    <article className={`menu-card accent-${item.accent}${disabled ? " is-disabled" : ""}`}>
      <div className="menu-card__eyebrow">Workflow</div>
      <h2>{item.title}</h2>
      <p>{item.description}</p>
      {disabled ? (
        <button type="button" className="menu-card__button" disabled>
          รอตั้งค่า URL
        </button>
      ) : (
        <a
          className="menu-card__button"
          href={item.href}
          target={item.target || "_self"}
          rel={item.target === "_blank" ? "noreferrer noopener" : undefined}
        >
          เริ่มต้นใช้งาน
        </a>
      )}
    </article>
  );
}

function HomePage() {
  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-panel__badge">React Shell</div>
        <h1>{navigationConfig.title}</h1>
        <p>{navigationConfig.subtitle}</p>
      </section>

      <section className="menu-section" aria-label="Main navigation">
        <div className="menu-grid">
          {navigationConfig.items.map((item) => (
            <LinkCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
