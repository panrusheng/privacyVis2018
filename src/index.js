import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import { Router } from '@reach/router';
import Demo from './Demo.jsx';
import AppStore from './store/index';
import { Provider } from 'mobx-react';

const store = new AppStore();

ReactDOM.render(
  <Provider store={store}>
    <Router>
      <App path="/" />
      <Demo path="/demo" />
    </Router>
  </Provider>,
  document.getElementById('root')
);
registerServiceWorker();
