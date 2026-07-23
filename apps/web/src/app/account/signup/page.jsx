import { useState } from "react";
import useAuth from "@/utils/useAuth";

function MainComponent() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const { signUpWithCredentials } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password || !name) {
      setError("Lütfen tüm alanları doldurun");
      setLoading(false);
      return;
    }

    try {
      await signUpWithCredentials({
        email,
        password,
        name,
        callbackUrl: "/",
        redirect: true,
      });
    } catch (err) {
      const errorMessages = {
        CredentialsSignin: "Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.",
        Configuration:
          "Kayıt sistemi şu an kullanılamıyor. Lütfen tekrar deneyin.",
        AccessDenied: "Bu işlem için izniniz bulunmuyor.",
        Default: "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.",
      };
      setError(errorMessages[err?.message] || errorMessages.Default);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#121212] p-4 font-sans text-white">
      <form
        noValidate
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-[#1E1E1E] p-8 shadow-2xl border border-purple-500/20"
      >
        <h1 className="mb-2 text-center text-3xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
          VibeSkor
        </h1>
        <p className="mb-8 text-center text-gray-400 text-sm">
          Topluluğumuza Katıl!
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Kullanıcı Adı
            </label>
            <div className="overflow-hidden rounded-lg border border-gray-800 bg-[#262626] px-4 py-3 focus-within:border-purple-500 transition-colors">
              <input
                required
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Gamer123"
                className="w-full bg-transparent text-lg outline-none text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              E-posta
            </label>
            <div className="overflow-hidden rounded-lg border border-gray-800 bg-[#262626] px-4 py-3 focus-within:border-purple-500 transition-colors">
              <input
                required
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                className="w-full bg-transparent text-lg outline-none text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Şifre
            </label>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-[#262626] px-4 py-3 focus-within:border-purple-500 transition-colors">
              <input
                required
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-transparent text-lg outline-none text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 text-base font-medium text-white transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {loading ? "Hesap Oluşturuluyor..." : "Kayıt Ol"}
          </button>
          <p className="text-center text-sm text-gray-400">
            Zaten hesabın var mı?{" "}
            <a
              href="/account/signin"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Giriş Yap
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}

export default MainComponent;
