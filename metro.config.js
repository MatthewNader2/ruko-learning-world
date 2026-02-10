const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// 1. Enable support for modern .mjs files (used by AI libraries)
config.resolver.sourceExts.push("mjs");
config.resolver.sourceExts.push("cjs");

// 2. Tell Metro to look at the "exports" field in package.json
config.resolver.unstable_enablePackageExports = true;

// 3. Web-specific transformer configuration
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// 4. Platform-specific resolution for problematic packages
config.resolver.resolverMainFields = ['browser', 'module', 'main'];

module.exports = withNativeWind(config, { input: "./global.css" });
