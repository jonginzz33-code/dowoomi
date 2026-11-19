// Play 스토어 업로드 키로 release 빌드에 서명하는 설정 플러그인.
// GitHub 빌드가 keystore/play-upload.p12.enc 를 비밀값 PLAY_KEY_PASS 로 풀어서
// PLAY_KEYSTORE_FILE 에 놓았을 때만 업로드 키를 쓰고, 없으면 지금처럼 디버그 키로 서명합니다.
const { withAppBuildGradle } = require('expo/config-plugins');

const PLAY_CONFIG = `
        play {
            def ks = System.getenv("PLAY_KEYSTORE_FILE")
            if (ks) {
                storeFile file(ks)
                storePassword System.getenv("PLAY_KEY_PASS")
                keyAlias "upload"
                keyPassword System.getenv("PLAY_KEY_PASS")
            }
        }`;

module.exports = function withPlaySigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (src.includes('PLAY_KEYSTORE_FILE')) return cfg;

    const before = src;
    src = src.replace(/signingConfigs \{/, (m) => m + PLAY_CONFIG);
    src = src.replace(
      /(release \{[\s\S]*?)signingConfig signingConfigs\.debug/,
      '$1signingConfig System.getenv("PLAY_KEYSTORE_FILE") ? signingConfigs.play : signingConfigs.debug',
    );
    if (src === before || !src.includes('signingConfigs.play')) {
      throw new Error('withPlaySigning: android/app/build.gradle 모양이 달라서 서명 설정을 넣지 못했어요.');
    }
    cfg.modResults.contents = src;
    return cfg;
  });
};
