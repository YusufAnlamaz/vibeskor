import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Trophy, LayoutGrid } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StandingsScreen() {
  const insets = useSafeAreaInsets();

  const { data: standingsGrouped = {}, isLoading } = useQuery({
    queryKey: ["standings"],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/standings`,
      );
      if (!res.ok) throw new Error("Veriler yüklenemedi");
      return res.json();
    },
  });

  return (
    <View
      style={{ flex: 1, backgroundColor: "#121212", paddingTop: insets.top }}
    >
      <View style={{ paddingHorizontal: 20, paddingVertical: 15 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
          Puan Durumu
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        {isLoading ? (
          <ActivityIndicator color="#A855F7" style={{ marginTop: 50 }} />
        ) : Object.keys(standingsGrouped).length > 0 ? (
          Object.entries(standingsGrouped).map(([league, teams]) => (
            <View
              key={league}
              style={{
                backgroundColor: "#1E1E1E",
                borderRadius: 20,
                overflow: "hidden",
                marginBottom: 20,
                borderWidth: 1,
                borderColor: "#262626",
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(168, 85, 247, 0.1)",
                  padding: 15,
                  borderBottomWidth: 1,
                  borderBottomColor: "#262626",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                >
                  {league}
                </Text>
              </View>

              <View style={{ padding: 10 }}>
                <View
                  style={{
                    flexDirection: "row",
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: "#262626",
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      color: "#6B6B6B",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  >
                    SIRA
                  </Text>
                  <Text
                    style={{
                      flex: 4,
                      color: "#6B6B6B",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  >
                    TAKIM
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      color: "#6B6B6B",
                      fontSize: 10,
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    G
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      color: "#6B6B6B",
                      fontSize: 10,
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    M
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      color: "#6B6B6B",
                      fontSize: 10,
                      fontWeight: "bold",
                      textAlign: "right",
                    }}
                  >
                    P
                  </Text>
                </View>

                {teams.map((team, index) => (
                  <View
                    key={team.id}
                    style={{
                      flexDirection: "row",
                      paddingVertical: 12,
                      borderBottomWidth: index === teams.length - 1 ? 0 : 1,
                      borderBottomColor: "#262626",
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        color: index < 3 ? "white" : "#4B5563",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      {index + 1}
                    </Text>
                    <Text
                      style={{
                        flex: 4,
                        color: "white",
                        fontSize: 12,
                        fontWeight: "500",
                      }}
                    >
                      {team.team_name}
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        color: "#22C55E",
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      {team.won}
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        color: "#EF4444",
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      {team.lost}
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        color: "white",
                        fontSize: 12,
                        fontWeight: "bold",
                        textAlign: "right",
                      }}
                    >
                      {team.points}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={{ alignItems: "center", marginTop: 50 }}>
            <LayoutGrid color="#262626" size={64} />
            <Text style={{ color: "#6B6B6B", marginTop: 10 }}>
              Veri bulunamadı.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
