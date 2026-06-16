import 'systemjs/dist/system.min.js';
import { registerApplication, start } from 'single-spa';

import './styles.scss';

registerApplication({
  name: '@wf/table',
  app: () => System.import(import.meta.env.VITE_MFE_TABLE_URL ?? 'http://localhost:9001/mfe-table.js'),
  activeWhen: ['/'],
  customProps: {
    domElement: document.getElementById('table-root'),
  },
});

registerApplication({
  name: '@wf/diagram',
  app: () => System.import(import.meta.env.VITE_MFE_DIAGRAM_URL ?? 'http://localhost:9002/mfe-diagram.js'),
  activeWhen: ['/'],
  customProps: {
    domElement: document.getElementById('diagram-root'),
  },
});

start();
