import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { QuantityStepper } from '@/components/QuantityStepper';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/StateViews';
import { useCart } from '@/context/CartContext';
import { useProducts, useStore } from '@/hooks/useCatalog';
import { colors, spacing } from '@/theme';
import { missingForMinimum, syncCart } from '@/utils/cart';
import { confirm, notify } from '@/utils/confirm';
import { formatMoney } from '@/utils/money';

export default function CartScreen() {
  const router = useRouter();
  const { cart, totals, changeQuantity, clear, setCart } = useCart();
  const missing = missingForMinimum(cart);

  // CORREÇÃO C13: confere o carrinho salvo com os preços, produtos e loja ATUAIS.
  const storeId = cart.storeId ?? undefined;
  const store = useStore(storeId);
  const products = useProducts(storeId);
  const storeClosed = store.data ? !store.data.is_open : false;
  const checking = Boolean(storeId) && (store.isFetching || products.isFetching);

  useEffect(() => {
    if (!store.data || !products.data) return;
    const result = syncCart(cart, store.data, products.data);
    if (result.cart === cart) return;
    setCart(result.cart);
    if (result.removed.length > 0) {
      notify(
        'Carrinho atualizado',
        result.removed.length === 1
          ? `${result.removed[0]} não está mais disponível e saiu do carrinho.`
          : `${result.removed.join(', ')} não estão mais disponíveis e saíram do carrinho.`,
      );
    } else if (result.priceChanged) {
      notify(
        'Preços atualizados',
        'Alguns preços mudaram desde que você montou o carrinho.',
      );
    }
  }, [cart, store.data, products.data, setCart]);

  if (cart.items.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="cart-outline"
          title="Seu carrinho está vazio"
          message="Escolha uma loja e adicione o que quiser."
        />
        <View style={styles.emptyAction}>
          <Button title="Ver lojas" onPress={() => router.push('/')} />
        </View>
      </Screen>
    );
  }

  function confirmClear() {
    confirm({
      title: 'Esvaziar carrinho',
      message: 'Todos os itens serão removidos.',
      confirmText: 'Esvaziar',
      destructive: true,
      onConfirm: clear,
    });
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Carrinho</Text>
        <Text style={styles.store}>Pedido em {cart.storeName}</Text>

        {cart.items.map((item) => (
          <Card key={item.productId} style={styles.item}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.itemPrice}>{formatMoney(item.price)}</Text>
            </View>
            <QuantityStepper
              value={item.quantity}
              onChange={(q) => changeQuantity(item.productId, q)}
            />
          </Card>
        ))}

        <Button
          title="Adicionar mais itens"
          variant="secondary"
          onPress={() => router.push(`/store/${cart.storeId}`)}
          style={styles.more}
        />

        <Card>
          <Row label="Subtotal" value={formatMoney(totals.subtotal)} />
          <Row
            label="Entrega"
            value={totals.deliveryFee === 0 ? 'Grátis' : formatMoney(totals.deliveryFee)}
          />
          <View style={styles.divider} />
          <Row label="Total" value={formatMoney(totals.total)} strong />
        </Card>

        {storeClosed ? (
          <Text style={styles.warning}>
            {cart.storeName} fechou. Não é possível finalizar o pedido agora.
          </Text>
        ) : null}

        {missing !== null ? (
          <Text style={styles.warning}>
            Faltam {formatMoney(missing)} para o pedido mínimo de{' '}
            {formatMoney(cart.minOrder)}.
          </Text>
        ) : null}

        <Button
          title="Finalizar pedido"
          onPress={() => router.push('/checkout')}
          disabled={missing !== null || storeClosed}
          loading={checking}
        />
        <Button
          title="Esvaziar carrinho"
          variant="ghost"
          onPress={confirmClear}
          style={styles.clear}
        />
      </ScrollView>
    </Screen>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md },
  emptyAction: { padding: spacing.md },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  store: { fontSize: 14, color: colors.muted, marginBottom: spacing.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  emoji: { fontSize: 32 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemPrice: { fontSize: 14, color: colors.muted, marginTop: 2 },
  more: { marginVertical: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { fontSize: 15, color: colors.muted },
  rowValue: { fontSize: 15, color: colors.text },
  strong: { fontSize: 18, fontWeight: '800', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  warning: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  clear: { marginTop: spacing.sm },
});
