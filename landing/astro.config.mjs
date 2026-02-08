import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://zaki.bot',
  output: 'static',
  build: {
    assets: 'assets'
  }
});
