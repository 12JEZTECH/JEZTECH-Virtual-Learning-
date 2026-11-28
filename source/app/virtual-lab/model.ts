import type {VirtualInputs} from './service';
export function calculateVirtual(i:VirtualInputs){
 if(i.experiment==='circuit'){const current=i.closed?i.voltage/i.resistance:0;return {currentAmps:current,currentMilliamps:current*1000,powerWatts:i.voltage*current,voltage:i.voltage,resistance:i.resistance,closed:i.closed}}
 if(i.experiment==='titration'){const acidMoles=i.acidConcentration*i.acidVolume/1000,baseMoles=i.baseConcentration*i.baseVolume/1000,totalLitres=(i.acidVolume+i.baseVolume)/1000,excess=acidMoles-baseMoles;const pH=Math.abs(excess)<1e-12?7:excess>0?-Math.log10(excess/totalLitres):14+Math.log10(-excess/totalLitres);return {pH:Math.min(14,Math.max(0,pH)),equivalenceVolume:acidMoles/i.baseConcentration*1000,acidMoles,baseMoles,indicator:pH>=8.2?'pink':'colourless',model:'Ideal 1:1 strong acid/strong base at 25°C'}}
 return {magnification:i.objective*10,objective:i.objective,eyepiece:10,specimen:i.specimen,focusQuality:Math.abs(i.focus-55)<8?'in focus':'adjust focus',model:'Diagrammatic cells; not a calibrated microscopic image'};
}
