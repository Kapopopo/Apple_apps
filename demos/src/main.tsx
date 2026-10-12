import React, {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MotionConfig} from 'motion/react';
import {ArrowUpRight,Check,ChevronDown,Code2,Command,Home,Image,Layers,Mail,Plus,Search,Settings,Sparkles,Star,Zap} from 'lucide-react';
import {Marquee} from './vendor/marquee';
import {Tilt} from './vendor/tilt';
import {ShimmerButton} from './vendor/shimmer-button';
import {Accordion,AccordionItem,AccordionTrigger,AccordionContent} from './vendor/accordion';
import {Dock,DockIcon} from './vendor/dock';
import {Spotlight} from './vendor/spotlight';
import {NumberTicker} from './vendor/number-ticker';
import {BorderBeam} from './vendor/border-beam';
import {TextEffect} from './vendor/text-effect';
import {MagicCard} from './vendor/magic-card';
import {AnimatedList} from './vendor/animated-list';
import {AnimatedBackground} from './vendor/animated-background';
import {OrbitingCircles} from './vendor/orbiting-circles';
import {AnimatedGradientText} from './vendor/animated-gradient-text';
import {AnimatedNumber} from './vendor/animated-number';
import {Ripple} from './vendor/ripple';
import {RetroGrid} from './vendor/retro-grid';
import {WordRotate} from './vendor/word-rotate';
import './style.css';

