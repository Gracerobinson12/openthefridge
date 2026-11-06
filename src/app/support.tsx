import { LegalPage } from '../components/LegalPage';
import { SUPPORT } from '../lib/legal';

export default function Support() {
  return <LegalPage doc={SUPPORT} showDate={false} />;
}
