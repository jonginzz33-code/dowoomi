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

- **폰에서 바로 확인하기:** `cardbook/` 폴더가 바뀌어 GitHub에 올라가면, Actions의 **Cardbook APK** 작업이 APK를 만듭니다. Actions 탭 → 최신 실행 → Artifacts → `Cardbook-apk`.
- **Play 스토어 올리기:** 업로드 키로 서명한 AAB 파일이 필요합니다. 출시할 때 EAS Build(`npx eas-cli build -p android`)나 서명 설정을 추가하세요.
