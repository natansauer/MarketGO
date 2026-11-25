import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { OrderTimeline } from '@/components/OrderTimeline';
import { Screen } from '@/components/Screen';
import { ErrorState, LoadingView } from '@/components/StateViews';
import { PAYMENT_METHODS } from '@/constants/catalog';
import { useCart } from '@/context/CartContext';
import { useAdvanceOrder, useCancelOrder, useOrder } from '@/hooks/useOrders';
import { useReorder } from '@/hooks/useReorder';
import { colors, spacing } from '@/theme';
import { confirm, notify } from '@/utils/confirm';
import { formatDateTime } from '@/utils/date';
import { friendlyError } from '@/utils/errors';
import { formatMoney } from '@/utils/money';
import { canCancel, isActive, nextStatus } from '@/utils/orders';

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { cart: currentCart, setCart } = useCart();
  const { data: order, isLoading, error, refetch } = useOrder(id);
  const advance = useAdvanceOrder();
  const cancel = useCancelOrder();
  const reorder = useReorder();

  if (isLoading) return <LoadingView />;
  // CORREÇÃO C08: a tela consulta o servidor a cada 5 s. Uma única falha de rede nessa
  // consulta (isError com dados já carregados) trocava o pedido inteiro pela tela de erro.
  if (!order) return <ErrorState message={friendlyError(error)} onRetry={refetch} />;

  const paymentLabel =
    PAYMENT_METHODS.find((m) => m.value === order.payment_method)?.label ??
    order.payment_method;

  function confirmCancel() {
    confirm({
      title: 'Cancelar pedido',
      message: 'Deseja cancelar este pedido?',
      cancelText: 'Não',
      confirmText: 'Cancelar pedido',
      destructive: true,
      onConfirm: () =>
        cancel.mutate(order!.id, {
          onError: (e) => notify('Não foi possível cancelar', friendlyError(e)),
        }),
    });
  }

  function orderAgain() {
    reorder.mutate(order!, {
      onSuccess: ({ cart, skipped, store }) => {
        // CORREÇÃO C11: o guia montava o carrinho mesmo com a loja fechada (o erro só vinha
        // no checkout) e substituía, sem perguntar, um carrinho de outra loja.
        if (!store.is_open) {
          notify('Loja fechada', `${store.name} não está aceitando pedidos agora.`);
          return;
        }
        if (cart.items.length === 0) {
          notify(
            'Itens indisponíveis',
            'Nenhum item deste pedido está disponível agora.',
          );
          return;
        }
        const apply = () => {
          setCart(cart);
          if (skipped.length > 0) {
            notify(
              'Alguns itens ficaram de fora',
              `${skipped.join(', ')} não estão mais disponíveis.`,
            );
          }
          router.push('/cart');
        };
        if (currentCart.items.length > 0) {
          confirm({
            title: 'Substituir o carrinho?',
            message: `Seu carrinho tem itens de ${currentCart.storeName}. Deseja trocá-los por este pedido?`,
            confirmText: 'Substituir',
            destructive: true,
            onConfirm: apply,
          });
        } else {
          apply();
        }
      },
      onError: (e) => notify('Não foi possível pedir de novo', friendlyError(e)),
    });
  }

  return (
    <Screen scroll edges={['bottom', 'left', 'right']}>
      <Text style={styles.store}>{order.store_name}</Text>
      <Text style={styles.date}>Pedido de {formatDateTime(order.created_at)}</Text>

      <Card style={styles.card}>
        {order.status === 'cancelled' ? (
          <Text style={styles.cancelled}>Este pedido foi cancelado.</Text>
        ) : (
          <OrderTimeline status={order.status} />
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Itens</Text>
        {(order.items ?? []).map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemText}>
              {item.quantity}× {item.emoji} {item.name}
            </Text>
            <Text style={styles.itemPrice}>{formatMoney(item.total_price)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <Row label="Subtotal" value={formatMoney(order.subtotal)} />
        <Row
          label="Entrega"
          value={order.delivery_fee === 0 ? 'Grátis' : formatMoney(order.delivery_fee)}
        />
        <Row label="Total" value={formatMoney(order.total)} strong />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Entrega e pagamento</Text>
        <Text style={styles.detail}>
          {order.address_street}, {order.address_number} · {order.address_neighborhood}
          {order.address_complement ? ` · ${order.address_complement}` : ''}
        </Text>
        <Text style={styles.detail}>
          {paymentLabel}
          {order.change_for ? ` · troco para ${formatMoney(order.change_for)}` : ''}
        </Text>
      </Card>

      {isActive(order.status) && nextStatus(order.status) ? (
        <View style={styles.demo}>
          <Text style={styles.demoText}>
            Modo demonstração: em um app real, a loja atualiza o status.
          </Text>
          <Button
            title="Simular próximo passo"
            variant="secondary"
            loading={advance.isPending}
            onPress={() =>
              advance.mutate(order.id, {
                onError: (e) => notify('Não foi possível avançar', friendlyError(e)),
              })
            }
          />
        </View>
      ) : null}

      {canCancel(order.status) ? (
        <Button
          title="Cancelar pedido"
          variant="danger"
          onPress={confirmCancel}
          loading={cancel.isPending}
          style={styles.gap}
        />
      ) : null}
      {!isActive(order.status) ? (
        <Button
          title="Pedir novamente"
          onPress={orderAgain}
          loading={reorder.isPending}
          style={styles.gap}
        />
      ) : null}
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
  store: { fontSize: 24, fontWeight: '800', color: colors.text },
  date: { fontSize: 14, color: colors.muted, marginBottom: spacing.md },
  card: { marginBottom: spacing.md },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cancelled: { fontSize: 16, fontWeight: '700', color: colors.danger },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: spacing.md,
  },
  itemText: { flex: 1, fontSize: 15, color: colors.text },
  itemPrice: { fontSize: 15, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rowLabel: { fontSize: 15, color: colors.muted },
  rowValue: { fontSize: 15, color: colors.text },
  strong: { fontSize: 18, fontWeight: '800', color: colors.text },
  detail: { fontSize: 15, color: colors.text, marginBottom: 4 },
  demo: { gap: spacing.sm, marginBottom: spacing.md },
  demoText: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  gap: { marginBottom: spacing.sm },
});
