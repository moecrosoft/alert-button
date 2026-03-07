import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectNodeModules = path.join(__dirname, 'node_modules');

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
    resolveAlias: {
      tailwindcss: path.join(projectNodeModules, 'tailwindcss'),
      '@tailwindcss/postcss': path.join(projectNodeModules, '@tailwindcss/postcss'),
    },
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      tailwindcss: path.join(projectNodeModules, 'tailwindcss'),
      '@tailwindcss/postcss': path.join(projectNodeModules, '@tailwindcss/postcss'),
    };
    return config;
  },
};

export default nextConfig;
