import { CheckCircle2 } from "lucide-react"; // Import ikon gembok/centang

export default function RoomCard({ name, price, image, description, features }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden hover:border-red-500 transition-all group cursor-pointer">
      {/* Area Gambar */}
      <div className="relative h-48 overflow-hidden">
        <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full">
          <p className="text-red-500 text-xs font-bold">Rp {price} / jam</p>
        </div>
      </div>

      {/* Area Informasi */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
          {description || "Klik untuk melihat detail fasilitas dan jadwal tersedia."}
        </p>

        {/* Daftar Fitur/Fasilitas Kecil */}
        <div className="space-y-2 mb-6">
          {features && features.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-[11px] text-zinc-500 uppercase tracking-wider">
              <CheckCircle2 size={14} className="text-red-600" />
              {item}
            </div>
          ))}
        </div>

        <button className="w-full bg-zinc-900 group-hover:bg-red-600 text-white py-3 rounded-xl font-bold text-sm transition-colors">
          Lihat Detail & Booking
        </button>
      </div>
    </div>
  );
}