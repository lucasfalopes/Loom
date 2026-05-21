"use client";

import { useEffect, useState } from "react";
import { Plus, X, Check, Edit2, Trash2, CheckCircle2 } from "lucide-react";

interface ClothingItem {
  id: number;
  image: string;
  category: string;
  category_display: string;
}

interface Outfit {
  id: number;
  weather: string;
  occasion: string;
  weather_display: string;
  occasion_display: string;
  items_detail: ClothingItem[];
  creator_name: string;
  last_used_date: string | null;
}

const WEATHERS = [
  { id: "ALL", label: "Todos" },
  { id: "HOT", label: "Calor" },
  { id: "COLD", label: "Frio" },
  { id: "WINTER", label: "Inverno" },
];

const OCCASIONS = [
  { id: "ALL", label: "Todas" },
  { id: "DAILY", label: "Dia a dia" },
  { id: "NIGHT", label: "Noturno" },
];

const CATEGORIES = [
  { id: "ALL", label: "Todos" },
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

const CATEGORY_PRIORITY: Record<string, number> = {
  "COAT": 1,
  "JACKET": 2,
  "SWEATER": 3,
  "SHIRT": 4,
  "REGULAR_SHIRT": 5,
  "POLO": 6,
  "T_SHIRT": 7,
  "PANTS": 8,
  "SHORTS": 9,
  "SHOES": 10,
  "ACCESSORY": 11,
};

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [closetItems, setClosetItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOutfitDetail, setSelectedOutfitDetail] = useState<Outfit | null>(null);
  const [viewImage, setViewImage] = useState<string | null>(null);
  
  // Matrix Filters
  const [selectedWeather, setSelectedWeather] = useState("ALL");
  const [selectedOccasion, setSelectedOccasion] = useState("ALL");

  // Form State
  const [editingOutfitId, setEditingOutfitId] = useState<number | null>(null);
  const [newWeather, setNewWeather] = useState("HOT");
  const [newOccasion, setNewOccasion] = useState("DAILY");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [createFilterCategory, setCreateFilterCategory] = useState("ALL");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const [outfitsRes, itemsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || \"http://localhost:8000\"}/api/outfits/`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || \"http://localhost:8000\"}/api/clothing-items/`, { headers })
      ]);

      if (outfitsRes.ok && itemsRes.ok) {
        setOutfits(await outfitsRes.json());
        setClosetItems(await itemsRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const sortItems = (items: ClothingItem[]) => {
    return [...items].sort((a, b) => (CATEGORY_PRIORITY[a.category] || 99) - (CATEGORY_PRIORITY[b.category] || 99));
  };

  const handleSaveOutfit = async () => {
    if (selectedItems.length === 0) return alert("Selecione pelo menos uma peça!");
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      
      const url = editingOutfitId 
        ? `${process.env.NEXT_PUBLIC_API_URL || \"http://localhost:8000\"}/api/outfits/${editingOutfitId}/`
        : `${process.env.NEXT_PUBLIC_API_URL || \"http://localhost:8000\"}/api/outfits/`;
        
      const method = editingOutfitId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          weather: newWeather,
          occasion: newOccasion,
          items: selectedItems
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingOutfitId(null);
        setSelectedItems([]);
        fetchData();
      } else {
        const errorText = await res.text();
        console.error("Backend Error Response:", errorText);
        alert(`Erro ao salvar: ${errorText}`);
      }
    } catch (error) {
      console.error("Error saving outfit", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOutfit = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar esse look?")) return;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || \"http://localhost:8000\"}/api/outfits/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedOutfitDetail(null);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openCreateModal = () => {
    setEditingOutfitId(null);
    setNewWeather(selectedWeather === "ALL" ? "HOT" : selectedWeather);
    setNewOccasion(selectedOccasion === "ALL" ? "DAILY" : selectedOccasion);
    setSelectedItems([]);
    setIsModalOpen(true);
  };

  const openEditModal = (outfit: Outfit) => {
    setSelectedOutfitDetail(null); // Close detail modal
    setEditingOutfitId(outfit.id);
    setNewWeather(outfit.weather);
    setNewOccasion(outfit.occasion);
    setSelectedItems(outfit.items_detail.map(i => i.id));
    setIsModalOpen(true);
  };

  const toggleItemSelection = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const getImageUrl = (path: string) => path.startsWith("http") ? path : `${process.env.NEXT_PUBLIC_API_URL || \"http://localhost:8000\"}${path}`;

  const markAsUsed = async (outfitId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || \"http://localhost:8000\"}/api/outfits/${outfitId}/wear/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, last_used_date: data.last_used_date } : o));
        if (selectedOutfitDetail?.id === outfitId) {
          setSelectedOutfitDetail(prev => prev ? { ...prev, last_used_date: data.last_used_date } : null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isRecentlyUsed = (dateString: string | null | undefined) => {
    if (!dateString) return false;
    const lastUsed = new Date(dateString);
    const diffDays = Math.floor((new Date().getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays < 8;
  };

  const formatUsedDate = (dateString: string) => {
    const date = new Date(dateString);
    return `Usada no dia ${date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}, ${date.toLocaleDateString('pt-BR', { weekday: 'long' })}`;
  };

  const filteredOutfits = outfits.filter(o => 
    (selectedWeather === "ALL" || o.weather === selectedWeather) && 
    (selectedOccasion === "ALL" || o.occasion === selectedOccasion)
  );

  const filteredClosetItems = createFilterCategory === "ALL" 
    ? closetItems 
    : closetItems.filter(item => item.category === createFilterCategory);

  return (
    <div className="space-y-8 relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Combinações</h1>
          <p className="text-gray-400">Monte e visualize seus looks ideais.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-purple-500/25 hover:scale-105 transition-all"
        >
          <Plus size={20} />
          <span>Criar Look</span>
        </button>
      </header>

      {/* Matrix Filters */}
      <div className="glass-card rounded-2xl p-6 space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Clima</label>
          <div className="flex flex-wrap gap-2">
            {WEATHERS.map(w => (
              <button
                key={w.id}
                onClick={() => setSelectedWeather(w.id)}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all ${selectedWeather === w.id ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Ocasião</label>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map(o => (
              <button
                key={o.id}
                onClick={() => setSelectedOccasion(o.id)}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all ${selectedOccasion === o.id ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Outfits Display */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredOutfits.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-2xl border-dashed border-2 border-white/10">
          <p className="text-gray-400 text-lg">Nenhum look salvo para esta combinação.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOutfits.map(outfit => (
            <div 
              key={outfit.id} 
              onClick={() => setSelectedOutfitDetail(outfit)}
              className="glass-card rounded-2xl p-5 space-y-4 cursor-pointer hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20 group"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-xs font-medium bg-white/10 text-purple-300 px-3 py-1 rounded-full group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  Criado por {outfit.creator_name}
                </span>
                <span className="text-gray-400 group-hover:text-purple-400 transition-colors">Ver Detalhes</span>
              </div>
              <div className="flex flex-wrap gap-3 items-center items-start">
                {sortItems(outfit.items_detail).map((item, index, arr) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-16 rounded-xl overflow-hidden shadow-md relative glass-card border border-white/10">
                      <img src={getImageUrl(item.image)} alt={item.category_display} className="w-full h-auto block" />
                    </div>
                    {index < arr.length - 1 && (
                      <span className="text-purple-400 font-bold opacity-50">+</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Outfit Detail Modal */}
      {selectedOutfitDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-card rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div>
                <h2 className="text-2xl font-bold text-white">Detalhes do Look</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {selectedOutfitDetail.weather_display} • {selectedOutfitDetail.occasion_display} | Criado por {selectedOutfitDetail.creator_name}
                </p>
              </div>
              <button onClick={() => setSelectedOutfitDetail(null)} className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1">
              <div className="flex flex-wrap items-center justify-center gap-6 items-start">
                {sortItems(selectedOutfitDetail.items_detail).map((item, index, arr) => (
                  <div key={item.id} className="flex items-center gap-6">
                    <div className="flex flex-col items-center space-y-4">
                      <div 
                        className="w-40 md:w-56 rounded-2xl overflow-hidden shadow-2xl relative glass-card border border-white/10 hover:border-purple-500 transition-colors cursor-pointer"
                        onClick={() => setViewImage(getImageUrl(item.image))}
                      >
                        <img src={getImageUrl(item.image)} alt={item.category_display} className="w-full h-auto block" />
                      </div>
                      <span className="bg-black/50 px-4 py-1 rounded-full text-purple-300 text-sm font-medium border border-purple-500/30">
                        {item.category_display}
                      </span>
                    </div>
                    {index < arr.length - 1 && (
                      <div className="text-purple-500 font-bold text-4xl opacity-50">
                        <Plus size={40} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <button 
                onClick={() => handleDeleteOutfit(selectedOutfitDetail.id)}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 font-medium px-4 py-2 hover:bg-red-400/10 rounded-xl transition-all"
              >
                <Trash2 size={18} />
                Deletar
              </button>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => openEditModal(selectedOutfitDetail)}
                  className="flex items-center gap-2 bg-white/10 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-white/20 transition-all border border-white/10"
                >
                  <Edit2 size={18} />
                  Editar
                </button>
                
                {isRecentlyUsed(selectedOutfitDetail.last_used_date) ? (
                  <span className="flex items-center gap-2 bg-green-500/20 text-green-400 px-6 py-2.5 rounded-xl font-medium border border-green-500/30">
                    <CheckCircle2 size={18} />
                    {formatUsedDate(selectedOutfitDetail.last_used_date!)}
                  </span>
                ) : (
                  <button 
                    onClick={() => markAsUsed(selectedOutfitDetail.id)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-purple-600/30 transition-all"
                  >
                    <CheckCircle2 size={18} />
                    Usei!
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form (Create/Edit) Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-2xl font-bold text-white">
                {editingOutfitId ? "Editar Look" : "Criar Novo Look"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Clima</label>
                  <select 
                    value={newWeather} 
                    onChange={e => setNewWeather(e.target.value)}
                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 outline-none appearance-none"
                  >
                    {WEATHERS.filter(w => w.id !== "ALL").map(w => <option key={w.id} value={w.id} className="bg-gray-900">{w.label}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Ocasião</label>
                  <select 
                    value={newOccasion} 
                    onChange={e => setNewOccasion(e.target.value)}
                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 outline-none appearance-none"
                  >
                    {OCCASIONS.filter(o => o.id !== "ALL").map(o => <option key={o.id} value={o.id} className="bg-gray-900">{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <label className="text-sm font-medium text-gray-300">Selecione as Peças (Closet)</label>
                  <div className="flex items-center gap-3">
                    <select 
                      value={createFilterCategory} 
                      onChange={e => setCreateFilterCategory(e.target.value)}
                      className="p-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none appearance-none min-w-[150px]"
                    >
                      {CATEGORIES.map(c => <option key={c.id} value={c.id} className="bg-gray-900">{c.label}</option>)}
                    </select>
                    <button 
                      onClick={() => setCreateFilterCategory("ALL")}
                      className="px-3 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all font-medium text-sm whitespace-nowrap"
                    >
                      Resetar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 items-start">
                  {sortItems(filteredClosetItems).map(item => {
                    const isSelected = selectedItems.includes(item.id);
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => toggleItemSelection(item.id)}
                        className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all glass-card ${isSelected ? 'border-purple-500 scale-95 shadow-lg shadow-purple-500/50' : 'border-white/10 hover:border-white/30'}`}
                      >
                        <img src={getImageUrl(item.image)} alt="Roupa" className="w-full h-auto block" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center">
                            <div className="bg-purple-600 rounded-full p-1 shadow-lg">
                              <Check size={20} className="text-white" />
                            </div>
                          </div>
                        )}
                        {/* Display Category Tooltip in a bubble */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[90%] flex justify-center">
                          <span className="bg-black/70 px-3 py-1 rounded-full text-purple-300 text-[10px] font-medium border border-purple-500/30 whitespace-nowrap backdrop-blur-md overflow-hidden text-ellipsis">
                            {item.category_display}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveOutfit}
                disabled={isSaving || selectedItems.length === 0}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSaving ? "Salvando..." : (editingOutfitId ? "Salvar Alterações" : "Salvar Look")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {viewImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 cursor-pointer animate-in fade-in"
          onClick={() => setViewImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-white/10 p-2 rounded-full transition-all hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); setViewImage(null); }}
          >
            <X size={24} />
          </button>
          <img src={viewImage} alt="Ampliada" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}
