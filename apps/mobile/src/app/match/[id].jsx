import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  MessageSquare,
  Send,
  Trophy,
  Info,
  Play,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/utils/auth/useAuth";
import { Video, ResizeMode } from "expo-av";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

export default function MatchDetailScreen() {
  const { id: matchId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { auth, signIn } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const scrollViewRef = useRef(null);

  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/matches`,
      );
      const matches = await res.json();
      return matches.find((m) => m.id === parseInt(matchId));
    },
    // Poll every 30s for live score updates
    refetchInterval: (data) => (data?.status === "live" ? 30000 : false),
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: ["chat", matchId],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/chat?matchId=${matchId}`,
      );
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 3000,
  });

  const chatMutation = useMutation({
    mutationFn: async (text) => {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, message: text }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", matchId] });
      setMessage("");
    },
  });

  const predictionMutation = useMutation({
    mutationFn: async (predictedTeam) => {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/predictions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId, predictedTeam }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Tahmin yapılamadı");
      }
      return res.json();
    },
    onSuccess: () => {
      alert("Tahmininiz alındı! Maç bitince puan hesaplanacak (+50 puan).");
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  if (matchLoading)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#121212",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#A855F7" />
      </View>
    );
  if (!match)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#121212",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white" }}>Maç bulunamadı.</Text>
      </View>
    );

  return (
    <View
      style={{ flex: 1, backgroundColor: "#121212", paddingTop: insets.top }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 15,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: "#1E1E1E",
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 5 }}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>
            {match.team_a_name} vs {match.team_b_name}
          </Text>
          <Text
            style={{
              color: "#6B6B6B",
              fontSize: 10,
              textTransform: "uppercase",
            }}
          >
            {match.tournament}
          </Text>
        </View>
        {match.status === "live" && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: "rgba(239,68,68,0.1)",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 10,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#EF4444",
              }}
            />
            <Text
              style={{ color: "#EF4444", fontSize: 10, fontWeight: "bold" }}
            >
              CANLI
            </Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingAnimatedView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Live Score Banner */}
          {match.status === "live" && (
            <View
              style={{
                margin: 20,
                marginBottom: 0,
                backgroundColor: "rgba(239,68,68,0.1)",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(239,68,68,0.2)",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#EF4444", fontSize: 12, fontWeight: "600" }}
              >
                {match.team_a_name}
              </Text>
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{ color: "white", fontSize: 28, fontWeight: "900" }}
                >
                  {match.score_a} – {match.score_b}
                </Text>
                <Text
                  style={{ color: "#EF4444", fontSize: 10, fontWeight: "bold" }}
                >
                  CANLI SKOR
                </Text>
              </View>
              <Text
                style={{ color: "#EF4444", fontSize: 12, fontWeight: "600" }}
              >
                {match.team_b_name}
              </Text>
            </View>
          )}

          {/* Player area */}
          <View
            style={{
              width: "100%",
              aspectRatio: 16 / 9,
              backgroundColor: "black",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Play color="#262626" size={48} />
            <Text style={{ color: "#4B5563", marginTop: 10, fontSize: 12 }}>
              Canlı Yayın için tarayıcıda izle
            </Text>
          </View>

          {/* Predictions */}
          <View style={{ padding: 20 }}>
            <View
              style={{
                backgroundColor: "#1E1E1E",
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: "#262626",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
                >
                  Gamer Tahmin
                </Text>
                <View
                  style={{
                    backgroundColor: "rgba(168,85,247,0.1)",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: "rgba(168,85,247,0.2)",
                  }}
                >
                  <Text
                    style={{
                      color: "#A855F7",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  >
                    +50 PUAN
                  </Text>
                </View>
              </View>
              <Text
                style={{ color: "#6B6B6B", fontSize: 12, marginBottom: 20 }}
              >
                Kazananı seç, maç bitince puan kazan!
              </Text>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => predictionMutation.mutate("team_a")}
                  disabled={predictionMutation.isLoading}
                  style={{
                    flex: 1,
                    backgroundColor: "#262626",
                    padding: 15,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "white", fontWeight: "bold", fontSize: 12 }}
                  >
                    {match.team_a_name}
                  </Text>
                  <Text
                    style={{
                      color: "#A855F7",
                      fontSize: 10,
                      fontWeight: "bold",
                      marginTop: 4,
                    }}
                  >
                    KAZANIR
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => predictionMutation.mutate("team_b")}
                  disabled={predictionMutation.isLoading}
                  style={{
                    flex: 1,
                    backgroundColor: "#262626",
                    padding: 15,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "white", fontWeight: "bold", fontSize: 12 }}
                  >
                    {match.team_b_name}
                  </Text>
                  <Text
                    style={{
                      color: "#3B82F6",
                      fontSize: 10,
                      fontWeight: "bold",
                      marginTop: 4,
                    }}
                  >
                    KAZANIR
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Chat */}
          <View style={{ paddingHorizontal: 20 }}>
            <View
              style={{
                backgroundColor: "#1E1E1E",
                borderRadius: 20,
                height: 350,
                borderWidth: 1,
                borderColor: "#262626",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 15,
                  borderBottomWidth: 1,
                  borderBottomColor: "#262626",
                }}
              >
                <MessageSquare color="#A855F7" size={18} />
                <Text
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    marginLeft: 10,
                    fontSize: 14,
                  }}
                >
                  Canlı Chat
                </Text>
              </View>

              <ScrollView
                style={{ flex: 1, padding: 15 }}
                ref={scrollViewRef}
                onContentSizeChange={() =>
                  scrollViewRef.current?.scrollToEnd({ animated: true })
                }
              >
                {chatMessages.length > 0 ? (
                  chatMessages.map((msg) => (
                    <View key={msg.id} style={{ marginBottom: 12 }}>
                      <Text
                        style={{
                          color: "#A855F7",
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      >
                        {msg.username}
                      </Text>
                      <Text style={{ color: "#D1D5DB", fontSize: 13 }}>
                        {msg.message}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text
                    style={{
                      color: "#4B5563",
                      textAlign: "center",
                      marginTop: 50,
                      fontSize: 12,
                    }}
                  >
                    Henüz mesaj yok.
                  </Text>
                )}
              </ScrollView>

              <View
                style={{
                  padding: 10,
                  borderTopWidth: 1,
                  borderTopColor: "#262626",
                }}
              >
                {auth ? (
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TextInput
                      value={message}
                      onChangeText={setMessage}
                      placeholder="Mesaj yaz..."
                      placeholderTextColor="#4B5563"
                      style={{
                        flex: 1,
                        backgroundColor: "#262626",
                        color: "white",
                        paddingHorizontal: 15,
                        paddingVertical: 8,
                        borderRadius: 12,
                        fontSize: 14,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        if (message.trim()) chatMutation.mutate(message);
                      }}
                      style={{
                        backgroundColor: "#A855F7",
                        padding: 10,
                        borderRadius: 12,
                        justifyContent: "center",
                      }}
                    >
                      <Send color="white" size={18} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => signIn()}
                    style={{ padding: 5 }}
                  >
                    <Text
                      style={{
                        color: "#A855F7",
                        textAlign: "center",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      Mesaj yazmak için giriş yap
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingAnimatedView>
    </View>
  );
}
