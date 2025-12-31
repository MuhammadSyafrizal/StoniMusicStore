import { X, Calendar, Clock, User, Phone, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function BookingModal({ room, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    nama: "",
    whatsapp: "",
    tanggal: "",
    jam: "",
  });

  // State untuk menyimpan pesan peringatan
  const [warning, setWarning] = useState("");

  if (!isOpen) return null;

  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "20:00", "21:00", "22:00"];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setWarning("");
  };

  const isDateFull = (date) => {
    if (!date || !room.bookedSlots) return false

    const slotsOnDate = room.bookedSlots.filter(s => s.date === date && (s.status === 'booked' || s.status === 'used'))

    return slotsOnDate.length >= timeSlots.length
  }

  const dateStatus = isDateFull(formData.tanggal)

  
  const checkStatus = (date, time) => {
    if (!room.bookedSlots) return null;
    const slot = room.bookedSlots.find((s) => s.date === date && s.time === time);
    return slot ? slot.status : null;
  };

  
  const currentStatus = checkStatus(formData.tanggal, formData.jam);
  const isBlocked = currentStatus === "booked" || currentStatus === "used";

  const handleWhatsapp = () => {
    if (!formData.nama || !formData.whatsapp || !formData.tanggal || !formData.jam) {
      setWarning("⚠️ Mohon lengkapi semua data dan pilih jam!");
      return;
    }

    if (isBlocked) {
      setWarning("❌ Jadwal ini sudah di-lock oleh admin. Silakan pilih jam/tanggal lain.");
      return;
    }

    const nomorAdmin = "6285886933826";
    const pesan = `*NOTIFIKASI BOOKING & LOCK JADWAL*
------------------------------------
Halo Admin Wangsa Studio, saya ingin konfirmasi DP untuk LOCK jadwal:

*Ruangan:* ${room.name}
*Atas Nama:* ${formData.nama}
*Tanggal:* ${formData.tanggal}
*Jam:* ${formData.jam}
*Status:* 🔒 Menunggu Bukti Transfer`;

    const url = `https://wa.me/${nomorAdmin}?text=${encodeURIComponent(pesan)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative z-10 bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
        <div className="relative h-24 w-full">
          <img src={room.image} className="w-full h-full object-cover opacity-30" alt="" />
          <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={20} /></button>
          <div className="absolute bottom-2 left-6">
            <h2 className="text-xl font-bold text-white">{room.name}</h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">

            <input type="text" name="nama" onChange={handleChange} placeholder="Nama Band / Penyanyi" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-red-500" />
            <input type="tel" name="whatsapp" onChange={handleChange} placeholder="Nomor WhatsApp" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-red-500" />
            <label className="text-xs font-bold text-zinc-500 uppercase">Pilih Tanggal</label>
            <input 
              type="date" 
              name="tanggal"
              value={formData.tanggal}
              onChange={handleChange} 
              className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-red-500"
              required
            />
            
            {dateStatus && (
              <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                 <AlertCircle size={12} /> Maaf, semua jadwal di tanggal ini sudah penuh
              </p>
            )

            
              
            }
          </div>          

          <label className="text-xs font-bold text-zinc-500 uppercase">Pilih Jam</label>
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map((time) => {
              const status = checkStatus(formData.tanggal, time);
              const isLocked = status === "booked";
              const isUsed = status === "used";
              const isSelected = formData.jam === time;

              return (
                <button
                  key={time}
                  type="button"
                  disabled={isLocked || isUsed}
                  onClick={() => {
                    setFormData({ ...formData, jam: time });
                    setWarning("");
                  }}
                  className={`relative py-3 rounded-xl text-[10px] font-bold border transition-all
                    ${isUsed ? "bg-zinc-800 border-zinc-700 text-zinc-600 cursor-not-allowed" : 
                      isLocked ? "bg-red-950/20 border-red-900 text-red-600 cursor-not-allowed" : 
                      isSelected ? "bg-red-600 border-red-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-red-500"}
                  `}
                >
                  {time}
                </button>
              );
            })}
          </div>

          {/* TAMPILAN PERINGATAN (WARNING MESSAGE) */}
          {warning && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/50 p-3 rounded-xl text-red-500 text-xs animate-pulse">
              <AlertCircle size={16} />
              <span>{warning}</span>
            </div>
          )}

          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-center">
            <p className="text-[10px] text-zinc-500 uppercase">Transfer DP ke BCA</p>
            <p className="font-mono font-bold text-white">123-456-7890</p>
          </div>

          <button 
            onClick={handleWhatsapp} 
            className={`w-full py-4 rounded-2xl font-bold transition-all
              ${isBlocked || !formData.jam || !formData.nama
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20"
              }`}
          >
            {isBlocked ? "Jadwal Sudah Terisi" : "Konfirmasi & Lock Jadwal"}
          </button>
        </div>
      </div>
    </div>
  );
}