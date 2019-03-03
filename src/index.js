import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import { Router } from '@reach/router';
import AppStore from './store/index';
import { Provider } from 'mobx-react';

const store = new AppStore();

ReactDOM.render(
  <Provider store={store}>
    <Router>
      <App path="/" />
    </Router>
  </Provider>,
  document.getElementById('root')
);
registerServiceWorker();
