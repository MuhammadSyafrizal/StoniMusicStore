import { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Data gallery dengan tambahan roomId
const GALLERY_DATA = [
  {
    id: 1,
    name: "Marshall JCM800",
    image: "/src/assets/FrontStudio.webp", // Pastikan path benar di public folder atau gunakan import
    roomId: 1, // Room utama
  },
  {
    id: 2,
    name: "Fender Twin Reverb",
    image: "/src/assets/RuangSolat.webp",
    roomId: 1,
  },
  {
    id: 3,
    name: "Pearl Export Series",
    image: "/src/assets/Studio.webp",
    roomId: 1,
  },
  {
    id: 4,
    name: "Neumann U87",
    image: "/src/assets/Studio2.webp",
    roomId: 1,
  },
  // Tambahkan lebih banyak jika ada room lain, misal:
  // { id: 5, name: "Yamaha Grand Piano", image: "...", roomId: 2 },
];

export default function EquipmentPage({ rooms = [] }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const navigate = useNavigate();

  // Tentukan room utama untuk CTA besar (fallback ke room pertama atau ID 1)
  const mainRoom = rooms.find((r) => r.id === 1) || rooms[0];

  const handleItemClick = (item) => {
    const room = rooms.find((r) => r.id === item.roomId);
    if (room) {
      navigate(`/booking/${item.roomId}`, { state: { room } });
    } else {
      // Jika room belum di-load, tetap navigate (BookingPage akan fetch dari params)
      navigate(`/booking/${item.roomId}`);
    }
    setSelectedItem(null); // Tutup modal jika terbuka
  };

  const handleBookNow = () => {
    if (mainRoom) {
      navigate(`/booking/${mainRoom.id}`, { state: { room: mainRoom } });
    } else {
      navigate("/booking/1"); // Fallback jika rooms belum loaded
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-20 px-6 sm:px-12 font-sans">
      {/* MODAL DETAIL */}
      {selectedItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md">
          <div
            className="absolute inset-0"
            onClick={() => setSelectedItem(null)}
          />

          <div className="relative max-w-4xl w-full bg-zinc-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-10 p-3 bg-black/60 hover:bg-red-600 rounded-full text-white transition-all backdrop-blur-sm border border-white/20"
            >
              <X size={24} />
            </button>

            <div className="w-full h-[400px] sm:h-[500px] md:h-[600px]">
              <img
                src={selectedItem.image}
                alt={selectedItem.name}
                className="w-full h-full object-contain bg-black"
              />
            </div>

            <div className="p-6 md:p-8 bg-gradient-to-t from-zinc-950 to-transparent text-center">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
                {selectedItem.name}
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-16 text-center md:text-left">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic mb-6">
          Stoni <span className="text-red-600">Music Store.</span>
        </h1>
        <p className="text-zinc-500 max-w-2xl mx-auto md:mx-0 text-lg leading-relaxed">
          Koleksi instrumen premium dengan standar recording profesional.
        </p>
      </div>

      {/* BENTO GRID GALLERY */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[320px]">
        {GALLERY_DATA.map((item, index) => {
          const size =
            index === 0
              ? "large"
              : index === 1
              ? "wide"
              : index === 4
              ? "large"
              : "standard";

          return (
            <button
              key={item.id}
              onClick={() => {
                setSelectedItem(item); // Buka modal dulu
                // handleItemClick(item); // Jika ingin langsung ke booking, uncomment ini & hapus setSelectedItem
              }}
              className={`
                group relative overflow-hidden rounded-2xl bg-black border border-white/10
                cursor-pointer transition-all duration-500
                hover:border-red-600/60 hover:shadow-2xl hover:shadow-red-600/30
                focus:outline-none focus:border-red-600
                ${size === "large" ? "md:col-span-2 md:row-span-2" : 
                  size === "wide" ? "md:col-span-2" : ""}
              `}
            >
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="space-y-3">
                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-tight">
                    {item.name}
                  </h3>
                  <p className="text-zinc-300 text-sm opacity-80 flex items-center gap-2 mt-4">
                    Lihat Detail <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* CTA BUTTON BESAR */}
      <div className="mt-24 text-center">
        <button
          onClick={handleBookNow}
          className="inline-flex items-center gap-5 px-12 py-6 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-base hover:bg-white hover:text-black transition-all duration-300 shadow-2xl shadow-red-600/30 hover:shadow-red-600/50 transform hover:scale-105"
        >
          Sewa Studio Sekarang
          <ChevronRight size={24} className="transition-transform group-hover:translate-x-2" />
        </button>
      </div>

      {/* OPTIONAL: Tombol langsung booking di modal */}
      {selectedItem && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[160]">
          <button
            onClick={() => handleItemClick(selectedItem)}
            className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-full font-bold uppercase tracking-wide shadow-2xl"
          >
            Booking dengan {selectedItem.name}
          </button>
        </div>
      )}
    </div>
  );
}