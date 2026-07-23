import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useAuth } from "@/utils/auth/useAuth";
import { User, LogOut, Trophy, Star, Settings } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { auth, signOut, signIn } = useAuth();
  const insets = useSafeAreaInsets();

  if (!auth) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#121212",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "#1E1E1E",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <User color="#4B5563" size={40} />
        </View>
        <Text
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 10,
          }}
        >
          Profiline Eriş
        </Text>
        <Text
          style={{ color: "#6B6B6B", textAlign: "center", marginBottom: 30 }}
        >
          Puanlarını görmek ve tahmin yapmak için giriş yapmalısın.
        </Text>
        <TouchableOpacity
          onPress={() => signIn()}
          style={{
            backgroundColor: "#A855F7",
            paddingHorizontal: 40,
            paddingVertical: 15,
            borderRadius: 12,
            width: "100%",
          }}
        >
          <Text
            style={{ color: "white", textAlign: "center", fontWeight: "bold" }}
          >
            Giriş Yap / Kayıt Ol
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: "#121212", paddingTop: insets.top }}
    >
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 15,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
          Profil
        </Text>
        <TouchableOpacity onPress={() => signOut()}>
          <LogOut color="#EF4444" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        <View style={{ alignItems: "center", marginVertical: 30 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "#1E1E1E",
              justifyContent: "center",
              alignItems: "center",
              borderWeight: 2,
              borderColor: "#A855F7",
              marginBottom: 15,
            }}
          >
            <User color="#A855F7" size={50} />
          </View>
          <Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>
            {auth.user.name || auth.user.email.split("@")[0]}
          </Text>
          <Text style={{ color: "#6B6B6B", fontSize: 14 }}>
            {auth.user.email}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 15, marginBottom: 30 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "#1E1E1E",
              borderRadius: 20,
              padding: 20,
              alignItems: "center",
              borderWeight: 1,
              borderColor: "#262626",
            }}
          >
            <Trophy color="#EAB308" size={24} />
            <Text
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: "900",
                marginTop: 5,
              }}
            >
              {auth.user.points || 0}
            </Text>
            <Text
              style={{
                color: "#6B6B6B",
                fontSize: 10,
                fontWeight: "bold",
                marginTop: 2,
              }}
            >
              TOPLAM PUAN
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "#1E1E1E",
              borderRadius: 20,
              padding: 20,
              alignItems: "center",
              borderWeight: 1,
              borderColor: "#262626",
            }}
          >
            <Star color="#3B82F6" size={24} />
            <Text
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: "900",
                marginTop: 5,
              }}
            >
              #124
            </Text>
            <Text
              style={{
                color: "#6B6B6B",
                fontSize: 10,
                fontWeight: "bold",
                marginTop: 2,
              }}
            >
              SIRALAMA
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: "#1E1E1E",
            borderRadius: 24,
            padding: 10,
            borderWeight: 1,
            borderColor: "#262626",
          }}
        >
          {[
            {
              icon: <Trophy color="#6B6B6B" size={20} />,
              label: "Tahmin Geçmişi",
            },
            { icon: <Star color="#6B6B6B" size={20} />, label: "Başarımlar" },
            { icon: <Settings color="#6B6B6B" size={20} />, label: "Ayarlar" },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 15,
                padding: 15,
                borderBottomWidth: index === 2 ? 0 : 1,
                borderBottomColor: "#262626",
              }}
            >
              {item.icon}
              <Text style={{ color: "white", fontWeight: "600" }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
