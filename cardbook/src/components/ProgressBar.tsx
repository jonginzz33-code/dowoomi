import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

export function ProgressBar({ owned, total, compact }: { owned: number; total: number; compact?: boolean }) {
  const pct = total > 0 ? owned / total : 0;
  const done = total > 0 && owned === total;
  return (
    <View style={styles.row}>
      <View style={[styles.track, compact && styles.trackCompact]}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: done ? colors.owned : colors.accent }]} />
      </View>
      <Text style={[styles.label, compact && styles.labelCompact]}>
        {owned} / {total}
        {done ? ' 완성!' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  trackCompact: { height: 5 },
  fill: { height: '100%', borderRadius: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, minWidth: 64, textAlign: 'right' },
  labelCompact: { fontSize: 12, color: colors.sub },
});
