import { render } from 'preact';
import { start } from './state/store.ts';
import { App } from './ui/App.tsx';
import './style.css';

const root = document.getElementById('app');
if (!root) throw new Error('#app missing from index.html');
start();
render(<App />, root);
