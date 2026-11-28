import PrimaryLearning from './panel';
import LearningGate from '../portals/learning-gate';
export const dynamic='force-dynamic';
export const metadata={title:'Primary tutorials | JEZTECH Learning',description:'Grade 1–6 official KICD tutorial links for registered learners.'};
export default function Page(){return <LearningGate path="/primary"><PrimaryLearning/></LearningGate>}
