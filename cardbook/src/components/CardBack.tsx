import Svg, { Circle, Defs, LinearGradient, Path, Pattern, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { CARD_RATIO, colors } from '@/theme';

/**
 * 아직 없는 카드 자리에 보여주는 카드 뒷면.
 * 공식 카드 뒷면이 아닌 이 앱만의 디자인이고, 가운데에 "?" 로고가 있습니다.
 */
export function CardBack({ width }: { width: number }) {
  const height = width * CARD_RATIO;
  // viewBox는 63 × 88 고정, 크기는 width로 조절
  return (
    <Svg width={width} height={height} viewBox="0 0 63 88">
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.backMid} />
          <Stop offset="1" stopColor={colors.backDeep} />
        </LinearGradient>
        <Pattern id="dia" width="6" height="6" patternUnits="userSpaceOnUse">
          <Path d="M3 0 L6 3 L3 6 L0 3 Z" fill="#FFFFFF" opacity={0.06} />
        </Pattern>
      </Defs>

      {/* 바탕 */}
      <Rect x="0" y="0" width="63" height="88" rx="3.5" fill="url(#bg)" />
      <Rect x="0" y="0" width="63" height="88" rx="3.5" fill="url(#dia)" />
      {/* 안쪽 금색 테두리 */}
      <Rect x="3" y="3" width="57" height="82" rx="2.2" fill="none" stroke={colors.backGold} strokeWidth="0.8" />
      <Rect
        x="4.6"
        y="4.6"
        width="53.8"
        height="78.8"
        rx="1.6"
        fill="none"
        stroke={colors.backGold}
        strokeWidth="0.3"
        opacity={0.6}
      />

      {/* 위아래 장식 */}
      <Path d="M24 11 L31.5 7.5 L39 11" fill="none" stroke={colors.backGold} strokeWidth="0.6" />
      <Path d="M24 77 L31.5 80.5 L39 77" fill="none" stroke={colors.backGold} strokeWidth="0.6" />

      {/* 가운데 ? 로고 */}
      <Circle cx="31.5" cy="44" r="15" fill={colors.backDeep} stroke={colors.backGold} strokeWidth="1.2" />
      <Circle cx="31.5" cy="44" r="12.2" fill="none" stroke={colors.backGold} strokeWidth="0.4" opacity={0.7} />
      <SvgText x="31.5" y="51" fontSize="20" fontWeight="bold" fill={colors.backGold} textAnchor="middle">
        ?
      </SvgText>
    </Svg>
  );
}
