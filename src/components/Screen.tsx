import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
}

export function Screen({
  children,
  scroll = false,
  edges = ['top', 'left', 'right'],
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {scroll ? (
        <KeyboardAvoidingView
          style={styles.flex}
          // CORREÇÃO C14: desde o SDK 54 o Android é sempre edge-to-edge e a janela não
          // encolhe sozinha com o teclado; com "undefined" o teclado cobria o fim do
          // checkout (troco e botão Confirmar). "padding" funciona nas duas plataformas.
          behavior="padding"
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.md, flexGrow: 1 },
});
