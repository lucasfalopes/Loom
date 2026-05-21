"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Upload, Trash2, Download, Loader2 } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
}

interface ClothingItem {
  id: number;
  image: string;
  category: string;
  category_display: string;
}

const CATEGORIES = [
  { id: "PANTS", label: "Calça" },
  { id: "SHORTS", label: "Short/Bermuda" },
  { id: "T_SHIRT", label: "Camiseta" },
  { id: "SHIRT", label: "Camisa Social" },
  { id: "REGULAR_SHIRT", label: "Camisa" },
  { id: "POLO", label: "Camisa Polo" },
  { id: "JACKET", label: "Jaqueta" },
  { id: "COAT", label: "Casaco" },
  { id: "SWEATER", label: "Suéter" },
  { id: "SHOES", label: "Sapato/Tênis" },
  { id: "ACCESSORY", label: "Acessórios" },
];

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"users" | "clothes">("clothes");
  
  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [clothes, setClothes] = useState<ClothingItem[]>([]);

  // User Form
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isStaff, setIsStaff] = useState(false);

  // Clothes Form
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("T_SHIRT");
  const [fileKey, setFileKey] = useState(Date.now());

  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const getImageUrl = (path: string) => path.startsWith("http") ? path : `http://localhost:8000${path}`;

  useEffect(() => {
    checkAdminAndFetchData();
  }, [activeTab]);

  const checkAdminAndFetchData = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return router.push("/");

    try {
      // Verifica permissões
      const meRes = await fetch("http://localhost:8000/api/users/me/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!meRes.ok) return router.push("/");
      const meData = await meRes.json();
      if (!meData.is_staff && !meData.is_superuser) return router.push("/closet");

      // Fetch tab data
      if (activeTab === "users") {
        const res = await fetch("http://localhost:8000/api/users/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setUsers(await res.json());
      } else {
        const res = await fetch("http://localhost:8000/api/clothing-items/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setClothes(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/users/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          is_staff: isStaff
        }),
      });

      if (res.ok) {
        setNewUsername("");
        setNewPassword("");
        setIsStaff(false);
        checkAdminAndFetchData();
        setToast({ message: "Usuário criado com sucesso!", type: "success" });
      } else {
        setToast({ message: "Erro ao criar usuário.", type: "error" });
      }
    } catch (e) {
      console.error(e);
      setToast({ message: "Erro ao criar usuário.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClothing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return setToast({ message: "Selecione pelo menos uma imagem.", type: "error" });
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      
      const uploadPromises = selectedFiles.map(file => {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("category", selectedCategory);

        return fetch("http://localhost:8000/api/clothing-items/", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      });

      const results = await Promise.all(uploadPromises);
      if (results.every(r => r.ok)) {
        setSelectedFiles([]);
        setFileKey(Date.now());
        checkAdminAndFetchData();
        setToast({ message: "Roupa(s) adicionada(s) com sucesso!", type: "success" });
      } else {
        setToast({ message: "Erro ao fazer upload de algumas roupas.", type: "error" });
      }
    } catch (e) {
      console.error(e);
      setToast({ message: "Erro de conexão.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClothing = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar esta roupa?")) return;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/clothing-items/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) checkAdminAndFetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/clothing-items/export_zip/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Erro ao gerar ZIP");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "backup_armario.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setToast({ message: "Download iniciado!", type: "success" });
    } catch (e) {
      console.error(e);
      setToast({ message: "Erro ao gerar arquivo ZIP.", type: "error" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl text-white font-medium animate-in slide-in-from-bottom-5 fade-in ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.message}
        </div>
      )}

      <header>
        <h1 className="text-3xl font-bold text-white mb-2">Painel de Administração</h1>
        <p className="text-gray-400">Gerencie usuários convidados e adicione novas roupas ao acervo.</p>
      </header>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("clothes")}
          className={`px-6 py-2 rounded-xl font-medium transition-all ${activeTab === "clothes" ? "bg-purple-600 text-white shadow-lg" : "text-gray-400 hover:bg-white/5"}`}
        >
          Acervo de Roupas
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-6 py-2 rounded-xl font-medium transition-all ${activeTab === "users" ? "bg-purple-600 text-white shadow-lg" : "text-gray-400 hover:bg-white/5"}`}
        >
          Usuários Convidados
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulário lateral */}
        <div className="lg:col-span-1">
          {activeTab === "clothes" ? (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Upload size={20} /> Adicionar Roupa
              </h2>
              <form onSubmit={handleUploadClothing} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Categoria</label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id} className="bg-gray-900">{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Imagem (Foto da Peça)</label>
                  <input 
                    key={fileKey}
                    type="file" 
                    accept="image/*"
                    multiple
                    onChange={(e) => setSelectedFiles(e.target.files ? Array.from(e.target.files) : [])}
                    className="w-full p-2 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                  />
                  {selectedFiles.length > 0 && (
                    <p className="text-xs text-purple-300 mt-2">{selectedFiles.length} imagem(ns) selecionada(s)</p>
                  )}
                </div>
                <button 
                  type="submit" 
                  disabled={loading || selectedFiles.length === 0}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-medium hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {loading ? "Enviando..." : "Fazer Upload"}
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <UserPlus size={20} /> Adicionar Usuário
              </h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Nome de Usuário</label>
                  <input 
                    type="text" 
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Ex: Denise"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Senha Inicial</label>
                  <input 
                    type="password" 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="******"
                  />
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <input 
                    type="checkbox" 
                    id="isStaff"
                    checked={isStaff}
                    onChange={(e) => setIsStaff(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 bg-gray-800 border-gray-600 focus:ring-purple-500"
                  />
                  <label htmlFor="isStaff" className="text-sm text-gray-300">É Administrador?</label>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-medium hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {loading ? "Criando..." : "Criar Conta"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Listagem Principal */}
        <div className="lg:col-span-2">
          {activeTab === "clothes" ? (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Peças Cadastradas</h2>
                <button 
                  onClick={handleExportZip}
                  disabled={isExporting}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 w-48"
                >
                  {isExporting ? (
                    <>
                      <Loader2 size={16} className="animate-spin flex-shrink-0" />
                      <span className="whitespace-nowrap">Compactando...</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} className="flex-shrink-0" />
                      <span className="whitespace-nowrap">Baixar Backup (ZIP)</span>
                    </>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
                {clothes.map(item => (
                  <div key={item.id} className="relative group rounded-xl overflow-hidden shadow-lg border border-white/10 glass-card">
                    <img src={getImageUrl(item.image)} alt="Roupa" className="w-full h-auto block" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300">
                      <span className="text-white text-xs font-medium mb-2">{item.category_display}</span>
                      <button 
                        onClick={() => handleDeleteClothing(item.id)}
                        className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Lista de Usuários</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="text-xs uppercase bg-white/5 text-gray-300">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">ID</th>
                      <th className="px-4 py-3">Usuário</th>
                      <th className="px-4 py-3">Nível de Acesso</th>
                      <th className="px-4 py-3 rounded-tr-lg">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4">{user.id}</td>
                        <td className="px-4 py-4 font-medium text-white">{user.username}</td>
                        <td className="px-4 py-4">
                          {user.is_staff ? (
                            <span className="bg-purple-500/20 text-purple-300 py-1 px-3 rounded-full text-xs">Admin</span>
                          ) : (
                            <span className="bg-gray-500/20 text-gray-300 py-1 px-3 rounded-full text-xs">Convidado</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <button className="text-purple-400 hover:text-purple-300 transition-colors">Editar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
