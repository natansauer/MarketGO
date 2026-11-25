import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/context/CartContext';
import { colors, radius, shadow, spacing } from '@/theme';
import { formatMoney } from '@/utils/money';

// Barra fixa com o resumo do carrinho, para ir direto ao pedido.
export function CartBar() {
  const router = useRouter();
  const { count, totals } = useCart();
  // CORREÇÃO C15: com bottom fixo em 16, a barra ficava sobre a barra de gestos do
  // Android (edge-to-edge) e o indicador de início do iPhone.
  const insets = useSafeAreaInsets();
  if (count === 0) return null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/cart')}
      style={({ pressed }) => [
        styles.bar,
        { bottom: spacing.md + insets.bottom },
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.text}>
        Ver carrinho · {count} {count === 1 ? 'item' : 'itens'}
      </Text>
      <Text style={styles.total}>{formatMoney(totals.subtotal)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    minHeight: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow,
  },
  pressed: { opacity: 0.9 },
  text: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  total: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
