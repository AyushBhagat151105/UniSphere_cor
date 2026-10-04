import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useLogin } from "@/src/hooks/queries/useAuthQueries";
import { Ionicons } from "@expo/vector-icons";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "react-native";

export default function Login() {
  const router = useRouter();
  const { mutateAsync: login, isPending } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;

  const handleLogin = async () => {
    try {
      setErrorMsg("");
      await login({ email, password });
      router.replace("/(drawer)");
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || "Invalid credentials");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.primary }]}>UniSphere</Text>
      <Text style={[styles.subtitle, { color: theme.text }]}>CHARUSAT Development Club</Text>

      {errorMsg ? <Text style={[styles.error, { color: theme.notification }]}>{errorMsg}</Text> : null}

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            color: theme.text,
          }
        ]}
        placeholder="Email"
        placeholderTextColor={theme.border}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <View style={[
        styles.passwordContainer,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }
      ]}>
        <TextInput
          style={[styles.passwordInput, { color: theme.text }]}
          placeholder="Password"
          placeholderTextColor={theme.border}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={handleLogin}
        disabled={isPending}
      >
        <Text style={[styles.buttonText, { color: theme.background }]}>
          {isPending ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 32, fontWeight: "900", textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 30, textAlign: "center", opacity: 0.7 },
  input: { borderWidth: 1, padding: 16, marginBottom: 16, borderRadius: 6 },
  passwordContainer: { flexDirection: "row", borderWidth: 1, borderRadius: 6, marginBottom: 16 },
  passwordInput: { flex: 1, padding: 16 },
  eyeIcon: { padding: 16, justifyContent: "center", alignItems: "center" },
  button: { padding: 16, borderRadius: 6, alignItems: "center", marginTop: 8 },
  buttonText: { fontWeight: "bold", fontSize: 16 },
  error: { marginBottom: 16, textAlign: "center", fontWeight: "600" }
});

