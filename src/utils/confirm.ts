import { Alert, Platform } from 'react-native';

// CORREÇÃO C07: no navegador (npx expo start --web) o Alert.alert do react-native-web não
// faz nada. Sem isto, sair da conta, esvaziar o carrinho, cancelar o pedido e todas as
// mensagens de erro simplesmente não aconteciam no navegador.

// No navegador usamos as caixas nativas do browser (sem depender dos tipos do DOM).
const browser = globalThis as unknown as {
  alert: (text: string) => void;
  confirm: (text: string) => boolean;
};

// Mensagem simples, com um botão OK.
export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    browser.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

// Pergunta com "Cancelar" e um botão de confirmação.
export function confirm({
  title,
  message,
  confirmText,
  cancelText = 'Cancelar',
  destructive = false,
  onConfirm,
}: ConfirmOptions) {
  if (Platform.OS === 'web') {
    if (browser.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    {
      text: confirmText,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}
