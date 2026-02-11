const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// 1. DISABLE Package Exports
// This stops Metro from looking at the "exports" field, which usually points to the broken ESM files.
config.resolver.unstable_enablePackageExports = false;

// 2. FORCE "Main" Field Priority
// We tell Metro: "Look for 'react-native' first. If not found, use 'browser'. Finally, use 'main'."
// IMPORTANT: We explicitly REMOVED 'module' from this list to avoid ESM files.
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// 3. Keep Reanimated happy
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: false,
    },
  }),
};

module.exports = withNativeWind(config, { input: "./global.css" });
