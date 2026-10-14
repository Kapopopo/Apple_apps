import React,{useState,useEffect} from 'react';
import {AuroraText} from './vendor/aurora-text';
import {AnimatedShinyText} from './vendor/animated-shiny-text';
import {HyperText} from './vendor/hyper-text';
import {SparklesText} from './vendor/sparkles-text';
import {MorphingText} from './vendor/morphing-text';
import {SpinningText} from './vendor/spinning-text';
import {TypingAnimation} from './vendor/typing-animation';
import {LineShadowText} from './vendor/line-shadow-text';
import {TextAnimate} from './vendor/text-animate';
import {RainbowButton} from './vendor/rainbow-button';
import {RippleButton} from './vendor/ripple-button';
import {ShinyButton} from './vendor/shiny-button';
import {PulsatingButton} from './vendor/pulsating-button';
import {InteractiveHoverButton} from './vendor/interactive-hover-button';
import {Meteors} from './vendor/meteors';
import {FlickeringGrid} from './vendor/flickering-grid';
import {AnimatedGridPattern} from './vendor/animated-grid-pattern';
import {InteractiveGridPattern} from './vendor/interactive-grid-pattern';
import {LightRays} from './vendor/light-rays';
import {WarpBackground} from './vendor/warp-background';
import {ShineBorder} from './vendor/shine-border';
import {GlareHover} from './vendor/glare-hover';
import {NeonGradientCard} from './vendor/neon-gradient-card';
import {Lens} from './vendor/lens';
import {AnimatedCircularProgressBar} from './vendor/animated-circular-progress-bar';
import {BlurFade} from './vendor/blur-fade';

