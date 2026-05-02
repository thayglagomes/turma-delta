import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

console.log(import.meta.env);

export default defineConfig({
  plugins: [react()],
  base: "/turma-delta/",
});