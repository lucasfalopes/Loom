"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ClothingItem {
  id: number;
  image: string;
  category: string;
  category_display: string;
  date_added: string;
}

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

const ImageLoader = ({ src, alt }: { src: string; alt: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative w-full ${!isLoaded ? 'min-h-[250px] bg-white/5 animate-pulse' : ''}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-auto block transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

export default function ClosetPage() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [viewImage, setViewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/clothing-items/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch clothing items", error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path: string) => path.startsWith("http") ? path : `http://localhost:8000${path}`;

  const filteredItems = activeFilter === "ALL"
    ? items
    : items.filter(item => item.category === activeFilter);

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">O Closet: By Lucas Lopes</h1>
        <p className="text-gray-400">Explore e filtre suas roupas por categoria.</p>
      </header>

      {/* Filter Tags */}
      <div className="flex overflow-x-auto pb-4 space-x-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveFilter(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === cat.id
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-2xl">
          <p className="text-gray-400 text-lg">Nenhuma peça encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-2xl overflow-hidden group hover:-translate-y-1 transition-transform duration-300 relative border border-white/10 shadow-lg cursor-pointer bg-white/5"
              onClick={() => setViewImage(getImageUrl(item.image))}
            >
              <ImageLoader src={getImageUrl(item.image)} alt={item.category_display} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <span className="text-white font-medium text-sm">
                  {item.category_display}
                </span>
              </div>
            </div>
          ))}
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