function Action({kind}:{kind:string}){const[done,setDone]=useState(false);const label=done?'Projet ajouté ✓':'Créer mon projet';const click=()=>setDone(v=>!v);return <div className="center-stack"><span className="overline">UNE ACTION QUI SE REMARQUE</span>{kind==='rainbow-button'?<RainbowButton onClick={click}>{label}</RainbowButton>:kind==='ripple-button'?<RippleButton onClick={click} className="bg-emerald-800 text-white">{label}</RippleButton>:kind==='shiny-button'?<ShinyButton onClick={click}>{label}</ShinyButton>:kind==='pulsating-button'?<PulsatingButton onClick={click} pulseColor="#9bc8ac" className="bg-emerald-800 text-white">{label}</PulsatingButton>:<InteractiveHoverButton onClick={click}>{label}</InteractiveHoverButton>}<small aria-live="polite">{done?'Votre projet est prêt.':'Cliquez pour essayer'}</small></div>}
function Progress(){const[value,setValue]=useState(35);useEffect(()=>{const id=setInterval(()=>setValue(v=>v>=95?15:v+20),2600);return()=>clearInterval(id)},[]);return <div className="center-stack"><AnimatedCircularProgressBar value={value} gaugePrimaryColor="#488669" gaugeSecondaryColor="#dce9df" className="size-36"/><span className="overline">VOTRE OBJECTIF PREND FORME</span></div>}
function Surface({kind}:{kind:string}){const copy=<div className="surface-copy"><span className="overline">ATLAS · NOUVELLES PERSPECTIVES</span><h2>Imaginez plus loin.</h2><p>Un espace pour vos prochaines idées.</p></div>;return kind==='warp-background'?<WarpBackground className="extra-surface" beamsPerSide={2}>{copy}</WarpBackground>:<div className={'extra-surface '+(kind==='light-rays'?'night-surface':'')}>{kind==='meteors'?<Meteors number={14}/>:kind==='flickering-grid'?<FlickeringGrid squareSize={4} gridGap={7} color="#569571" maxOpacity={.35}/>:kind==='animated-grid-pattern'?<AnimatedGridPattern numSquares={18} maxOpacity={.3} duration={3}/>:kind==='interactive-grid-pattern'?<InteractiveGridPattern squares={[16,10]} width={30} height={30}/>:<LightRays count={5} color="#9ce6b9" speed={3}/>}<div className="surface-overlay">{copy}</div></div>}
const extraDemos:Record<string,React.ComponentType>={
'aurora-text':()=> <div className="text-demo"><span className="overline">COULEURS EN MOUVEMENT</span><h2 className="gradient-heading">Osez <AuroraText>imaginer.</AuroraText></h2></div>,
'animated-shiny-text':()=> <div className="text-demo"><span className="overline">UNE NOUVELLE VERSION</span><AnimatedShinyText className="extra-heading">Vos idées prennent vie ↗</AnimatedShinyText></div>,
'hyper-text':()=> <div className="text-demo"><span className="overline">SURVOLEZ POUR DÉCODER</span><HyperText className="extra-heading">CRÉATIVITÉ</HyperText></div>,
'sparkles-text':()=> <div className="text-demo"><span className="overline">LAISSEZ BRILLER VOS IDÉES</span><SparklesText className="extra-heading" sparklesCount={6}>Une étincelle.</SparklesText></div>,
'morphing-text':()=> <div className="text-demo"><span className="overline">LES IDÉES SE TRANSFORMENT</span><MorphingText texts={['Imaginer','Créer','Partager']} className="extra-morph"/></div>,
'spinning-text':()=> <div className="spin-demo"><SpinningText radius={6} duration={16}>IMAGINER · CRÉER · PARTAGER · </SpinningText><span className="orbit-center">✧</span></div>,
 'typing-animation':()=> <div className="text-demo"><span className="overline">ÉCRIVEZ LA SUITE</span><TypingAnimation words={['Bonjour les idées.','Bonjour le futur.']} loop className="extra-heading"/></div>,
'line-shadow-text':()=> <h2 className="extra-heading">Voir <LineShadowText shadowColor="#589677" className="italic">plus loin.</LineShadowText></h2>,
 'text-animate':()=> <div className="text-demo"><span className="overline">UNE ENTRÉE TOUT EN DOUCEUR</span><TextAnimate animation="blurInUp" by="word" className="extra-heading">Chaque idée mérite sa place.</TextAnimate></div>,
'shine-border':()=> <div className="beam-card"><ShineBorder shineColor={['#62b78a','#a78bd4']} duration={5} borderWidth={2}/><span className="overline">UNE OFFRE À PART</span><h2>Studio Plus</h2><p>Un contour lumineux pour votre meilleur projet.</p></div>,
'glare-hover':()=> <GlareHover width="280px" height="190px" background="#24563b" color="#c9ffdf" className="rounded-2xl"><div className="p-6 text-white"><span>ATLAS STUDIO</span><h2 className="extra-heading">Sous un autre jour.</h2><p>Survolez la carte.</p></div></GlareHover>,
'neon-gradient-card':()=> <NeonGradientCard className="w-64" borderSize={2} neonColors={{firstColor:'#68b890',secondColor:'#b497da'}}><div className="p-4"><span className="overline">COLLECTION STUDIO</span><h2 className="extra-heading">Une idée brillante.</h2></div></NeonGradientCard>,
'lens':()=> <Lens lensSize={130} zoomFactor={1.7}><div className="lens-art"><span className="overline">EXPLOREZ LES DÉTAILS</span><h2>ATLAS<br/>STUDIO</h2><p>Déplacez la loupe sur cette affiche.</p></div></Lens>,
'animated-circular-progress-bar':Progress,
'blur-fade':()=> <div className="center-stack">{['Imaginez.','Composez.','Partagez.'].map((label,i)=><BlurFade key={label} delay={i*.4} duration={.7}><div className="reveal-tile"><span>0{i+1}</span>{label}</div></BlurFade>)}</div>,
};
for(const kind of ['rainbow-button','ripple-button','shiny-button','pulsating-button','interactive-hover-button'])extraDemos[kind]=()=> <Action kind={kind}/>;
for(const kind of ['meteors','flickering-grid','animated-grid-pattern','interactive-grid-pattern','light-rays','warp-background'])extraDemos[kind]=()=> <Surface kind={kind}/>;
export {extraDemos};
