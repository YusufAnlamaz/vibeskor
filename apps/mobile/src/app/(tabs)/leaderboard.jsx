import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Users, Crown, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();

  const { data: leaders = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/leaderboard`,
      );
      if (!res.ok) throw new Error("Hata oluştu");
      return res.json();
    },
  });

  return (
    <View
      style={{ flex: 1, backgroundColor: "#121212", paddingTop: insets.top }}
    >
      <View style={{ paddingHorizontal: 20, paddingVertical: 15 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
          Liderlik Tablosu
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        <View style={{ alignItems: "center", marginBottom: 30 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "rgba(234, 179, 8, 0.1)",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(234, 179, 8, 0.2)",
            }}
          >
            <Crown color="#EAB308" size={32} />
          </View>
          <Text
            style={{
              color: "white",
              fontSize: 18,
              fontWeight: "bold",
              marginTop: 10,
            }}
          >
            Haftalık Liderler
          </Text>
          <Text style={{ color: "#6B6B6B", fontSize: 12 }}>
            En iyi tahminciler burada!
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "#1E1E1E",
            borderRadius: 24,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#262626",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#262626",
            }}
          >
            <Text
              style={{
                flex: 2,
                color: "#4B5563",
                fontSize: 10,
                fontWeight: "bold",
              }}
            >
              SIRA
            </Text>
            <Text
              style={{
                flex: 7,
                color: "#4B5563",
                fontSize: 10,
                fontWeight: "bold",
              }}
            >
              KULLANICI
            </Text>
            <Text
              style={{
                flex: 3,
                color: "#4B5563",
                fontSize: 10,
                fontWeight: "bold",
                textAlign: "right",
              }}
            >
              PUAN
            </Text>
          </View>

          {isLoading ? (
            <ActivityIndicator color="#A855F7" style={{ marginVertical: 30 }} />
          ) : leaders.length > 0 ? (
            leaders.map((leader, index) => (
              <View
                key={leader.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  paddingVertical: 15,
                  borderBottomWidth: index === leaders.length - 1 ? 0 : 1,
                  borderBottomColor: "#262626",
                }}
              >
                <View style={{ flex: 2 }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor:
                        index === 0
                          ? "#EAB308"
                          : index === 1
                            ? "#94A3B8"
                            : index === 2
                              ? "#B45309"
                              : "#262626",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: index < 3 ? "black" : "#6B6B6B",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      {index + 1}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    flex: 7,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: "#262626",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <User color="#4B5563" size={16} />
                  </View>
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    {leader.name}
                  </Text>
                </View>
                <Text
                  style={{
                    flex: 3,
                    color: "white",
                    fontSize: 16,
                    fontWeight: "900",
                    textAlign: "right",
                  }}
                >
                  {leader.points}
                </Text>
              </View>
            ))
          ) : (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Text style={{ color: "#6B6B6B" }}>Kayıt bulunamadı.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
