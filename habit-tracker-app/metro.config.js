// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/* @type {import('expo/metro-config').MetroConfig} */
const defaultConfig = getDefautConfig(__dirname);
defaultConfig.resolver.sourceExts.push('cjs');

//const config = getDefaultConfig(__dirname);

module.exports = defaultConfig;

//module.exports = config;
