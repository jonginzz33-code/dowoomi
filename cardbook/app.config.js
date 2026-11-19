// app.json 에 더해, GitHub 빌드가 넘겨주는 VERSION_CODE 로 Android 버전 번호를 매번 올립니다.
// (Play 스토어는 올릴 때마다 versionCode 가 커져야 받아 줍니다.)
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    versionCode: Number(process.env.VERSION_CODE) || config.android.versionCode,
  },
});
