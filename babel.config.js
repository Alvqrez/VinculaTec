module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env.local',
        allowlist: ['REACT_APP_API_URL'],
        safe: false,
        allowUndefined: true,
      }]
    ]
  };
};
