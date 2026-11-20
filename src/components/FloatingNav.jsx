import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Home, ClipboardCheck, CalendarDays, UserRound, Plus, X, Users, ClipboardList, Megaphone, School } from "lucide-react";

export const TABS = [
  { id: "Beranda", label: "Beranda", icon: Home },
  { id: "Absensi kelas", label: "Absensi", icon: ClipboardCheck },
  { id: "Event sekolah", label: "Event", icon: CalendarDays },
  { id: "Profile siswa", label: "Profil", icon: UserRound }
];

const ACTIONS = [
  { id: "Kelola guru", label: "Kelola guru", shortLabel: "Guru", icon: Users },
  { id: "Handle absensi murid", label: "Handle absensi murid", shortLabel: "Absensi murid", icon: ClipboardList },
  { id: "Manage class", label: "Manage class", shortLabel: "Kelas", icon: School },
  { id: "Sampaikan pengumuman", label: "Sampaikan pengumuman", shortLabel: "Pengumuman", icon: Megaphone }
];

const H = 64, CORNER = 17, DEPTH = 29, PAD = 9, NOTCH = 43;
const SPRING = { stiffness: 520, damping: 34, mass: 0.8 };

function shape(w, cx) {
  const half = Math.min(NOTCH, (w - (CORNER + 2) * 2) / 2);
  return [
    "M0 " + CORNER, "Q0 0 " + CORNER + " 0", "H" + (cx - half),
    "C" + (cx - half * .65) + " 0 " + (cx - half * .7) + " " + DEPTH + " " + cx + " " + DEPTH,
    "C" + (cx + half * .7) + " " + DEPTH + " " + (cx + half * .65) + " 0 " + (cx + half) + " 0",
    "H" + (w - CORNER), "Q" + w + " 0 " + w + " " + CORNER,
    "V" + (H - CORNER), "Q" + w + " " + H + " " + (w - CORNER) + " " + H,
    "H" + CORNER, "Q0 " + H + " 0 " + (H - CORNER), "Z"
  ].join(" ");
}

export default function FloatingNav({ active, onChange, hidden = false, role = "student", actionOpen = false, onActionToggle }) {
  const wrap = useRef(null), glass = useRef(null), line = useRef(null), shadow = useRef(null), first = useRef(true);
  const [w, setW] = useState(0);
  const canManage = ["developers", "teacher", "leader_school"].includes(role);
  const items = canManage ? [...TABS.slice(0, 2), { id: "Aksi", label: "Aksi", icon: Plus }, ...TABS.slice(2)] : TABS;
  const selectedIndex = actionOpen && canManage ? 2 : Math.max(0, items.findIndex(tab => tab.id === active));
  const col = w ? PAD + ((w - PAD * 2) / items.length) * (selectedIndex + .5) : 0;
  const x = useMotionValue(0), sx = useSpring(x, SPRING), bubbleX = useTransform(sx, value => value - 26);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => setW(el.offsetWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    if (!w) return;
    x.set(col);
    if (first.current) { sx.jump(col); first.current = false; }
  }, [col, w, x, sx]);

  const apply = useCallback(cx => {
    if (!w) return;
    const path = shape(w, cx);
    if (glass.current) glass.current.style.clipPath = "path('" + path + "')";
    if (line.current) line.current.setAttribute("d", path);
    if (shadow.current) shadow.current.setAttribute("d", path);
  }, [w]);
  useMotionValueEvent(sx, "change", apply);
  useLayoutEffect(() => { if (w) apply(sx.get()); }, [apply, sx, w]);

  const selectAction = id => { onChange(id); };
  return (
    <motion.nav className={"nv" + (hidden ? " nv-hidden" : "")} aria-label="Navigasi utama"
      initial={false} animate={{ y: hidden ? 120 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}>
      <div className="nv-wrap" ref={wrap}>
        <svg className="nv-shadow" viewBox={"0 0 " + (w || 1) + " " + H} aria-hidden="true"><path ref={shadow}/></svg>
        <div className="nv-glass" ref={glass}/>
        <svg className="nv-line" viewBox={"0 0 " + (w || 1) + " " + H} aria-hidden="true"><path ref={line}/></svg>
        <motion.span className="nv-bubble" style={{ x: bubbleX }}/>
        <div className="nv-items">
          {items.map(({ id, label, icon: Icon }) => {
            const isAction = id === "Aksi";
            const selected = isAction ? actionOpen : active === id && !actionOpen;
            return <button key={id} type="button" className={"nv-item" + (isAction ? " nv-action-toggle" : "")}
              aria-label={isAction ? (actionOpen ? "Tutup menu aksi" : "Buka menu aksi") : label}
              aria-current={selected ? "page" : undefined}
              onClick={() => { if (isAction) onActionToggle(); else { if (actionOpen) onActionToggle(); onChange(id); } }}>
              <motion.span className="nv-icon" initial={false}
                animate={{ y: selected ? -29 : 0, scale: selected ? 1.12 : 1, rotate: isAction && actionOpen ? 45 : 0 }}
                transition={{ type: "spring", ...SPRING }}>
                {isAction ? (actionOpen ? <X size={21} strokeWidth={2.4}/> : <Plus size={22} strokeWidth={2.4}/>) : <Icon size={20} strokeWidth={2.1}/>}
              </motion.span>
              <span className="nv-label">{isAction ? "Aksi" : label}</span>
            </button>;
          })}
        </div>
        {canManage && <AnimatePresence>
          {actionOpen && <motion.div className="nv-actions" initial={{ opacity: 0, y: 12, scale: .82 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .82 }} transition={{ type: "spring", stiffness: 420, damping: 28 }}>
            {ACTIONS.map(({ id, label, shortLabel, icon: Icon }, index) => <motion.button key={id} type="button" className={"nv-action-bubble nv-action-" + index}
              initial={{ opacity: 0, scale: .5, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0, transition: { delay: index * .055 } }}
              exit={{ opacity: 0, scale: .6, y: 8 }} onClick={() => selectAction(id)} aria-label={label}>
              <small>{shortLabel}</small><span><Icon size={19}/></span>
            </motion.button>)}
          </motion.div>}
        </AnimatePresence>}
      </div>
    </motion.nav>
  );
}
