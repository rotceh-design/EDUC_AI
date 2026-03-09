import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { injectGlobalStyles } from './theme';

injectGlobalStyles();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
