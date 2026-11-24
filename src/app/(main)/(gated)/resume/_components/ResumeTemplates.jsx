import React from "react";

// ──────────────────────────────────────────────────────────────────────────
// TEMPLATE 1 — Modern Professional
// Two-column layout. Sidebar with photo/contact/skills. Main with experience.
// ──────────────────────────────────────────────────────────────────────────
export const ModernProTemplate = ({ data, photo }) => (
  <div style={{ background: "#fff", color: "#1a1a2e", minHeight: "100%", fontFamily: "'Inter', 'Segoe UI', sans-serif", display: "flex" }}>
    {/* Sidebar */}
    <div style={{ width: "32%", background: "#1a3a5c", color: "#fff", padding: "40px 24px", flexShrink: 0 }}>
      {photo && (
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <img src={photo} alt="Profile" style={{ width: "110px", height: "110px", borderRadius: "50%", objectFit: "cover", border: "3px solid #4a9fd4", display: "block", margin: "0 auto" }} />
        </div>
      )}
      <h2 style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#4a9fd4", marginBottom: "12px", borderBottom: "1px solid #4a9fd4", paddingBottom: "6px" }}>Contact</h2>
      <div style={{ fontSize: "11px", lineHeight: "1.7", marginBottom: "28px", color: "#c8dce8" }}>
        {data.contactInfo?.email && <p style={{ marginBottom: "4px" }}>✉ {data.contactInfo.email}</p>}
        {data.contactInfo?.mobile && <p style={{ marginBottom: "4px" }}>✆ {data.contactInfo.mobile}</p>}
        {data.contactInfo?.linkedin && <p style={{ marginBottom: "4px", wordBreak: "break-all" }}>in linkedin.com</p>}
      </div>
      <h2 style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#4a9fd4", marginBottom: "12px", borderBottom: "1px solid #4a9fd4", paddingBottom: "6px" }}>Skills</h2>
      <div style={{ fontSize: "11px", lineHeight: "1.8", color: "#c8dce8" }}>
        {data.skills?.split(/[,·•\n]/).filter(Boolean).map((s, i) => (
          <div key={i} style={{ marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4a9fd4", flexShrink: 0, display: "inline-block" }} />
            {s.trim()}
          </div>
        ))}
      </div>
    </div>

    {/* Main Content */}
    <div style={{ flex: 1, padding: "40px 32px" }}>
      <div style={{ marginBottom: "28px", borderBottom: "2px solid #1a3a5c", paddingBottom: "16px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#1a3a5c", margin: 0, lineHeight: 1.1 }}>
          {data.contactInfo?.fullName || "Your Name"}
        </h1>
        <p style={{ fontSize: "14px", color: "#4a9fd4", marginTop: "6px", fontWeight: 500 }}>Professional</p>
      </div>

      {data.summary && (
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#1a3a5c", marginBottom: "10px" }}>Summary</h2>
          <p style={{ fontSize: "11.5px", lineHeight: "1.7", color: "#444" }}>{data.summary}</p>
        </div>
      )}

      {data.experience?.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#1a3a5c", marginBottom: "14px", borderBottom: "1px solid #dde3ea", paddingBottom: "6px" }}>Experience</h2>
          {data.experience.map((exp, idx) => (
            <div key={idx} style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1a3a5c", margin: 0 }}>{exp.title}</h3>
                <span style={{ fontSize: "10.5px", color: "#888", whiteSpace: "nowrap", marginLeft: "8px" }}>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
              </div>
              <p style={{ fontSize: "11.5px", color: "#4a9fd4", fontWeight: 600, margin: "3px 0" }}>{exp.organization}</p>
              {exp.description && <p style={{ fontSize: "11px", color: "#555", lineHeight: "1.6", whiteSpace: "pre-wrap", marginTop: "4px" }}>{exp.description}</p>}
            </div>
          ))}
        </div>
      )}

      {data.education?.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#1a3a5c", marginBottom: "14px", borderBottom: "1px solid #dde3ea", paddingBottom: "6px" }}>Education</h2>
          {data.education.map((edu, idx) => (
            <div key={idx} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1a3a5c", margin: 0 }}>{edu.title}</h3>
                <span style={{ fontSize: "10.5px", color: "#888" }}>{edu.startDate} – {edu.current ? "Present" : edu.endDate}</span>
              </div>
              <p style={{ fontSize: "11.5px", color: "#4a9fd4", margin: "3px 0" }}>{edu.organization}</p>
            </div>
          ))}
        </div>
      )}

      {data.projects?.length > 0 && (
        <div>
          <h2 style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#1a3a5c", marginBottom: "14px", borderBottom: "1px solid #dde3ea", paddingBottom: "6px" }}>Projects</h2>
          {data.projects.map((proj, idx) => (
            <div key={idx} style={{ marginBottom: "12px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1a3a5c", margin: 0 }}>{proj.title}</h3>
              {proj.description && <p style={{ fontSize: "11px", color: "#555", lineHeight: "1.6", whiteSpace: "pre-wrap", marginTop: "4px" }}>{proj.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────
// TEMPLATE 2 — Minimal Classic
// Single-column, ATS-friendly, serif typography.
// ──────────────────────────────────────────────────────────────────────────
export const MinimalClassicTemplate = ({ data }) => (
  <div style={{ background: "#fff", color: "#222", minHeight: "100%", fontFamily: "'Georgia', 'Times New Roman', serif", padding: "52px 56px" }}>
    {/* Header */}
    <div style={{ textAlign: "center", marginBottom: "28px", paddingBottom: "20px", borderBottom: "2px solid #222" }}>
      <h1 style={{ fontSize: "30px", fontWeight: 700, letterSpacing: "1px", margin: 0, textTransform: "uppercase" }}>
        {data.contactInfo?.fullName || "Your Name"}
      </h1>
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "16px", marginTop: "10px", fontSize: "11.5px", color: "#555" }}>
        {data.contactInfo?.email && <span>{data.contactInfo.email}</span>}
        {data.contactInfo?.mobile && <span>•</span>}
        {data.contactInfo?.mobile && <span>{data.contactInfo.mobile}</span>}
        {data.contactInfo?.linkedin && <span>•</span>}
        {data.contactInfo?.linkedin && <span>linkedin.com</span>}
      </div>
    </div>

    {data.summary && (
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", borderBottom: "1px solid #ccc", paddingBottom: "4px", marginBottom: "10px" }}>Professional Summary</h2>
        <p style={{ fontSize: "11.5px", lineHeight: "1.75", color: "#333" }}>{data.summary}</p>
      </div>
    )}

    {data.experience?.length > 0 && (
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", borderBottom: "1px solid #ccc", paddingBottom: "4px", marginBottom: "14px" }}>Experience</h2>
        {data.experience.map((exp, idx) => (
          <div key={idx} style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, margin: 0 }}>{exp.title}</h3>
              <span style={{ fontSize: "11px", color: "#666", fontStyle: "italic" }}>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
            </div>
            <p style={{ fontSize: "12px", fontStyle: "italic", color: "#444", margin: "3px 0 6px" }}>{exp.organization}</p>
            {exp.description && <p style={{ fontSize: "11px", lineHeight: "1.65", color: "#444", whiteSpace: "pre-wrap" }}>{exp.description}</p>}
          </div>
        ))}
      </div>
    )}

    {data.education?.length > 0 && (
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", borderBottom: "1px solid #ccc", paddingBottom: "4px", marginBottom: "14px" }}>Education</h2>
        {data.education.map((edu, idx) => (
          <div key={idx} style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, margin: 0 }}>{edu.title}</h3>
              <span style={{ fontSize: "11px", color: "#666", fontStyle: "italic" }}>{edu.startDate} – {edu.current ? "Present" : edu.endDate}</span>
            </div>
            <p style={{ fontSize: "12px", fontStyle: "italic", color: "#444", margin: "3px 0" }}>{edu.organization}</p>
          </div>
        ))}
      </div>
    )}

    {data.skills && (
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", borderBottom: "1px solid #ccc", paddingBottom: "4px", marginBottom: "10px" }}>Skills</h2>
        <p style={{ fontSize: "11.5px", lineHeight: "1.7", color: "#333" }}>{data.skills}</p>
      </div>
    )}

    {data.projects?.length > 0 && (
      <div>
        <h2 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", borderBottom: "1px solid #ccc", paddingBottom: "4px", marginBottom: "14px" }}>Projects</h2>
        {data.projects.map((proj, idx) => (
          <div key={idx} style={{ marginBottom: "12px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, margin: 0 }}>{proj.title}</h3>
            {proj.description && <p style={{ fontSize: "11px", lineHeight: "1.65", color: "#444", marginTop: "4px", whiteSpace: "pre-wrap" }}>{proj.description}</p>}
          </div>
        ))}
      </div>
    )}
  </div>
);

// ──────────────────────────────────────────────────────────────────────────
// TEMPLATE 3 — Creative Bold
// Bold gradient header, two-column card layout below.
// ──────────────────────────────────────────────────────────────────────────
export const CreativeBoldTemplate = ({ data, photo }) => (
  <div style={{ background: "#f8f7ff", color: "#1a1a2e", minHeight: "100%", fontFamily: "'Poppins', 'Segoe UI', sans-serif" }}>
    {/* Header */}
    <div style={{ background: "linear-gradient(135deg, #6c3fc9 0%, #d63384 100%)", padding: "40px 40px 30px", color: "#fff", display: "flex", alignItems: "center", gap: "28px" }}>
      {photo && <img src={photo} alt="Profile" style={{ width: "100px", height: "100px", borderRadius: "16px", objectFit: "cover", border: "3px solid rgba(255,255,255,0.4)", flexShrink: 0 }} />}
      <div>
        <h1 style={{ fontSize: "34px", fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: "-0.5px" }}>{data.contactInfo?.fullName || "Your Name"}</h1>
        <p style={{ fontSize: "14px", opacity: 0.85, marginTop: "6px", fontWeight: 500 }}>Creative Professional</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "10px", fontSize: "11px", opacity: 0.8 }}>
          {data.contactInfo?.email && <span>✉ {data.contactInfo.email}</span>}
          {data.contactInfo?.mobile && <span>✆ {data.contactInfo.mobile}</span>}
        </div>
      </div>
    </div>

    {/* Body */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", padding: "32px 32px" }}>
      {/* Left column */}
      <div style={{ paddingRight: "24px", borderRight: "1px solid #e0daf5" }}>
        {data.summary && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "13px", fontWeight: 700, color: "#6c3fc9", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "10px" }}>About Me</h2>
            <p style={{ fontSize: "11.5px", lineHeight: "1.7", color: "#444" }}>{data.summary}</p>
          </div>
        )}
        {data.skills && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "13px", fontWeight: 700, color: "#6c3fc9", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "10px" }}>Skills</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {data.skills.split(/[,·•\n]/).filter(Boolean).map((s, i) => (
                <span key={i} style={{ background: "#f0ebff", color: "#6c3fc9", fontSize: "10.5px", padding: "3px 10px", borderRadius: "20px", fontWeight: 600 }}>{s.trim()}</span>
              ))}
            </div>
          </div>
        )}
        {data.education?.length > 0 && (
          <div>
            <h2 style={{ fontSize: "13px", fontWeight: 700, color: "#6c3fc9", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "12px" }}>Education</h2>
            {data.education.map((edu, idx) => (
              <div key={idx} style={{ background: "#f0ebff", borderRadius: "10px", padding: "12px 14px", marginBottom: "10px" }}>
                <h3 style={{ fontSize: "12px", fontWeight: 700, margin: 0, color: "#3d1a80" }}>{edu.title}</h3>
                <p style={{ fontSize: "11px", color: "#6c3fc9", margin: "3px 0" }}>{edu.organization}</p>
                <p style={{ fontSize: "10.5px", color: "#888", margin: 0 }}>{edu.startDate} – {edu.current ? "Present" : edu.endDate}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right column */}
      <div style={{ paddingLeft: "24px" }}>
        {data.experience?.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "13px", fontWeight: 700, color: "#d63384", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "12px" }}>Experience</h2>
            {data.experience.map((exp, idx) => (
              <div key={idx} style={{ background: "#fff", borderRadius: "10px", padding: "14px", marginBottom: "10px", borderLeft: "3px solid #d63384" }}>
                <h3 style={{ fontSize: "12.5px", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>{exp.title}</h3>
                <p style={{ fontSize: "11px", color: "#d63384", fontWeight: 600, margin: "3px 0" }}>{exp.organization}</p>
                <p style={{ fontSize: "10.5px", color: "#888", marginBottom: "6px" }}>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</p>
                {exp.description && <p style={{ fontSize: "11px", color: "#555", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{exp.description}</p>}
              </div>
            ))}
          </div>
        )}
        {data.projects?.length > 0 && (
          <div>
            <h2 style={{ fontSize: "13px", fontWeight: 700, color: "#d63384", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "12px" }}>Projects</h2>
            {data.projects.map((proj, idx) => (
              <div key={idx} style={{ background: "#fff5fa", borderRadius: "10px", padding: "14px", marginBottom: "10px" }}>
                <h3 style={{ fontSize: "12.5px", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>{proj.title}</h3>
                {proj.description && <p style={{ fontSize: "11px", color: "#555", lineHeight: "1.6", marginTop: "6px", whiteSpace: "pre-wrap" }}>{proj.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────
// TEMPLATE 4 — Executive Elite
// Dark charcoal sidebar. Gold accents. Luxury high-end feel.
// ──────────────────────────────────────────────────────────────────────────
export const ExecutiveEliteTemplate = ({ data, photo }) => (
  <div style={{ background: "#fff", color: "#1c1c1c", minHeight: "100%", fontFamily: "'Garamond', 'Palatino', 'Georgia', serif", display: "flex" }}>
    {/* Dark Sidebar */}
    <div style={{ width: "30%", background: "#1c1c2e", color: "#f0e6c8", padding: "44px 24px", flexShrink: 0 }}>
      {photo && (
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <img src={photo} alt="Profile" style={{ width: "120px", height: "120px", borderRadius: "0", objectFit: "cover", border: "2px solid #c9a84c", display: "block", margin: "0 auto" }} />
        </div>
      )}
      <div style={{ borderBottom: "1px solid #c9a84c", paddingBottom: "20px", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#f0e6c8", lineHeight: 1.2, margin: 0 }}>{data.contactInfo?.fullName || "Your Name"}</h1>
        <p style={{ fontSize: "11px", color: "#c9a84c", marginTop: "6px", letterSpacing: "1.5px", textTransform: "uppercase" }}>Executive</p>
      </div>
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "10px", fontWeight: 700, color: "#c9a84c", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>Contact</h3>
        {data.contactInfo?.email && <p style={{ fontSize: "10.5px", color: "#c0b49a", marginBottom: "6px", wordBreak: "break-all" }}>{data.contactInfo.email}</p>}
        {data.contactInfo?.mobile && <p style={{ fontSize: "10.5px", color: "#c0b49a", marginBottom: "6px" }}>{data.contactInfo.mobile}</p>}
      </div>
      {data.skills && (
        <div>
          <h3 style={{ fontSize: "10px", fontWeight: 700, color: "#c9a84c", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>Core Competencies</h3>
          {data.skills.split(/[,·•\n]/).filter(Boolean).map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px" }}>
              <span style={{ width: "4px", height: "4px", background: "#c9a84c", flexShrink: 0, display: "inline-block" }} />
              <span style={{ fontSize: "10.5px", color: "#c0b49a" }}>{s.trim()}</span>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Main */}
    <div style={{ flex: 1, padding: "44px 36px" }}>
      {data.summary && (
        <div style={{ marginBottom: "28px", paddingBottom: "20px", borderBottom: "1px solid #e8e0d0" }}>
          <h2 style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#c9a84c", marginBottom: "10px" }}>Executive Summary</h2>
          <p style={{ fontSize: "12px", lineHeight: "1.8", color: "#333" }}>{data.summary}</p>
        </div>
      )}

      {data.experience?.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#c9a84c", marginBottom: "18px" }}>Professional Experience</h2>
          {data.experience.map((exp, idx) => (
            <div key={idx} style={{ marginBottom: "20px", paddingLeft: "16px", borderLeft: "2px solid #e8e0d0" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1c1c2e", margin: 0 }}>{exp.title}</h3>
                <span style={{ fontSize: "10.5px", color: "#888", fontStyle: "italic", whiteSpace: "nowrap", marginLeft: "8px" }}>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
              </div>
              <p style={{ fontSize: "12px", color: "#c9a84c", fontStyle: "italic", margin: "4px 0 8px" }}>{exp.organization}</p>
              {exp.description && <p style={{ fontSize: "11px", lineHeight: "1.7", color: "#444", whiteSpace: "pre-wrap" }}>{exp.description}</p>}
            </div>
          ))}
        </div>
      )}

      {data.education?.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#c9a84c", marginBottom: "14px" }}>Education</h2>
          {data.education.map((edu, idx) => (
            <div key={idx} style={{ marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1c1c2e", margin: 0 }}>{edu.title}</h3>
                <p style={{ fontSize: "11.5px", color: "#888", fontStyle: "italic", margin: "3px 0 0" }}>{edu.organization}</p>
              </div>
              <span style={{ fontSize: "10.5px", color: "#888", whiteSpace: "nowrap", marginLeft: "8px" }}>{edu.startDate} – {edu.current ? "Present" : edu.endDate}</span>
            </div>
          ))}
        </div>
      )}

      {data.projects?.length > 0 && (
        <div>
          <h2 style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#c9a84c", marginBottom: "14px" }}>Key Initiatives</h2>
          {data.projects.map((proj, idx) => (
            <div key={idx} style={{ marginBottom: "14px", paddingLeft: "16px", borderLeft: "2px solid #e8e0d0" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1c1c2e", margin: 0 }}>{proj.title}</h3>
              {proj.description && <p style={{ fontSize: "11px", lineHeight: "1.7", color: "#444", marginTop: "4px", whiteSpace: "pre-wrap" }}>{proj.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────
// TEMPLATE 5 — Tech Modern
// Clean, structured, monospace-flavored developer resume. No color gimmicks.
// ──────────────────────────────────────────────────────────────────────────
export const TechModernTemplate = ({ data }) => (
  <div style={{ background: "#0d1117", color: "#e6edf3", minHeight: "100%", fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace", padding: "44px 44px" }}>
    {/* Header */}
    <div style={{ borderBottom: "1px solid #30363d", paddingBottom: "24px", marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <p style={{ fontSize: "11px", color: "#58a6ff", margin: "0 0 4px", letterSpacing: "1px" }}>// developer profile</p>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#e6edf3", margin: 0, letterSpacing: "-1px" }}>
          {data.contactInfo?.fullName || "Your Name"}
        </h1>
      </div>
      <div style={{ textAlign: "right", fontSize: "10.5px", color: "#8b949e", lineHeight: 1.8 }}>
        {data.contactInfo?.email && <p style={{ margin: 0 }}>{data.contactInfo.email}</p>}
        {data.contactInfo?.mobile && <p style={{ margin: 0 }}>{data.contactInfo.mobile}</p>}
      </div>
    </div>

    {/* Skills chips */}
    {data.skills && (
      <div style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "10.5px", color: "#58a6ff", marginBottom: "10px" }}>const skills = [</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", paddingLeft: "16px" }}>
          {data.skills.split(/[,·•\n]/).filter(Boolean).map((s, i) => (
            <span key={i} style={{ background: "#161b22", border: "1px solid #30363d", color: "#79c0ff", fontSize: "10.5px", padding: "3px 10px", borderRadius: "4px" }}>"{s.trim()}"</span>
          ))}
        </div>
        <p style={{ fontSize: "10.5px", color: "#58a6ff", marginTop: "8px" }}>]</p>
      </div>
    )}

    {data.summary && (
      <div style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "10.5px", color: "#3fb950", marginBottom: "8px" }}>/** Professional Summary */</p>
        <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "6px", padding: "16px" }}>
          <p style={{ fontSize: "11.5px", lineHeight: "1.7", color: "#c9d1d9", margin: 0 }}>{data.summary}</p>
        </div>
      </div>
    )}

    {data.experience?.length > 0 && (
      <div style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "10.5px", color: "#3fb950", marginBottom: "12px" }}>/** Work Experience */</p>
        {data.experience.map((exp, idx) => (
          <div key={idx} style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "6px", padding: "16px", marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#f0f6fc", margin: 0 }}>{exp.title}</h3>
              <span style={{ fontSize: "10.5px", color: "#8b949e" }}>{exp.startDate} → {exp.current ? "now" : exp.endDate}</span>
            </div>
            <p style={{ fontSize: "11px", color: "#58a6ff", margin: "5px 0 8px" }}>@ {exp.organization}</p>
            {exp.description && <p style={{ fontSize: "11px", color: "#8b949e", lineHeight: "1.65", whiteSpace: "pre-wrap", margin: 0 }}>{exp.description}</p>}
          </div>
        ))}
      </div>
    )}

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      {data.education?.length > 0 && (
        <div>
          <p style={{ fontSize: "10.5px", color: "#3fb950", marginBottom: "10px" }}>/** Education */</p>
          {data.education.map((edu, idx) => (
            <div key={idx} style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "6px", padding: "14px", marginBottom: "8px" }}>
              <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#f0f6fc", margin: 0 }}>{edu.title}</h3>
              <p style={{ fontSize: "11px", color: "#58a6ff", margin: "4px 0 2px" }}>{edu.organization}</p>
              <p style={{ fontSize: "10.5px", color: "#8b949e", margin: 0 }}>{edu.startDate} – {edu.current ? "Present" : edu.endDate}</p>
            </div>
          ))}
        </div>
      )}
      {data.projects?.length > 0 && (
        <div>
          <p style={{ fontSize: "10.5px", color: "#3fb950", marginBottom: "10px" }}>/** Projects */</p>
          {data.projects.map((proj, idx) => (
            <div key={idx} style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "6px", padding: "14px", marginBottom: "8px" }}>
              <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#f0f6fc", margin: 0 }}>{proj.title}</h3>
              {proj.description && <p style={{ fontSize: "10.5px", color: "#8b949e", lineHeight: "1.65", marginTop: "6px", whiteSpace: "pre-wrap" }}>{proj.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────
// TEMPLATE 6 — Academic Formal
// Single-column, traditional serif academic CV.
// ──────────────────────────────────────────────────────────────────────────
export const AcademicFormalTemplate = ({ data }) => (
  <div style={{ background: "#fff", color: "#1a1a1a", minHeight: "100%", fontFamily: "'Garamond', 'Book Antiqua', 'Palatino', serif", padding: "56px 64px" }}>
    {/* Header */}
    <div style={{ textAlign: "center", marginBottom: "32px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", margin: 0, color: "#1a1a1a" }}>
        {data.contactInfo?.fullName || "Your Name"}
      </h1>
      <div style={{ width: "60px", height: "3px", background: "#8b4513", margin: "14px auto" }} />
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "20px", fontSize: "11px", color: "#555" }}>
        {data.contactInfo?.email && <span>{data.contactInfo.email}</span>}
        {data.contactInfo?.mobile && <span>{data.contactInfo.mobile}</span>}
      </div>
    </div>

    {data.summary && (
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2.5px", color: "#8b4513", borderBottom: "1.5px solid #8b4513", paddingBottom: "4px", marginBottom: "10px" }}>Research Profile</h2>
        <p style={{ fontSize: "12px", lineHeight: "1.8", textAlign: "justify", color: "#333" }}>{data.summary}</p>
      </div>
    )}

    {data.experience?.length > 0 && (
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2.5px", color: "#8b4513", borderBottom: "1.5px solid #8b4513", paddingBottom: "4px", marginBottom: "16px" }}>Professional Experience</h2>
        {data.experience.map((exp, idx) => (
          <div key={idx} style={{ marginBottom: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, margin: 0 }}>{exp.title}</h3>
              <span style={{ fontSize: "11px", color: "#666", fontStyle: "italic" }}>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
            </div>
            <p style={{ fontSize: "12px", fontStyle: "italic", color: "#555", margin: "4px 0 6px" }}>{exp.organization}</p>
            {exp.description && <p style={{ fontSize: "11.5px", lineHeight: "1.7", textAlign: "justify", color: "#333", whiteSpace: "pre-wrap" }}>{exp.description}</p>}
          </div>
        ))}
      </div>
    )}

    {data.education?.length > 0 && (
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2.5px", color: "#8b4513", borderBottom: "1.5px solid #8b4513", paddingBottom: "4px", marginBottom: "16px" }}>Education</h2>
        {data.education.map((edu, idx) => (
          <div key={idx} style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, margin: 0 }}>{edu.title}</h3>
              <span style={{ fontSize: "11px", color: "#666", fontStyle: "italic" }}>{edu.startDate} – {edu.current ? "Present" : edu.endDate}</span>
            </div>
            <p style={{ fontSize: "12px", fontStyle: "italic", color: "#555", margin: "3px 0" }}>{edu.organization}</p>
            {edu.description && <p style={{ fontSize: "11.5px", lineHeight: "1.65", color: "#333", marginTop: "4px" }}>{edu.description}</p>}
          </div>
        ))}
      </div>
    )}

    {data.skills && (
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2.5px", color: "#8b4513", borderBottom: "1.5px solid #8b4513", paddingBottom: "4px", marginBottom: "10px" }}>Skills & Competencies</h2>
        <p style={{ fontSize: "12px", lineHeight: "1.75", color: "#333" }}>{data.skills}</p>
      </div>
    )}

    {data.projects?.length > 0 && (
      <div>
        <h2 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2.5px", color: "#8b4513", borderBottom: "1.5px solid #8b4513", paddingBottom: "4px", marginBottom: "16px" }}>Publications & Projects</h2>
        {data.projects.map((proj, idx) => (
          <div key={idx} style={{ marginBottom: "14px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, margin: 0 }}>{proj.title}</h3>
            {proj.description && <p style={{ fontSize: "11.5px", lineHeight: "1.7", color: "#333", marginTop: "4px", textAlign: "justify", whiteSpace: "pre-wrap" }}>{proj.description}</p>}
          </div>
        ))}
      </div>
    )}
  </div>
);