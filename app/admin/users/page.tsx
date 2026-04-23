"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Shield, Loader2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: "admin" | "manager" | "analyst" | "viewer";
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    prenom: "",
    nom: "",
    role: "analyst" as User["role"],
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.data || []);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des utilisateurs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email) {
      setError("Email requis");
      return;
    }
    try {
      setCreating(true);
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Failed to create user");
      }
      await fetchUsers();
      setShowCreateForm(false);
      setNewUser({ email: "", prenom: "", nom: "", role: "analyst" });
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (userId: string, role: User["role"]) => {
    try {
      setSavingUserId(userId);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Failed to update user role");
      }
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role } : user)));
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour du rôle");
    } finally {
      setSavingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete user");
      }
      setUsers(users.filter((u) => u.id !== userId));
      setShowDeleteConfirm(null);
    } catch (err) {
      setError("Erreur lors de la suppression");
      console.error(err);
    }
  };

  const roleLabelsFR: Record<string, string> = {
    admin: "Administrateur",
    manager: "Gestionnaire",
    analyst: "Analyste",
    viewer: "Lecteur",
  };

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/20 text-red-400",
    manager: "bg-blue-500/20 text-blue-400",
    analyst: "bg-green-500/20 text-green-400",
    viewer: "bg-slate-500/20 text-slate-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Gestion des utilisateurs
            </h1>
            <p className="text-slate-400 mt-2">
              Gérez les comptes utilisateurs et leurs rôles
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center gap-2"
        >
          <Plus size={16} />
          Nouvel utilisateur
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            value={newUser.email}
            onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Email"
            className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          />
          <input
            value={newUser.prenom}
            onChange={(e) => setNewUser((prev) => ({ ...prev, prenom: e.target.value }))}
            placeholder="Prénom"
            className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          />
          <input
            value={newUser.nom}
            onChange={(e) => setNewUser((prev) => ({ ...prev, nom: e.target.value }))}
            placeholder="Nom"
            className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value as User["role"] }))}
            className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          >
            <option value="admin">Administrateur</option>
            <option value="manager">Gestionnaire</option>
            <option value="analyst">Analyste</option>
            <option value="viewer">Lecteur</option>
          </select>
          <button
            onClick={handleCreateUser}
            disabled={creating}
            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded px-4 py-2"
          >
            {creating ? "Création..." : "Créer"}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Chargement...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Aucun utilisateur trouvé
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Créé le
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-white">
                      {user.prenom} {user.nom}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}
                      >
                        {roleLabelsFR[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`mailto:${user.email}`}
                          className="px-2 py-1 text-xs text-blue-300 hover:bg-blue-500/20 rounded transition-colors"
                          title="Contacter"
                        >
                          Email
                        </Link>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as User["role"])}
                          className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                          disabled={savingUserId === user.id}
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="analyst">Analyst</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        {savingUserId === user.id && (
                          <Loader2 size={14} className="animate-spin text-slate-300" />
                        )}
                        {showDeleteConfirm === user.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Confirmer
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="px-2 py-1 text-xs bg-slate-600 text-white rounded hover:bg-slate-700"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowDeleteConfirm(user.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
        <div className="flex gap-3">
          <Shield size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-400">
            <p className="font-semibold mb-1">Rôles disponibles</p>
            <ul className="space-y-1 text-xs">
              <li>
                <strong>Administrateur :</strong> Accès complet, gestion des
                utilisateurs et paramètres
              </li>
              <li>
                <strong>Gestionnaire :</strong> Gestion des clients et projets
              </li>
              <li>
                <strong>Analyste :</strong> Créer et modifier les évaluations
              </li>
              <li>
                <strong>Lecteur :</strong> Accès en lecture seule
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
