import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useSpring, useTransform } from "framer-motion";
import { Home, ClipboardCheck, CalendarDays, UserRound } from "lucide-react";

export const TABS = [
  { id: "Beranda", label: "Beranda", icon: Home },
  { id: "Absensi kelas", label: "Absensi", icon: ClipboardCheck },
  { id: "Event sekolah", label: "Event", icon: CalendarDays },
  { id: "Profile siswa", label: "Profil", icon: UserRound }
];
const H=64, R=26, DEPTH=29, CORNER=17, PAD=9, NOTCH=43;
const SPRING={stiffness:520,damping:34,mass:0.8};
function shape(w,cx){
 const half=Math.min(NOTCH,(w-(CORNER+2)*2)/2);
 return [\`M0 \${CORNER}\`,\`Q0 0 \${CORNER} 0\`,\`H\${cx-half}\`,
 \`C\${cx-half*.65} 0 \${cx-half*.7} \${DEPTH} \${cx} \${DEPTH}\`,
 \`C\${cx+half*.7} \${DEPTH} \${cx+half*.65} 0 \${cx+half} 0\`,
 \`H\${w-CORNER}\`,\`Q\${w} 0 \${w} \${CORNER}\`,\`V\${H-CORNER}\`,
 \`Q\${w} \${H} \${w-CORNER} \${H}\`,\`H\${CORNER}\`,\`Q0 \${H} 0 \${H-CORNER}\`,"Z"].join(" ");
}
export default function FloatingNav({active,onChange,hidden=false}){
 const wrap=useRef(null),glass=useRef(null),line=useRef(null),shadow=useRef(null),first=useRef(true);
 const [w,setW]=useState(0);
 const idx=Math.max(0,TABS.findIndex(tab=>tab.id===active));
 const raw=w?PAD+((w-PAD*2)/TABS.length)*(idx+.5):0;
 const half=w?Math.min(NOTCH,(w-(CORNER+2)*2)/2):0;
 const target=w?Math.min(Math.max(raw,CORNER+2+half),w-CORNER-2-half):0;
 const col=w?PAD+((w-PAD*2)/TABS.length)*(idx+.5):0;
 const iconDX=target-col;
 const x=useMotionValue(0),sx=useSpring(x,SPRING),bubbleX=useTransform(sx,v=>v-R);
 useLayoutEffect(()=>{
  const el=wrap.current;if(!el)return;
  const measure=()=>setW(el.offsetWidth);measure();
  const ro=new ResizeObserver(measure);ro.observe(el);return()=>ro.disconnect();
 },[]);
 useLayoutEffect(()=>{
  if(!w)return;x.set(target);
  if(first.current){sx.jump(target);first.current=false;}
 },[target,w,x,sx]);
 const apply=useCallback(cx=>{
  if(!w)return;const p=shape(w,cx);
  if(glass.current)glass.current.style.clipPath=\`path('\${p}')\`;
  if(line.current)line.current.setAttribute("d",p);
  if(shadow.current)shadow.current.setAttribute("d",p);
 },[w]);
 useMotionValueEvent(sx,"change",apply);
 useLayoutEffect(()=>{if(w)apply(sx.get());},[apply,sx,w]);
 return <motion.nav className={\`nv \${hidden?"nv-hidden":""}\`} aria-label="Navigasi utama" initial={false}
  animate={{y:hidden?120:0,opacity:hidden?0:1}} transition={{type:"spring",stiffness:260,damping:30}}>
  <div className="nv-wrap" ref={wrap}>
   <svg className="nv-shadow" viewBox={\`0 0 \${w||1} \${H}\`} aria-hidden="true"><path ref={shadow}/></svg>
   <div className="nv-glass" ref={glass}/>
   <svg className="nv-line" viewBox={\`0 0 \${w||1} \${H}\`} aria-hidden="true"><path ref={line}/></svg>
   <motion.span className="nv-bubble" style={{x:bubbleX}}/>
   <div className="nv-items">{TABS.map(({id,label,icon:Icon})=>{
    const selected=active===id;
    return <button key={id} type="button" className="nv-item" aria-label={label} aria-current={selected?"page":undefined} onClick={()=>onChange(id)}>
     <motion.span className="nv-icon" initial={false} style={selected?{x:iconDX}:undefined}
      animate={{y:selected?-29:0,scale:selected?1.12:1}} transition={{type:"spring",...SPRING}}><Icon size={20} strokeWidth={2.1}/></motion.span>
     <span className="nv-label">{label}</span>
    </button>;
   })}</div>
  </div>
 </motion.nav>;
}