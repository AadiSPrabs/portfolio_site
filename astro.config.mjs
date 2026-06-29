import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://aadiprabhu.tech',
  output: 'static',
  integrations: [sitemap()],
});