const key=new URLSearchParams(location.search).get('demo')||'';
function Reviews(){return <div className="reviews"><Marquee pauseOnHover className="[--duration:22s]">{[['M','Marie','Une expérience aussi simple que soignée.'],['A','Alex','Tout ce dont mon projet avait besoin.'],['L','Lina','Chaque détail fait la différence.']].map(([initial,name,text])=><figure className="review" key={name}><div className="review-person"><span>{initial}</span><b>{name}</b><span className="stars">★★★★★</span></div><p>{text}</p></figure>)}</Marquee><Marquee reverse pauseOnHover className="[--duration:25s]">{['Pensé pour les créateurs','Simple à personnaliser','Le souci du détail'].map(text=><div className="review-pill" key={text}><Check size={13}/>{text}</div>)}</Marquee></div>}
function TiltDemo(){return <Tilt className="tilt-card" rotationFactor={20}><div className="art"><div className="art-orbit"/><span>ATLAS<br/>STUDIO</span><ArrowUpRight size={24}/></div><div className="tilt-caption"><div><b>Une nouvelle perspective.</b><small>Design & exploration · 2026</small></div><span>↗</span></div></Tilt>}
function Shimmer(){const[clicked,setClicked]=useState(false);return <div className="center-stack"><span className="overline">VOTRE PROCHAINE GRANDE IDÉE</span><ShimmerButton shimmerColor="#b7f1c6" background="#1e4532" onClick={()=>setClicked(!clicked)} className="px-7 py-3 text-sm text-white"><span className="flex items-center gap-3">{clicked?<><Check size={16}/>C’est parti !</>:<>Commencer mon projet<ArrowUpRight size={16}/></>}</span></ShimmerButton><small>Cliquez pour essayer</small></div>}
function FAQ(){return <Accordion className="faq" transition={{duration:.25}}>{[['01','Comment ça fonctionne ?','Explorez, sélectionnez vos composants et créez votre interface.'],['02','Puis-je personnaliser le style ?','Couleurs, contenu et animations s’adaptent à votre projet.'],['03','Et sur mobile ?','Une disposition fluide, des cibles tactiles et des gestes simples.']].map(([id,q,a])=><AccordionItem value={id} key={id} className="faq-item"><AccordionTrigger className="faq-trigger"><span>{q}</span><ChevronDown size={15}/></AccordionTrigger><AccordionContent><p className="faq-answer">{a}</p></AccordionContent></AccordionItem>)}</Accordion>}
function DockDemo(){const[active,setActive]=useState('Accueil');return <div className="center-stack"><span className="overline">VOTRE ESPACE, À PORTÉE DE MAIN</span><Dock iconSize={38} iconMagnification={58} className="mt-0 bg-white shadow-xl shadow-slate-200/50">{[[Home,'Accueil'],[Search,'Recherche'],[Layers,'Projets'],[Mail,'Messages'],[Settings,'Réglages']].map(([Icon,label])=>{const I=Icon as typeof Home;return <DockIcon key={String(label)} className="bg-slate-100"><button aria-label={String(label)} onClick={()=>setActive(String(label))}><I size={20}/></button></DockIcon>})}</Dock><small aria-live="polite">{active}</small></div>}
function SpotlightDemo(){return <div className="spotlight-card"><Spotlight size={220} className="from-emerald-200 via-emerald-100 to-transparent"/><span className="relative z-10 overline">UNE IDÉE À METTRE EN LUMIÈRE</span><Layers size={32} className="relative z-10 my-4"/><h2 className="relative z-10">Chaque détail compte.</h2><p className="relative z-10">Déplacez votre curseur pour explorer.</p></div>}
function Ticker(){return <div className="metric-card"><div className="metric-top"><span>Créateurs accompagnés</span><span className="metric-icon"><Layers size={17}/></span></div><div className="metric-value"><NumberTicker value={12480} delay={.2}/><span className="growth">↗ 24%</span></div><p>De nouvelles idées, chaque jour.</p><div className="mini-bars">{[20,34,28,48,38,65,53,80,70,95].map((h,i)=><i style={{height:h+'%'}} key={i}/>)}</div></div>}
function Beam(){return <div className="beam-card"><div className="flex justify-between items-center"><span className="overline">POUR ALLER PLUS LOIN</span><Sparkles size={18}/></div><h2>Le plan Studio</h2><p>Toutes vos idées.<br/>Un espace pour les créer.</p><span className="price">24 € <small>/ mois</small></span><BorderBeam size={80} duration={5} colorFrom="#48b88b" colorTo="#a990f6" borderWidth={2}/></div>}
function TextDemo(){return <div className="text-demo"><span className="overline">IMAGINEZ LA SUITE</span><TextEffect per="word" preset="fade-in-blur" speedReveal={.45} className="text-heading">Les belles idées méritent de prendre vie.</TextEffect><small>Une entrée en scène, mot par mot.</small></div>}
function Magic(){return <MagicCard className="magic-demo" gradientColor="#dcf6e6" gradientFrom="#7ccaa2" gradientTo="#ac9ce4"><div className="p-7"><Command size={27}/><h2>Tout commence ici.</h2><p>Une carte sensible à vos mouvements.<br/>Survolez pour l’éclairer.</p><span className="mini-tag">Votre prochain projet ↗</span></div></MagicCard>}
function Notifications(){return <div className="notification-wrap"><AnimatedList delay={1300} className="gap-2">{[['✓','Projet publié','À l’instant'],['↗','Un nouveau membre','Il y a 2 min'],['✧','Objectif atteint','Il y a 5 min']].map(([icon,title,time])=><div className="notification" key={title}><span className="notification-icon">{icon}</span><div><b>{title}</b><small>{time}</small></div><span className="notification-dot"/></div>)}</AnimatedList></div>}
function Background(){const[active,setActive]=useState<string|null>('Aperçu');return <div className="center-stack"><span className="overline">UNE NAVIGATION QUI VOUS SUIT</span><div className="tabs-demo"><AnimatedBackground defaultValue="Aperçu" onValueChange={setActive} className="rounded-lg bg-white shadow-sm" transition={{type:'spring',bounce:.18,duration:.4}}>{['Aperçu','Activité','Fichiers'].map(label=><button data-id={label} key={label} className="px-4 py-2.5 text-xs">{label}</button>)}</AnimatedBackground></div><div className="tab-content" aria-live="polite">{active==='Aperçu'?'Votre espace de travail, en un coup d’œil.':active==='Activité'?'Vous êtes à jour. Prêt pour la suite ?':'Tous vos fichiers, au même endroit.'}</div></div>}
function Orbits(){return <div className="orbit-demo"><span className="orbit-center"><Command size={26}/></span><OrbitingCircles radius={85} iconSize={34} duration={18}>{[Code2,Mail,Layers,Image].map((Icon,i)=><span className="orbit-icon" key={i}><Icon size={18}/></span>)}</OrbitingCircles><OrbitingCircles radius={125} iconSize={25} duration={25} reverse><span className="orbit-small"><Zap size={14}/></span><span className="orbit-small"><Star size={14}/></span></OrbitingCircles></div>}
function Gradient(){return <div className="text-demo"><span className="overline">QUELQUES MOTS SUFFISENT</span><h2 className="gradient-heading">Donnez vie<br/>à vos <AnimatedGradientText colorFrom="#3eaf86" colorTo="#9976da" speed={1.2}>idées.</AnimatedGradientText></h2><small>Un accent visuel en mouvement continu.</small></div>}
function Counter(){const[value,setValue]=useState(1280);return <div className="center-stack"><span className="overline">VOTRE PROCHAINE ÉTAPE</span><AnimatedNumber value={value} className="counter-number" springOptions={{bounce:0,duration:.8}}/><div className="counter-controls"><button aria-label="Diminuer de 100" onClick={()=>setValue(v=>Math.max(0,v-100))}>−</button><span>contributions</span><button aria-label="Augmenter de 100" onClick={()=>setValue(v=>v+100)}>+</button></div></div>}
function RippleDemo(){return <div className="ripple-demo"><Ripple mainCircleSize={100} mainCircleOpacity={.15} numCircles={6}/><div className="ripple-center"><Zap size={25}/></div><span className="ripple-text">Une idée. Mille possibilités.</span></div>}
function Retro(){return <div className="retro-demo"><RetroGrid angle={62} cellSize={38} opacity={.45} lightLineColor="#b38ed5"/><div className="retro-copy"><span className="overline">DESSINEZ DEMAIN</span><h2>Beyond<br/>the ordinary.</h2></div></div>}
function Rotate(){return <div className="text-demo"><span className="overline">UN ESPACE POUR</span><h2 className="rotate-static">Tout ce qui vous</h2><WordRotate words={['inspire.','rassemble.','ressemble.']} duration={2400} className="rotate-words"/><small>Trois messages, une seule ligne.</small></div>}
const demos:Record<string,React.ComponentType>={'marquee':Reviews,'tilt':TiltDemo,'shimmer-button':Shimmer,'accordion':FAQ,'dock':DockDemo,'spotlight':SpotlightDemo,'number-ticker':Ticker,'border-beam':Beam,'text-effect':TextDemo,'magic-card':Magic,'animated-list':Notifications,'animated-background':Background,'orbiting-circles':Orbits,'animated-gradient-text':Gradient,'animated-number':Counter,'ripple':RippleDemo,'retro-grid':Retro,'word-rotate':Rotate};
function App(){
 const[version,setVersion]=useState(0),[playing,setPlaying]=useState(true);
 useEffect(()=>{
  const listener=(event:MessageEvent)=>{
   if(event.origin!==location.origin || event.source!==parent)return;
   if(event.data?.type==='atlas-replay'){setVersion(v=>v+1);setPlaying(true);}
   if(event.data?.type==='atlas-playback')setPlaying(!!event.data.playing);
  };
  window.addEventListener('message',listener);
  parent.postMessage({type:'atlas-demo-ready',demo:key},location.origin);
  return()=>window.removeEventListener('message',listener);
 },[]);
 const Demo=demos[key];
 return <MotionConfig reducedMotion="user"><main className={'demo-stage demo-'+key}>{!Demo?<p>Démonstration introuvable.</p>:playing?<Demo key={version}/>:<button className="resume" onClick={()=>setPlaying(true)}>▶ Reprendre l’animation</button>}</main></MotionConfig>;
}
createRoot(document.getElementById('root')!).render(<App/>);
