"use client";

import { useEffect, useState } from "react";
import { Shirt, Layers, Thermometer, Clock, Sparkles, CheckCircle2 } from "lucide-react";

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
  items_detail: ClothingItem[];
  last_used_date: string | null;
}

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temperature, setTemperature] = useState<number | null>(null);
  const [clothesCount, setClothesCount] = useState(0);
  const [outfitsCount, setOutfitsCount] = useState(0);
  const [recommendations, setRecommendations] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [usedOutfits, setUsedOutfits] = useState<Set<number>>(new Set());

  const getImageUrl = (path: string) => path.startsWith("http") ? path : `http://localhost:8000${path}`;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update time every minute
    
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Weather (Rio de Janeiro)
        let currentTemp = 25; // fallback
        try {
          const weatherRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=-22.9064&longitude=-43.1822&current_weather=true");
          if (weatherRes.ok) {
            const weatherData = await weatherRes.json();
            currentTemp = weatherData.current_weather.temperature;
            setTemperature(currentTemp);
          }
        } catch (e) {
          console.error("Erro ao buscar clima:", e);
        }

        // Fetch Clothes Count
        const clothesRes = await fetch("http://localhost:8000/api/clothing-items/", { headers });
        if (clothesRes.ok) {
          const clothes = await clothesRes.json();
          setClothesCount(clothes.length);
        }

        // Fetch Outfits
        const outfitsRes = await fetch("http://localhost:8000/api/outfits/", { headers });
        if (outfitsRes.ok) {
          const outfits: Outfit[] = await outfitsRes.json();
          setOutfitsCount(outfits.length);

          // Calculate current parameters
          const hour = new Date().getHours();
          const targetOccasion = hour < 18 ? "DAILY" : "NIGHT";
          
          let targetWeather = "HOT";
          if (currentTemp < 10) targetWeather = "WINTER";
          else if (currentTemp < 21) targetWeather = "COLD";

          // Filter eligible outfits
          const eligibleOutfits = outfits.filter(outfit => {
            if (outfit.weather !== targetWeather || outfit.occasion !== targetOccasion) return false;
            
            if (outfit.last_used_date) {
              const lastUsed = new Date(outfit.last_used_date);
              const now = new Date();
              const diffDays = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays < 8) return false; // Used recently
            }
            return true;
          });

          // Shuffle and pick 3
          const shuffled = eligibleOutfits.sort(() => 0.5 - Math.random());
          setRecommendations(shuffled.slice(0, 3));
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    // Periodically update data every 15 minutes
    const dataTimer = setInterval(() => fetchDashboardData(), 15 * 60 * 1000);

    fetchDashboardData();
    return () => {
      clearInterval(timer);
      clearInterval(dataTimer);
    };
  }, []);

  const markAsUsed = async (outfitId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/outfits/${outfitId}/wear/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsedOutfits(prev => new Set(prev).add(outfitId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const CATEGORY_PRIORITY: Record<string, number> = {
    "COAT": 1, "JACKET": 2, "SWEATER": 3, "SHIRT": 4, "REGULAR_SHIRT": 5,
    "POLO": 6, "T_SHIRT": 7, "PANTS": 8, "SHORTS": 9, "SHOES": 10, "ACCESSORY": 11,
  };
  const sortItems = (items: ClothingItem[]) => [...items].sort((a, b) => (CATEGORY_PRIORITY[a.category] || 99) - (CATEGORY_PRIORITY[b.category] || 99));

  if (loading) return <div className="text-center text-white py-20">Carregando Dashboard...</div>;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-8 bg-gradient-to-br from-purple-900/40 to-blue-900/20 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {currentTime.getHours() >= 18 ? "Boa Noite" : currentTime.getHours() >= 12 ? "Boa Tarde" : "Bom Dia"}!
            </h1>
            <p className="text-purple-200 text-lg">Aqui está o resumo do seu Armário Virtual.</p>
          </div>
          
          <div className="flex items-center gap-6 bg-black/30 p-4 rounded-2xl backdrop-blur-md border border-white/5">
            <div className="flex items-center gap-3">
              <Clock className="text-blue-400" size={28} />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white leading-none">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Hoje</span>
              </div>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div className="flex items-center gap-3">
              <Thermometer className="text-red-400" size={28} />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white leading-none">
                  {temperature ? `${temperature}°C` : "--°C"}
                </span>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Rio de Janeiro</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6 flex items-center gap-6 border border-white/5 hover:border-purple-500/30 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
            <Shirt className="text-purple-400" size={32} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">Roupas no Armário</p>
            <p className="text-3xl font-bold text-white">{clothesCount}</p>
          </div>
        </div>
        
        <div className="glass-card rounded-2xl p-6 flex items-center gap-6 border border-white/5 hover:border-blue-500/30 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <Layers className="text-blue-400" size={32} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">Combinações Criadas</p>
            <p className="text-3xl font-bold text-white">{outfitsCount}</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="text-yellow-400" />
          <h2 className="text-2xl font-bold text-white">Recomendações do Momento</h2>
        </div>
        
        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {recommendations.map(outfit => {
              const isUsed = usedOutfits.has(outfit.id);
              return (
                <div key={outfit.id} className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex flex-wrap items-center justify-center gap-3 items-start min-h-[120px] mb-6">
                    {sortItems(outfit.items_detail).map((item, idx, arr) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-20 rounded-xl overflow-hidden shadow-lg border border-white/10 bg-black/20">
                          <img src={getImageUrl(item.image)} alt="Roupa" className="w-full h-auto block" />
                        </div>
                        {idx < arr.length - 1 && <span className="text-purple-500 font-bold opacity-50">+</span>}
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => !isUsed && markAsUsed(outfit.id)}
                    disabled={isUsed}
                    className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      isUsed 
                      ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-not-allowed" 
                      : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30"
                    }`}
                  >
                    {isUsed ? (
                      <>
                        <CheckCircle2 size={20} />
                        Look Registrado!
                      </>
                    ) : (
                      "Vou usar esse!"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 text-center border border-white/5">
            <p className="text-gray-400">Nenhuma recomendação disponível para o clima/horário atual que não tenha sido usada recentemente.</p>
          </div>
        )}
      </div>
    </div>
  );
}
