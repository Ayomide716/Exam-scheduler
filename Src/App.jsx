import { useState, useMemo, useEffect } from "react";

/* ── helpers ── */
function uid() { return Date.now() + Math.floor(Math.random() * 9999); }

const defaultVenues = [
  { id: 1, name: "Main Hall A", capacity: 200 },
  { id: 2, name: "Main Hall B", capacity: 150 },
  { id: 3, name: "Lecture Theatre 1", capacity: 100 },
  { id: 4, name: "Room 201", capacity: 50 },
  { id: 5, name: "Room 305", capacity: 40 },
];
const defaultExams = [
  { id: 1, name: "Mathematics 101", students: 180, date: "2026-06-15" },
  { id: 2, name: "Physics 201", students: 95, date: "2026-06-15" },
  { id: 3, name: "Chemistry 101", students: 140, date: "2026-06-16" },
  { id: 4, name: "Biology 301", students: 45, date: "2026-06-16" },
  { id: 5, name: "English 101", students: 190, date: "2026-06-17" },
  { id: 6, name: "History 201", students: 70, date: "2026-06-17" },
];
const defaultInvigilators = [
  { id: 1, name: "Dr. Adamu" }, { id: 2, name: "Prof. Bello" },
  { id: 3, name: "Mrs. Chukwu" }, { id: 4, name: "Mr. Danladi" },
  { id: 5, name: "Dr. Eze" }, { id: 6, name: "Mrs. Folake" },
  { id: 7, name: "Mr. Garba" }, { id: 8, name: "Dr. Hassan" },
];

/* ── allocation engine ── */
function allocate(exams, venues) {
  const sorted = [...exams].sort((a, b) => b.students - a.students);
  const out = [];
  for (const exam of sorted) {
    const fit = venues.filter(v => v.capacity >= exam.students).sort((a, b) => a.capacity - b.capacity);
    if (fit.length) {
      out.push({ exam, venue: fit[0], status: "ok", assigned: exam.students });
    } else {
      let rem = exam.students;
      const desc = [...venues].sort((a, b) => b.capacity - a.capacity);
      for (const v of desc) {
        if (rem <= 0) break;
        const n = Math.min(rem, v.capacity);
        out.push({ exam, venue: v, status: "split", assigned: n });
        rem -= n;
      }
      if (rem > 0) out.push({ exam, venue: null, status: "overflow", assigned: 0 });
    }
  }
  return out;
}

function schedule(exams, invigs, allocs) {
  const dates = [...new Set(exams.map(e => e.date))].sort();
  const last = {};
  invigs.forEach(i => last[i.id] = null);
  const sched = {};
  for (const d of dates) {
    const dayAllocs = allocs.filter(a => a.exam.date === d && a.venue);
    const avail = invigs.filter(i => {
      if (!last[i.id]) return true;
      return (new Date(d) - new Date(last[i.id])) / 864e5 >= 2;
    });
    let idx = 0;
    sched[d] = dayAllocs.map(a => {
      const need = Math.max(1, Math.ceil(a.assigned / 50));
      const picked = [];
      for (let j = 0; j < need && idx < avail.length; j++) {
        picked.push(avail[idx]);
        last[avail[idx].id] = d;
        idx++;
      }
      return { ...a, invigilators: picked };
    });
  }
  return { sched, dates };
}

/* ── palette (OneUI 16 inspired) ── */
const C = {
  bg: "#F3F3F8",
  card: "#FFFFFF",
  blue: "#0A6CFF",
  blueSoft: "#E8F1FF",
  blueGlow: "#0A6CFF18",
  green: "#00A862",
  greenSoft: "#E6F7EF",
  purple: "#7B61FF",
  purpleSoft: "#F0ECFF",
  red: "#FF3B30",
  redSoft: "#FFECEB",
  orange: "#FF9500",
  orangeSoft: "#FFF4E5",
  text: "#1C1C1E",
  textSec: "#8E8E93",
  textTer: "#AEAEB2",
  border: "#E5E5EA",
  inputBg: "#F2F2F7",
};

/* ── responsive hook ── */
function useWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

/* ── icons (inline SVG) ── */
const Icon = ({ d, size = 22, color = C.textSec }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const VenueIcon = (p) => <Icon {...p} d={<><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></>} />;
const ExamIcon = (p) => <Icon {...p} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>} />;
const PersonIcon = (p) => <Icon {...p} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />;
const CalIcon = (p) => <Icon {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />;
const PlusIcon = (p) => <Icon {...p} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;
const TrashIcon = (p) => <Icon {...p} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>} />;

const TABS = [
  { label: "Venues", icon: VenueIcon },
  { label: "Exams", icon: ExamIcon },
  { label: "Invigilators", icon: PersonIcon },
  { label: "Schedule", icon: CalIcon },
];

