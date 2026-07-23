import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Gamepad2, Calendar, LogIn } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/utils/auth/useAuth";
import { useRouter } from "expo-router";

const GAME_TABS = [
  { id: "hepsi", name: "Hepsi" },
  { id: "valorant", name: "Valorant" },
  { id: "cs2", name: "CS2" },
  { id: "lol", name: "LoL" },
  { id: "pubgm", name: "PUBGM" },
];

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState("hepsi");
  const insets = useSafeAreaInsets();
  const { auth, signIn } = useAuth();
  const router = useRouter();

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches", activeTab],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/matches?game=${activeTab}`,
      );
      if (!res.ok) throw new Error("Maçlar yüklenemedi");
      return res.json();
    },
    // Refresh every 30s for live score updates
    refetchInterval: 30000,
  });

  return (
    <View
      style={{ flex: 1, backgroundColor: "#121212", paddingTop: insets.top }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 15,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 32,
              height: 32,
              backgroundColor: "#A855F7",
              borderRadius: 8,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Trophy color="white" size={20} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>
            Vibe<Text style={{ color: "#A855F7" }}>Skor</Text>
          </Text>
        </View>
        {!auth && (
          <TouchableOpacity onPress={() => signIn()} style={{ padding: 8 }}>
            <LogIn color="#A855F7" size={24} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            gap: 10,
            paddingBottom: 15,
          }}
        >
          {GAME_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: activeTab === tab.id ? "#A855F7" : "#1E1E1E",
                borderWidth: 1,
                borderColor: activeTab === tab.id ? "#A855F7" : "#262626",
              }}
            >
              <Text
                style={{
                  color: activeTab === tab.id ? "white" : "#6B6B6B",
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 15,
          }}
        >
          <Calendar color="#A855F7" size={18} />
          <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
            Günün Maçları
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#A855F7" style={{ marginTop: 50 }} />
        ) : matches.length > 0 ? (
          matches.map((match) => (
            <TouchableOpacity
              key={match.id}
              onPress={() => router.push(`/(tabs)/match/${match.id}`)}
              style={{
                backgroundColor: "#1E1E1E",
                borderRadius: 16,
                padding: 15,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "#262626",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    color: "#6B6B6B",
                    fontSize: 10,
                    fontWeight: "700",
                    textTransform: "uppercase",
                  }}
                >
                  {match.tournament}
                </Text>
                {match.status === "live" && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
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
                      style={{
                        color: "#EF4444",
                        fontSize: 10,
                        fontWeight: "bold",
                      }}
                    >
                      CANLI
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1, alignItems: "center" }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: "#262626",
                      borderRadius: 10,
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      {match.team_a_name?.[0]}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: "white",
                      fontSize: 12,
                      fontWeight: "500",
                      textAlign: "center",
                    }}
                  >
                    {match.team_a_name}
                  </Text>
                </View>

                <View style={{ flex: 1, alignItems: "center" }}>
                  {match.status === "live" ? (
                    <Text
                      style={{
                        color: "white",
                        fontSize: 24,
                        fontWeight: "900",
                      }}
                    >
                      {match.score_a} - {match.score_b}
                    </Text>
                  ) : (
                    <Text
                      style={{
                        color: "#A855F7",
                        fontSize: 16,
                        fontWeight: "bold",
                      }}
                    >
                      {new Date(match.start_time).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  )}
                  <Text
                    style={{
                      color: "#4B5563",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  >
                    BO3
                  </Text>
                </View>

                <View style={{ flex: 1, alignItems: "center" }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: "#262626",
                      borderRadius: 10,
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      {match.team_b_name?.[0]}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: "white",
                      fontSize: 12,
                      fontWeight: "500",
                      textAlign: "center",
                    }}
                  >
                    {match.team_b_name}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={{ alignItems: "center", marginTop: 50 }}>
            <Gamepad2 color="#262626" size={64} />
            <Text style={{ color: "#6B6B6B", marginTop: 10 }}>
              Maç bulunamadı.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
