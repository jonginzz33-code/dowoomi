# 카드 도감 (cardbook)

내가 가진 포켓몬 카드를 판별·세트별로 기록하는 Android 앱입니다. Expo(React Native)로 만들었습니다.

- 전체 카드 목록에서 **없는 카드는 `?` 카드 뒷면**으로 보입니다.
- 가진 카드를 **직접 사진 찍어 올리면** 그 자리에 내 사진이 들어갑니다.
- 사진과 기록은 **이 폰에만** 저장됩니다. 서버는 쓰지 않습니다.
- 공식 카드 이미지는 쓰지 않습니다. 이름, 번호, 레어도 같은 정보만 씁니다.

## 분류 구조

```
판 (한국판 / 일본판 / 영문판)
 └ 시리즈 (스칼렛&바이올렛, 소드&실드 …)      ← 최신순
    └ 세트 (SV2a 151, MEW 151 …)               ← 최신순, 세트 코드·발매일·수집률
       └ 카드 (번호 · 이름 · 레어도 · 타입)      ← 보유/미보유, 레어도 필터
          └ 버전 (일반 / 리버스 홀로 / 1st 에디션 / 섀도리스 …)
```

- 같은 카드라도 **버전마다 사진과 수량을 따로** 기록합니다.
- 세트 수집률은 카드 종류 기준입니다. 버전 중 하나라도 가지고 있으면 보유로 칩니다.

## 폴더

| 경로 | 내용 |
| --- | --- |
| `src/app/` | 화면. 홈 → `[edition]` 시리즈·세트 → `set/[setId]` 카드 그리드 → `card/[cardId]` 상세 |
| `src/data/editions/*.json` | 판별 카드 목록 (지금은 **샘플**) |
| `src/data/types.ts` | 데이터 구조 |
| `src/store/collection.tsx` | 보유 기록 (AsyncStorage) |
| `src/store/photos.ts` | 사진 찍기, 카드 비율로 자르기, 줄여서 앱 폴더에 저장 |
| `src/components/CardBack.tsx` | `?` 카드 뒷면 (앱 자체 디자인) |
| `scripts/fetch-tcgdex.mjs` | 전체 카드 목록 수집 스크립트 |

## 카드 데이터 채우기

지금 들어 있는 데이터는 화면 확인용 샘플입니다(151 세트 앞 12장 등). 전체 목록은 아래 명령으로 만듭니다.

```bash
npm run data:tcgdex            # ko, ja, en 모두 (오래 걸림)
npm run data:tcgdex -- ko      # 한국판만
```

- **영문판, 일본판:** TCGdex 데이터가 충실합니다.
- **한국판:** TCGdex에는 스칼렛&바이올렛 시대 위주로 들어 있습니다. 빠진 세트는 포켓몬코리아 공식 카드 검색(pokemoncard.co.kr)을 기준으로 보충해야 합니다. 이 수집기는 아직 만들지 않았습니다.

## 실행과 빌드

```bash
npm install
npm start          # Expo 개발 서버
npm run typecheck
```

## 빌드와 플레이 스토어 자동 올리기

`.github/workflows/cardbook-build.yml` (조과기록·화장실 앱과 같은 방식)

| 언제 | 무엇을 |
| --- | --- |
| 아무 브랜치에 `cardbook/` 를 올릴 때 | APK → Actions 실행 화면 Artifacts `Cardbook-apk` |
| `main` 에 올리거나 Actions 탭에서 손으로 실행 | 위 + 업로드 키로 서명한 AAB → Releases `cardbook-latest` + 플레이 콘솔 자동 업로드 |

- 버전 번호(versionCode)는 워크플로 실행 번호라 올릴 때마다 자동으로 커집니다. 화면에 보이는 버전 이름은 `app.json` 의 `version`.
- 업로드 키: `keystore/play-upload.p12.enc` (AES-256 · pbkdf2 200000, 별칭 `upload`). 비밀값 `PLAY_KEY_PASS` 로 풀어서 `plugins/withPlaySigning.js` 가 release 빌드에 서명합니다.
  - 업로드 키 SHA-1 `9F:B1:6E:D7:CD:54:BF:41:AC:7A:CF:E6:C7:24:37:CC:FD:74:3E:9A`
- 플레이 콘솔: 비밀값 `PLAY_SERVICE_ACCOUNT_JSON`. 기본은 내부 테스트(`internal`). 저장소 변수 `CARDBOOK_PLAY_TRACK` 을 `alpha` 로 두면 비공개 테스트로 올라갑니다.
- 패키지 이름: `com.jonginzz.cardbook` (한 번 스토어에 올리면 바꿀 수 없음)
- 올리기 글(이번에 바뀐 것): `store/whatsnew/whatsnew-ko-KR` (500자 이내)

### 처음 한 번만 사람이 할 일
1. GitHub 저장소 Settings → Secrets → Actions 에 `PLAY_KEY_PASS`, `PLAY_SERVICE_ACCOUNT_JSON` 추가
2. 플레이 콘솔에서 앱 만들기 (패키지 `com.jonginzz.cardbook`)
3. 첫 AAB 는 Releases `cardbook-latest` 에서 받아 플레이 콘솔 내부 테스트에 **직접** 올리기 (Google 정책상 첫 업로드는 손으로)
4. 플레이 콘솔 '사용자 및 권한'에 서비스 계정 메일을 이 앱 권한으로 추가
