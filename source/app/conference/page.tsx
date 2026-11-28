import LearningGate from '../portals/learning-gate';
import Panel from './panel';
export const dynamic='force-dynamic';
export default function Page(){return <LearningGate path="/conference" registrationOnly><Panel/></LearningGate>}
