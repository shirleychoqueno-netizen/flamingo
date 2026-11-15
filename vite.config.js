import {defineConfig} from 'vite';

// Keep large immutable corpora separate so visual changes do not invalidate them.
export default defineConfig({build:{rollupOptions:{output:{manualChunks(id){
 if(id.includes('/node_modules/'))return 'vendor';
 if(id.endsWith('/documents.json'))return 'pdf-corpus';
 if(id.endsWith('/investigation-catalog.json'))return 'research-catalog';
}}}}});
