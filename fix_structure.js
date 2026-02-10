const fs = require("fs");
const path = require("path");

// 1. Move src/app back to app (Standard Expo Structure)
const srcApp = path.join(__dirname, "src/app");
const rootApp = path.join(__dirname, "app");

if (fs.existsSync(srcApp)) {
  console.log("🔄 Moving src/app to root app folder...");
  if (fs.existsSync(rootApp))
    fs.rmSync(rootApp, { recursive: true, force: true });
  fs.renameSync(srcApp, rootApp);
}

// 2. Fix Tailwind Config (Point to new locations)
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
fs.writeFileSync(path.join(__dirname, "tailwind.config.js"), tailwindConfig);

// 3. Fix Babel Config
const babelConfig = `module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};`;
fs.writeFileSync(path.join(__dirname, "babel.config.js"), babelConfig);

// 4. Fix Metro Config
const metroConfig = `const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });`;
fs.writeFileSync(path.join(__dirname, "metro.config.js"), metroConfig);

console.log("✅ Structure Fixed. Please update your _layout.tsx next.");
