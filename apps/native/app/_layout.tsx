import { DarkTheme, DefaultTheme, type Theme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef } from "react";
import { Platform, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

import { MobileUIProvider } from "@/components/mobile-ui-provider";
import { setAndroidNavigationBar } from "@/lib/android-navigation-bar";
import { NAV_THEME } from "@/lib/constants";
import { useUpdateCheck } from "@/lib/updates";
import { useColorScheme } from "@/lib/use-color-scheme";

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export const unstable_settings = {
  initialRouteName: "(drawer)",
};

const useIsomorphicLayoutEffect =
  Platform.OS === "web" && typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default function RootLayout() {
  useUpdateCheck();
  React.useEffect(() => {
    if (Platform.OS !== "web") {
      import("@/lib/notifications")
        .then(({ registerForPushNotificationsAsync }) => registerForPushNotificationsAsync())
        .catch(console.warn);
    }
  }, []);
  const hasMounted = useRef(false);
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

  useIsomorphicLayoutEffect(() => {
    if (hasMounted.current) {
      return;
    }
    setAndroidNavigationBar(colorScheme);
    setIsColorSchemeLoaded(true);
    hasMounted.current = true;
  }, []);

  if (!isColorSchemeLoaded) {
    return null;
  }

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
          <StatusBar style={isDarkColorScheme ? "light" : "dark"} />
          <GestureHandlerRootView style={styles.container}>
            <MobileUIProvider>
              <Stack>
                <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ title: "Modal", presentation: "modal" }} />
              </Stack>
            </MobileUIProvider>
          </GestureHandlerRootView>
        </ThemeProvider>
      </QueryClientProvider>
    </>
  );
}