/* ── reusable components ── */
function Chip({ children, bg, color }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 10px",
      borderRadius: 20, background: bg, color, fontSize: 12, fontWeight: 600,
      letterSpacing: 0.1, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: C.textSec }}>{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
        padding: "12px 16px", border: "none", borderRadius: 14, fontSize: 15,
        background: C.inputBg, color: C.text, outline: "none",
        transition: "box-shadow 0.2s",
      }}
        onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${C.blue}40`}
        onBlur={e => e.target.style.boxShadow = "none"}
      />
    </div>
  );
}

function Fab({ onClick, label }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "12px 22px", borderRadius: 24, border: "none",
      background: C.blue, color: "#fff", fontSize: 15, fontWeight: 600,
      cursor: "pointer", boxShadow: "0 4px 16px #0A6CFF30",
      transition: "transform 0.15s, box-shadow 0.15s",
    }}
      onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
      onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
    >
      <PlusIcon size={18} color="#fff" />
      {label}
    </button>
  );
}

function EmptyState({ icon: Ic, text }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: C.textTer }}>
      <Ic size={48} color={C.textTer} />
      <p style={{ marginTop: 12, fontSize: 15 }}>{text}</p>
    </div>
  );
}

function SwipeRow({ children, onDelete }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", background: C.card,
      borderRadius: 16, padding: "14px 16px", gap: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      transition: "background 0.15s",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      <button onClick={onDelete} style={{
        width: 36, height: 36, borderRadius: 12, border: "none",
        background: C.redSoft, cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <TrashIcon size={16} color={C.red} />
      </button>
    </div>
  );
}

/* ── modal sheet ── */
function Sheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={onClose} style={{
        position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(4px)",
      }} />
      <div style={{
        position: "relative", width: "100%", maxWidth: 480,
        background: C.card, borderRadius: "24px 24px 0 0",
        padding: "8px 20px 32px", maxHeight: "80vh", overflowY: "auto",
      }}>
        <div style={{
          width: 36, height: 4, borderRadius: 2, background: C.border,
          margin: "8px auto 16px",
        }} />
        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

/* ── tab: Venues ── */
function VenuesTab({ venues, setVenues }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cap, setCap] = useState("");

  const add = () => {
    if (!name.trim() || !cap) return;
    setVenues(v => [...v, { id: uid(), name: name.trim(), capacity: parseInt(cap) }]);
    setName(""); setCap(""); setOpen(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ fontSize: 14, color: C.textSec, margin: 0 }}>
          {venues.length} venue{venues.length !== 1 && "s"} · {venues.reduce((s, v) => s + v.capacity, 0)} total seats
        </p>
        <Fab onClick={() => setOpen(true)} label="Add" />
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {venues.map(v => (
          <SwipeRow key={v.id} onDelete={() => setVenues(vs => vs.filter(x => x.id !== v.id))}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontWeight: 600, color: C.text, fontSize: 15 }}>{v.name}</span>
              <Chip bg={C.greenSoft} color={C.green}>{v.capacity} seats</Chip>
            </div>
          </SwipeRow>
        ))}
      </div>
      {venues.length === 0 && <EmptyState icon={VenueIcon} text="No venues yet — tap Add to get started" />}

      <Sheet open={open} onClose={() => setOpen(false)} title="New Venue">
        <div style={{ display: "grid", gap: 16 }}>
          <InputField label="Venue name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Main Hall A" />
          <InputField label="Seating capacity" value={cap} onChange={e => setCap(e.target.value)} type="number" placeholder="e.g. 200" />
          <button onClick={add} style={{
            padding: "14px", borderRadius: 14, border: "none", fontSize: 16,
            fontWeight: 600, background: C.blue, color: "#fff", cursor: "pointer",
            marginTop: 4,
          }}>Add Venue</button>
        </div>
      </Sheet>
    </div>
  );
}

/* ── tab: Exams ── */
function ExamsTab({ exams, setExams }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [stu, setStu] = useState("");
  const [date, setDate] = useState("2026-06-15");

  const add = () => {
    if (!name.trim() || !stu || !date) return;
    setExams(e => [...e, { id: uid(), name: name.trim(), students: parseInt(stu), date }]);
    setName(""); setStu(""); setOpen(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ fontSize: 14, color: C.textSec, margin: 0 }}>
          {exams.length} exam{exams.length !== 1 && "s"} · {exams.reduce((s, e) => s + e.students, 0)} students total
        </p>
        <Fab onClick={() => setOpen(true)} label="Add" />
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {exams.map(e => (
          <SwipeRow key={e.id} onDelete={() => setExams(es => es.filter(x => x.id !== e.id))}>
            <div style={{ fontWeight: 600, color: C.text, fontSize: 15, marginBottom: 6 }}>{e.name}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Chip bg={C.blueSoft} color={C.blue}>{e.students} students</Chip>
              <Chip bg={C.purpleSoft} color={C.purple}>{e.date}</Chip>
            </div>
          </SwipeRow>
        ))}
      </div>
      {exams.length === 0 && <EmptyState icon={ExamIcon} text="No exams registered yet" />}

      <Sheet open={open} onClose={() => setOpen(false)} title="New Exam">
        <div style={{ display: "grid", gap: 16 }}>
          <InputField label="Exam / Course" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mathematics 101" />
          <InputField label="Number of students" value={stu} onChange={e => setStu(e.target.value)} type="number" placeholder="e.g. 120" />
          <InputField label="Exam date" value={date} onChange={e => setDate(e.target.value)} type="date" />
          <button onClick={add} style={{
            padding: "14px", borderRadius: 14, border: "none", fontSize: 16,
            fontWeight: 600, background: C.blue, color: "#fff", cursor: "pointer",
            marginTop: 4,
          }}>Add Exam</button>
        </div>
      </Sheet>
    </div>
  );
}

/* ── tab: Invigilators ── */
function InvigilatorsTab({ invigilators, setInvigilators }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const add = () => {
    if (!name.trim()) return;
    setInvigilators(i => [...i, { id: uid(), name: name.trim() }]);
    setName(""); setOpen(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ fontSize: 14, color: C.textSec, margin: 0 }}>{invigilators.length} invigilator{invigilators.length !== 1 && "s"}</p>
        <Fab onClick={() => setOpen(true)} label="Add" />
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        {invigilators.map(inv => (
          <div key={inv.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            background: C.card, borderRadius: 16, padding: "12px 14px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12, background: C.blueSoft,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <PersonIcon size={18} color={C.blue} />
            </div>
            <span style={{ flex: 1, fontWeight: 500, fontSize: 14, color: C.text }}>{inv.name}</span>
            <button onClick={() => setInvigilators(is => is.filter(x => x.id !== inv.id))} style={{
              width: 30, height: 30, borderRadius: 10, border: "none",
              background: C.redSoft, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <TrashIcon size={14} color={C.red} />
            </button>
          </div>
        ))}
      </div>
      {invigilators.length === 0 && <EmptyState icon={PersonIcon} text="No invigilators added" />}

      <Sheet open={open} onClose={() => setOpen(false)} title="New Invigilator">
        <div style={{ display: "grid", gap: 16 }}>
          <InputField label="Full name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dr. Adamu" />
          <button onClick={add} style={{
            padding: "14px", borderRadius: 14, border: "none", fontSize: 16,
            fontWeight: 600, background: C.blue, color: "#fff", cursor: "pointer",
            marginTop: 4,
          }}>Add Invigilator</button>
        </div>
      </Sheet>
    </div>
  );
}

/* ── tab: Schedule ── */
function ScheduleTab({ exams, venues, invigilators }) {
  const allocs = useMemo(() => allocate(exams, venues), [exams, venues]);
  const { sched, dates } = useMemo(() => schedule(exams, invigilators, allocs), [exams, invigilators, allocs]);

  if (!exams.length || !venues.length)
    return <EmptyState icon={CalIcon} text="Add venues and exams first to generate a schedule" />;

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div>
      <p style={{ fontSize: 14, color: C.textSec, margin: "0 0 16px" }}>
        Auto-generated · venues by best fit · invigilators on 1-on / 1-off rotation
      </p>

      {dates.map(date => {
        const d = new Date(date + "T00:00:00");
        const entries = sched[date] || [];
        return (
          <div key={date} style={{
            background: C.card, borderRadius: 20, padding: "18px 16px",
            marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            {/* date header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${C.blue}, #3D8BFF)`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                color: "#fff", flexShrink: 0,
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1, opacity: 0.85 }}>{monthNames[d.getMonth()]}</span>
                <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{d.getDate()}</span>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{dayNames[d.getDay()]}</div>
                <div style={{ fontSize: 13, color: C.textSec }}>{entries.length} session{entries.length !== 1 && "s"}</div>
              </div>
            </div>

            {entries.length === 0 && <p style={{ color: C.textTer, fontSize: 13, margin: "4px 0 0" }}>No sessions</p>}

            <div style={{ display: "grid", gap: 8 }}>
              {entries.map((e, i) => (
                <div key={i} style={{
                  padding: "12px 14px", background: C.bg, borderRadius: 14,
                  borderLeft: `3px solid ${C.blue}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{e.exam.name}</span>
                    <Chip bg={C.greenSoft} color={C.green}>
                      {e.venue.name} · {e.assigned}/{e.venue.capacity}
                    </Chip>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {e.invigilators.length > 0
                      ? e.invigilators.map(inv => <Chip key={inv.id} bg={C.purpleSoft} color={C.purple}>{inv.name}</Chip>)
                      : <Chip bg={C.orangeSoft} color={C.orange}>No invigilator available</Chip>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Duty summary */}
      <div style={{
        background: C.card, borderRadius: 20, padding: "18px 16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 14 }}>Duty Summary</h3>
        <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
          {invigilators.map(inv => {
            const days = dates.filter(d => (sched[d] || []).some(s => s.invigilators.some(i => i.id === inv.id)));
            return (
              <div key={inv.id} style={{
                padding: "10px 14px", background: C.bg, borderRadius: 12,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{inv.name}</span>
                <Chip
