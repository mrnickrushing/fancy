import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { colors, fonts } from '../../src/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const glyph = (focused ? name : `${name}-outline`) as IconName;
  return (
    <View style={[styles.icon, focused && styles.iconFocused]}>
      <Ionicons name={glyph} size={20} color={focused ? colors.primaryActive : colors.textFaint} />
    </View>
  );
}

// Four tabs plus More. Menu, Reviews and Settings are real routes in this
// group but are reached from More — five is the most a tab bar holds before
// the labels start truncating.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryActive,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }) => <TabIcon name="receipt" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: ({ focused }) => <TabIcon name="people" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Days Off',
          tabBarIcon: ({ focused }) => <TabIcon name="calendar" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ focused }) => <TabIcon name="ellipsis-horizontal" focused={focused} />,
        }}
      />
      <Tabs.Screen name="menu" options={{ href: null }} />
      <Tabs.Screen name="reviews" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    height: 88,
    paddingTop: 6,
    paddingBottom: 28,
  },
  label: { fontFamily: fonts.displaySemibold, fontSize: 11, letterSpacing: 0.6 },
  icon: {
    width: 42,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
  },
  iconFocused: { backgroundColor: colors.primaryHighlight },
});
