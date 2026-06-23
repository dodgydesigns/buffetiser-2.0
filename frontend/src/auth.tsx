import {
  createContext,
  FormEvent,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import logo from "./assets/logo_bk.webp";

export type AuthUser = {
  id: number;
  username: string;
  display_name: string;
  is_admin: boolean;
};

type AuthContextValue = {
  user: AuthUser;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await axios.get<AuthUser>("/api/v1/auth/me");
        setUser(response.data);
      } catch {
        const response = await axios.get<{ setup_required: boolean }>(
          "/api/v1/auth/status"
        );
        setSetupRequired(response.data.setup_required);
      } finally {
        setLoading(false);
      }
    }
    void loadSession();
  }, []);

  async function logout() {
    await axios.post("/api/v1/auth/logout");
    setUser(null);
    setSetupRequired(false);
  }

  if (loading) {
    return <main className="auth-page">Loading Buffetiser…</main>;
  }

  if (!user) {
    return (
      <LoginScreen
        setupRequired={setupRequired}
        onAuthenticated={setUser}
      />
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function LoginScreen({
  setupRequired,
  onAuthenticated,
}: {
  setupRequired: boolean;
  onAuthenticated: (user: AuthUser) => void;
}) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const endpoint = setupRequired ? "/api/v1/auth/setup" : "/api/v1/auth/login";
      const response = await axios.post<AuthUser>(endpoint, {
        username,
        password,
        ...(setupRequired ? { display_name: displayName } : {}),
      });
      onAuthenticated(response.data);
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(
          requestError.response?.data?.detail ??
            "Unable to sign in. Please try again."
        );
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <img className="auth-logo" src={logo} alt="Buffetiser" />
        <h1>{setupRequired ? "Create administrator" : "Welcome back"}</h1>
        <p>
          {setupRequired
            ? "Create the first account. Your existing portfolio will be assigned to it."
            : "Sign in to your private portfolio."}
        </p>
        {setupRequired && (
          <label>
            Display name
            <input
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </label>
        )}
        <label>
          Username
          <input
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            minLength={3}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={setupRequired ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={10}
            required
          />
        </label>
        {error && <div className="auth-error">{error}</div>}
        <button type="submit" disabled={submitting}>
          {submitting
            ? "Please wait…"
            : setupRequired
              ? "Create account"
              : "Sign in"}
        </button>
      </form>
    </main>
  );
}
