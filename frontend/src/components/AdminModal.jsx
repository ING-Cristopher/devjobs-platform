/**
 * Archivo: AdminModal.jsx
 * Propósito: Panel de Administración (exclusivo rol 'admin') para supervisar métricas,
 * verificar usuarios manualmente, cambiar roles y eliminar cuentas problemáticas.
 */

import { useEffect, useState } from "react";
import { Shield, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  verifyUserByAdmin,
  deleteUserByAdmin,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AdminModal({ isOpen, onClose, showToast }) {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && token) {
      loadAdminData();
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        getAdminStats(token),
        getAdminUsers(token),
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err) {
      if (showToast) showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      const updated = await updateUserRole(targetUserId, newRole, token);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? updated : u))
      );
      if (showToast) showToast(`Rol actualizado a ${newRole}`);
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerifyUser = async (targetUserId) => {
    try {
      const updated = await verifyUserByAdmin(targetUserId, token);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? updated : u))
      );
      if (showToast) showToast("Usuario verificado manualmente");
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    const confirmed = window.confirm(
      `¿Eliminar la cuenta de "${targetUser.name}" (${targetUser.email}) y sus vacantes asociadas?`
    );
    if (!confirmed) return;

    try {
      await deleteUserByAdmin(targetUser.id, token);
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      if (showToast) showToast("Usuario eliminado");
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="chamba-modal-backdrop" onClick={onClose}>
      <div
        className="chamba-modal max-w-2xl max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex justify-between items-start pb-4"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="logo-sq"
              style={{
                background: "var(--sun)",
                width: "40px",
                height: "40px",
              }}
            >
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold">
                Panel de Administración
              </h2>
              <p className="meta text-xs mt-0.5">
                Gestión de usuarios, verificación de cuentas y moderación
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="x"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center items-center gap-2 meta">
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: "var(--blue)" }}
            />
            <span>Cargando datos de administración...</span>
          </div>
        ) : (
          <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
            {/* Resumen de métricas */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  className="p-3 rounded-2xl"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div className="font-display text-2xl font-extrabold">
                    {stats.total_users}
                  </div>
                  <div className="meta text-xs">
                    Usuarios ({stats.verified_users} verificados)
                  </div>
                </div>

                <div
                  className="p-3 rounded-2xl"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div className="font-display text-2xl font-extrabold">
                    {stats.total_recruiters}
                  </div>
                  <div className="meta text-xs">Reclutadores</div>
                </div>

                <div
                  className="p-3 rounded-2xl"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div className="font-display text-2xl font-extrabold">
                    {stats.total_jobs}
                  </div>
                  <div className="meta text-xs">Vacantes activas</div>
                </div>

                <div
                  className="p-3 rounded-2xl"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div className="font-display text-2xl font-extrabold">
                    {stats.total_applications}
                  </div>
                  <div className="meta text-xs">Postulaciones</div>
                </div>
              </div>
            )}

            {/* Lista de usuarios */}
            <div>
              <h3 className="text-base font-extrabold mb-2">
                Usuarios registrados ({users.length})
              </h3>
              <div className="space-y-2.5">
                {users.map((u) => {
                  const isSelf = user && u.id === user.id;
                  return (
                    <div
                      key={u.id}
                      className="p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3"
                      style={{
                        background: "var(--bg)",
                        border: "1px solid var(--line)",
                      }}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{u.name}</span>
                          <span
                            className={`tag ${u.is_verified ? "on" : ""}`}
                          >
                            {u.is_verified ? "Verificado" : "Sin verificar"}
                          </span>
                        </div>
                        <div className="meta text-xs">{u.email}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!u.is_verified && (
                          <button
                            type="button"
                            onClick={() => handleVerifyUser(u.id)}
                            className="tag on"
                            style={{ border: 0, padding: "5px 10px" }}
                            title="Verificar cuenta manualmente"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verificar</span>
                          </button>
                        )}

                        <select
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value)
                          }
                          className="chamba-input"
                          style={{
                            width: "auto",
                            padding: "5px 10px",
                            fontSize: "12px",
                          }}
                        >
                          <option value="candidato">Candidato</option>
                          <option value="reclutador">Reclutador</option>
                          <option value="admin">Admin</option>
                        </select>

                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="tag"
                            style={{
                              background: "#ff8f7a",
                              color: "#0e1330",
                              fontWeight: 700,
                              border: 0,
                              padding: "6px 10px",
                            }}
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div
          className="pt-3 flex justify-end"
          style={{ borderTop: "1px solid var(--line)" }}
        >
          <button type="button" onClick={onClose} className="btn ghost">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

