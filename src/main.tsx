import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LoginGate } from './components/LoginGate';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <LoginGate>
        <App />
      </LoginGate>
    </React.StrictMode>
  );
}
