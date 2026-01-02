import { useState } from "react";
import { Mic, Guitar, Speaker, Disc, ChevronRight, X, ChevronLeft } from "lucide-react";
// Import Swiper components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const EQUIPMENT_DATA = [
  {
    id: 1,
    name: "Marshall JCM800",
    category: "Amps",
    brand: "Marshall",
    image: "src/assets/Amps.webp",
    // Tambahkan array gallery untuk foto yang bisa digeser
    gallery: ["src/assets/Amps.webp", "https://images.unsplash.com/photo-1615651930225-fa30c5000965?q=80&w=2070"],
    desc: "Legendary high-gain amplifier for that iconic rock sound."
  },
  {
    id: 3,
    name: "Pearl Export Series",
    category: "Drums",
    brand: "Pearl",
    image: "/src/assets/DrumEquipment.webp",
    gallery: [
      "/src/assets/DrumEquipment.webp",
      "https://images.unsplash.com/photo-1543443258-92b04ad5ecf5?q=80&w=2070",
      "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?q=80&w=2070"
    ],
    desc: "High-quality shells for punchy and clear percussion."
  },
  // Data lainnya...
];

const CATEGORIES = ["All", "Amps", "Microphones", "Drums", "Guitars"];

export default function EquipmentPage() {
  const [filter, setFilter] = useState("All");
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredData = EQUIPMENT_DATA.filter(item => 
    filter === "All" ? true : item.category === filter
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-20 px-6 sm:px-12 font-sans">
      
      {/* MODAL DETAIL SLIDER */}
      {selectedItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setSelectedItem(null)}></div>
          
          <div className="relative w-full max-w-6xl bg-zinc-950 rounded-xl overflow-hidden border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-5 right-5 z-[160] p-2 bg-black/50 hover:bg-red-600 rounded-lg text-white transition-all border border-white/10"
            >
              <X size={24} />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Slider Section */}
              <div className="h-[350px] md:h-[500px] lg:h-[600px] bg-zinc-900">
                <Swiper
                  modules={[Navigation, Pagination, Keyboard]}
                  navigation
                  pagination={{ clickable: true }}
                  keyboard={{ enabled: true }}
                  className="h-full w-full"
                >
                  {selectedItem.gallery?.map((img, idx) => (
                    <SwiperSlide key={idx}>
                      <img src={img} className="w-full h-full object-cover" alt={`Detail ${idx}`} />
                    </SwiperSlide>
                  )) || (
                    <SwiperSlide>
                      <img src={selectedItem.image} className="w-full h-full object-cover" alt="Main" />
                    </SwiperSlide>
                  )}
                </Swiper>
              </div>

              {/* Info Section */}
              <div className="p-8 md:p-12 flex flex-col justify-center border-l border-white/5">
                <div className="inline-block px-3 py-1 bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-widest mb-6 w-fit rounded">
                  {selectedItem.brand}
                </div>
                <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6">
                  {selectedItem.name}
                </h2>
                <div className="h-1 w-20 bg-red-600 mb-8"></div>
                <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                  {selectedItem.desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-[2px] w-12 bg-red-600"></div>
          <span className="text-red-500 font-black uppercase tracking-[0.4em] text-xs">Professional Gear</span>
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic mb-8">
          Stoni <span className="text-red-600">Music Equipment.</span>
        </h1>
        <p className="text-zinc-500 max-w-2xl text-lg">
          Koleksi instrumen pilihan dengan standar recording profesional.
        </p>
      </div>

      {/* FILTER TABS (Less Rounded) */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-wrap gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-6 py-2 rounded-md font-black text-[10px] uppercase tracking-widest transition-all border ${
              filter === cat 
              ? "bg-red-600 border-red-600 text-white" 
              : "bg-transparent border-white/10 text-zinc-500 hover:border-white/30"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* EQUIPMENT GRID (Less Rounded) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((item, index) => (
          <div 
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="group relative h-[450px] rounded-2xl overflow-hidden border border-white/5 bg-zinc-900 cursor-pointer animate-in fade-in duration-500"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-70 transition-opacity"></div>
            
            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <p className="text-red-500 font-black text-[10px] uppercase tracking-widest mb-1">{item.brand}</p>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">{item.name}</h3>
                <p className="text-zinc-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  View Detail <ChevronRight size={12} />
                </p>
              </div>
            </div>

            <div className="absolute top-6 left-6 p-3 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg">
              {item.category === "Amps" && <Speaker size={18} className="text-red-500" />}
              {item.category === "Microphones" && <Mic size={18} className="text-red-500" />}
              {item.category === "Drums" && <Disc size={18} className="text-red-500" />}
              {item.category === "Guitars" && <Guitar size={18} className="text-red-500" />}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 text-center">
        <button className="inline-flex items-center gap-4 px-10 py-5 bg-white text-black rounded-lg font-black uppercase tracking-widest text-sm hover:bg-red-600 hover:text-white transition-all group">
          Sewa Studio Sekarang
          <ChevronRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}