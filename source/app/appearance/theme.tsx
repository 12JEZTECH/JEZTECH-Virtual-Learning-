'use client';
import {useEffect,useState} from 'react';
export type Theme='light'|'ocean'|'dark';
const valid=(v:string|null):Theme=>v==='dark'||v==='ocean'?v:'light';
export function useTheme(){const [theme,setLocal]=useState<Theme>('light');useEffect(()=>{const sync=()=>{try{setLocal(valid(localStorage.getItem('examguard-theme')))}catch{}};sync();window.addEventListener('jeztech-theme',sync);window.addEventListener('storage',sync);return()=>{window.removeEventListener('jeztech-theme',sync);window.removeEventListener('storage',sync)}},[]);function setTheme(value:Theme){document.documentElement.dataset.theme=value;setLocal(value);try{localStorage.setItem('examguard-theme',value)}catch{}window.dispatchEvent(new Event('jeztech-theme'))}useEffect(()=>{document.documentElement.dataset.theme=theme},[theme]);return {theme,setTheme}}
export default function ThemePicker(){const {theme,setTheme}=useTheme();return <label className="theme-picker">Theme<select aria-label="Choose appearance theme" value={theme} onChange={e=>setTheme(e.target.value as Theme)}><option value="light">Forest</option><option value="ocean">Ocean</option><option value="dark">Night</option></select></label>}
