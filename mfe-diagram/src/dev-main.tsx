import { createRoot } from 'react-dom/client';

import App from './App';
import './assets/styles/global.scss';

const container = document.getElementById('app');
if (container) {
  createRoot(container).render(<App />);
}
