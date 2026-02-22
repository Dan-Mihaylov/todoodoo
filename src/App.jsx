import { useState, useEffect } from "react";

const API = "https://api.todoodoo.com";

const api = {
  async request(path, options = {}, token) {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  },
  login: (username, password) => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);
    return api.request("/login", {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },
  getTodos: (token) => api.request("/todos", {}, token),
  createTodo: (token, title, date) =>
    api.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title, date }),
    }, token),
  updateTodo: (token, id, completed) =>
    api.request(`/todos/${id}`, {
      method: "PUT",
      body: JSON.stringify({ completed }),
    }, token),
  deleteTodo: (token, id) =>
    api.request(`/todos/${id}`, { method: "DELETE" }, token),
};

// ---- Login Screen ----
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.login(username, password);
      onLogin(data.token || data.access_token);
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-400 rounded-sm rotate-12" />
            <span className="text-amber-400 text-3xl font-black tracking-tighter" style={{ fontFamily: "'Georgia', serif" }}>
              todoodoo
            </span>
          </div>
          <p className="text-stone-500 text-sm mt-1">Sign in to manage your todos</p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-4 bg-red-950 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-stone-400 text-xs font-semibold uppercase tracking-widest mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder-stone-600"
                placeholder="your username"
              />
            </div>
            <div>
              <label className="block text-stone-400 text-xs font-semibold uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder-stone-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !username || !password}
            className="mt-6 w-full bg-amber-400 hover:bg-amber-300 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 font-bold py-3 rounded-lg text-sm transition-all duration-150 tracking-wide"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Todo Item ----
function TodoItem({ todo, token, onUpdate, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    try {
      await api.updateTodo(token, todo.id, !todo.completed);
      onUpdate();
    } catch { /* silent */ }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteTodo(token, todo.id);
      onUpdate();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-150 group ${
        todo.completed
          ? "bg-stone-900 border-stone-800 opacity-60"
          : "bg-stone-900 border-stone-700 hover:border-stone-600"
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          todo.completed
            ? "bg-amber-400 border-amber-400"
            : "border-stone-600 hover:border-amber-400"
        }`}
      >
        {todo.completed && (
          <svg className="w-3 h-3 text-stone-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${todo.completed ? "line-through text-stone-500" : "text-stone-100"}`}>
          {todo.title}
        </p>
        {todo.date && (
          <p className="text-xs text-stone-600 mt-0.5">
            {new Date(todo.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-stone-600 hover:text-red-400 transition-all p-1 rounded"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      </button>
    </div>
  );
}

// ---- Add Todo Form ----
function AddTodoForm({ token, onAdd }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async () => {
    if (!title || !date) return;
    setLoading(true);
    try {
      await api.createTodo(token, title, date);
      setTitle("");
      setDate("");
      setOpen(false);
      onAdd();
    } catch { /* silent */ }
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 p-4 rounded-xl border border-dashed border-stone-700 hover:border-amber-400 hover:bg-stone-900 text-stone-500 hover:text-amber-400 transition-all text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add a new todo
      </button>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-amber-400/50 bg-stone-900 space-y-3">
      <input
        autoFocus
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-all placeholder-stone-600"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full bg-stone-800 border border-stone-700 text-stone-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-all"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!title || !date || loading}
          className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 font-bold py-2 rounded-lg text-sm transition-all"
        >
          {loading ? "Adding..." : "Add Todo"}
        </button>
        <button
          onClick={() => { setOpen(false); setTitle(""); setDate(""); }}
          className="px-4 py-2 text-stone-500 hover:text-stone-300 rounded-lg text-sm transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---- Main App ----
function TodoApp({ token, onLogout }) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchTodos = async () => {
    try {
      const data = await api.getTodos(token);
      setTodos(Array.isArray(data) ? data : data.todos || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchTodos(); }, []);

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "done") return t.completed;
    return true;
  });

  const doneCount = todos.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-stone-950 px-4 py-10">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-400 rounded-sm rotate-12" />
            <span className="text-amber-400 text-xl font-black tracking-tighter" style={{ fontFamily: "'Georgia', serif" }}>
              todoodoo
            </span>
          </div>
          <button
            onClick={onLogout}
            className="text-stone-600 hover:text-stone-400 text-xs font-medium transition-all"
          >
            Sign out
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <h1 className="text-stone-100 text-2xl font-bold">Your Todos</h1>
          <p className="text-stone-500 text-sm mt-1">
            {doneCount} of {todos.length} completed
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 bg-stone-900 p-1 rounded-lg border border-stone-800">
          {["all", "active", "done"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 text-xs font-semibold uppercase tracking-widest rounded-md transition-all ${
                filter === f ? "bg-amber-400 text-stone-950" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Todo List */}
        <div className="space-y-2 mb-4">
          {loading ? (
            <div className="text-center py-12 text-stone-600 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-stone-600 text-sm">
              {filter === "all" ? "No todos yet. Add one below!" : `No ${filter} todos.`}
            </div>
          ) : (
            filtered.map((todo) => (
              <TodoItem key={todo.id} todo={todo} token={token} onUpdate={fetchTodos} onDelete={fetchTodos} />
            ))
          )}
        </div>

        {/* Add Form */}
        <AddTodoForm token={token} onAdd={fetchTodos} />
      </div>
    </div>
  );
}

// ---- Root ----
export default function App() {
  const [token, setToken] = useState(null);

  const handleLogin = (t) => setToken(t);
  const handleLogout = () => setToken(null);

  if (!token) return <LoginScreen onLogin={handleLogin} />;
  return <TodoApp token={token} onLogout={handleLogout} />;
}