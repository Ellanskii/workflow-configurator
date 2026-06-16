import { Provider } from 'react-redux';

import { WorkflowDiagram } from './components/WorkflowDiagram/WorkflowDiagram';
import { createStore } from './store';

const store = createStore();

export default function App() {
  return (
    <Provider store={store}>
      <WorkflowDiagram />
    </Provider>
  );
}
