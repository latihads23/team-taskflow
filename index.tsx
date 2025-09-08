import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: The error indicates that 'App' does not have a default export. Switching to a named import to resolve the issue.
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);