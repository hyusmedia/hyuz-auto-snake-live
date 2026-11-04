import { defineConfig } from 'vite';
export default defineConfig({root:'apps/game', server:{port:5173,strictPort:true,proxy:{'/api':'http://127.0.0.1:3001','/ws':{target:'ws://127.0.0.1:3001',ws:true}}},build:{outDir:'../../dist/game',emptyOutDir:true}});
