import {defineConfig} from 'vite';

// Keep large immutable corpora separate so visual changes do not invalidate them.
export default defineConfig({build:{rollupOptions:{output:{manualChunks(id){
 // three.js is only used by the lazy Learn page; keep it out of the shared vendor chunk.
 if(id.includes('/node_modules/three/'))return 'three';
 if(id.includes('/node_modules/'))return 'vendor';
 if(id.endsWith('/documents.json'))return 'pdf-corpus';
 if(id.endsWith('/investigation-catalog.json'))return 'research-catalog';
}}}}});
