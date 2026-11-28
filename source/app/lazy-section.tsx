'use client';
import {Component,lazy,Suspense,useEffect,useRef,useState,type ComponentType,type ReactNode} from 'react';

class SectionError extends Component<{children:ReactNode},{failed:boolean}> {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?<section className="panel" role="alert"><h3>This section could not load</h3><p>Check your connection, then reload to try again.</p><button type="button" onClick={()=>window.location.reload()}>Reload page</button></section>:this.props.children}
}

// Keep the lazy component stable across workspace polling and local state updates.
// Each feature is downloaded only when its dashboard section is first rendered.
export function lazySection<P extends object>(load:()=>Promise<{default:ComponentType<P>}>){
 const Section=lazy(load);
 return function LazySection(props:P){return <SectionError><Suspense fallback={<section className="panel" role="status" aria-live="polite" aria-busy="true" style={{minHeight:180}}><h3>Loading section…</h3><p>Please wait while we prepare this workspace.</p></section>}><Section {...props}/></Suspense></SectionError>}
}

/** Defer below-the-fold dashboards until near the viewport; keyboard users can load explicitly. */
export function visibleSection<P extends object>(load:()=>Promise<{default:ComponentType<P>}>){
 const Section=lazySection(load);
 return function VisibleSection(props:P){const [ready,setReady]=useState(false),region=useRef<HTMLDivElement>(null);useEffect(()=>{if(ready)return;if(!('IntersectionObserver' in window)){setReady(true);return;}const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setReady(true);observer.disconnect()}},{rootMargin:'250px'});if(region.current)observer.observe(region.current);return()=>observer.disconnect()},[ready]);return <div ref={region}>{ready?<Section {...props}/>:<div className="panel deferred-section"><p className="small">More classroom tools</p><button type="button" className="secondary" onClick={()=>setReady(true)}>Load this section</button></div>}</div>}
}
