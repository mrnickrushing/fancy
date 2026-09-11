import { Component, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, spacing } from '../theme';
import { Button } from './Button';

type Props = { children: ReactNode };
type State = { error: Error | null };

// A render error should not leave Amanda looking at a white screen in the
// middle of a market morning.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('The app hit an error it could not render through:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Something went wrong in the kitchen</Text>
        <Text style={styles.body}>{this.state.error.message}</Text>
        <Button label="Try again" onPress={() => this.setState({ error: null })} style={styles.button} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.s8 },
  title: { fontFamily: fonts.displaySemibold, fontSize: fontSize.xl, color: colors.text, textAlign: 'center' },
  body: { fontFamily: fonts.bodyRegular, fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.s3, lineHeight: 22 },
  button: { marginTop: spacing.s6, alignSelf: 'stretch' },
});
