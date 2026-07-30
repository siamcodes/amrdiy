import { defineConfig, loadEnv, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react";

const requiredClientEnv = [
  "VITE_API",
  "VITE_STRIPE_KEY",
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const missing = requiredClientEnv.filter((name) => !env[name]?.trim());

  if (missing.length) {
    throw new Error(`Missing required client environment variables: ${missing.join(", ")}`);
  }

  for (const name of [
    "VITE_API",
  ]) {
    try {
      new URL(env[name]);
    } catch {
      throw new Error(`${name} must be a valid absolute URL`);
    }
  }

  return {
  plugins: [
    {
      name: "legacy-js-as-jsx",
      enforce: "pre",
      async transform(code, id) {
        if (!/\/src\/.*\.js$/.test(id)) return null;
        return transformWithEsbuild(code, id, {
          loader: "jsx",
          jsx: "automatic",
        });
      },
    },
    react(),
  ],
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.js$/,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  build: {
    outDir: "build",
  },
  };
});
