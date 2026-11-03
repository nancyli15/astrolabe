// A placeholder module, so there is something to switch to until a second real
// module exists. It follows the same rules as every other module.
import { useEffect } from 'react';

export default function ComingSoonModule({ log }) {
  useEffect(() => {
    log('boot', ['Module : none installed']);
  }, [log]);

  return (
    <div className="coming-soon">
      <p className="coming-soon-title">UNCHARTED NODE</p>
      <p>Nothing is installed at this point on the dial yet.</p>
      <p>Open the astrolabe to return to Eternal Recurrence.</p>
    </div>
  );
}
