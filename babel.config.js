module.exports = function (api) {
  // 1. Check the platform immediately
  const isWeb = api.caller((caller) => caller && caller.platform === "web");

  // 2. Log it so we KNOW it's working (Check your terminal when starting!)
  console.log(`[babel.config.js] Compiling for platform: ${isWeb ? "WEB 🌍" : "NATIVE 📱"}`);

  // 3. Configure Cache correctly
  api.cache(() => isWeb);

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // 4. THE FIX: Only enable this on Web
      ...(isWeb ? ["transform-import-meta"] : []),

      "@babel/plugin-proposal-export-namespace-from",
      "react-native-reanimated/plugin",
    ],
  };
};
