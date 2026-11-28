// Server-only media payloads: do not import this module into a client component.
import circuit from './ai-circuit';
import magnification from './ai-magnification';
import speed from './ai-speed';
const videos:Record<string,string>={'ai-circuit':circuit,'ai-magnification':magnification,'ai-speed':speed};
export function generatedVideo(id:string){if(!Object.prototype.hasOwnProperty.call(videos,id))return null;return Uint8Array.from(atob(videos[id]),c=>c.charCodeAt(0))}
