import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Container } from "@/components/container";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";
import { useAuthStore } from "@/src/stores/auth.store";

export default function Home() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
  const user = useAuthStore((state) => state.user);

  return (
    <Container>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.primary }]}>Dashboard</Text>
            <Text style={[styles.subtitle, { color: theme.text }]}>
              Welcome back, {user?.email || "Student"}!
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>Your Role</Text>
            <View style={[styles.roleBadge, { backgroundColor: theme.background }]}>
              <Text style={[styles.roleText, { color: theme.primary }]}>
                {user?.role || "N/A"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: "900", // Imitates font-black / display
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    opacity: 0.7,
  },
  card: {
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderRadius: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold", // Imitates display font
    marginBottom: 16,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB", // Assuming a slight border
  },
  roleText: {
    fontSize: 24,
    fontWeight: "900", // Imitates font-black
  },
});

