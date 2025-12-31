import { X, AlertCircle, Lock, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function BookingModal({ room, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    nama: "",
    whatsapp: "",
    tanggal: "",
    jam: "",
  });

  const [warning, setWarning] = useState("");

  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "20:00", "21:00", "22:00"];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const closeModal = () => {
    document.body.style.overflow = "auto";
    onClose();
  };

  if (!isOpen) return null;

  const handleJamClick = (jam) => {
    const slotTerambil = room.bookedSlots?.find(
      (s) =>
        s.date === formData.tanggal &&
        s.time === jam &&
        (s.status === "pending" || s.status === "booked")
    );

    if (slotTerambil) {
      setWarning(
        slotTerambil.status === "booked"
          ? "🔒 Jam ini sudah dikonfirmasi & di-lock orang lain!"
          : "⏳ Jam ini sedang diproses orang lain (pending)."
      );
      return;
    }

    setFormData({ ...formData, jam });
    setWarning("");
  };

  const handleWhatsapp = async () => {
    if (!formData.nama || !formData.whatsapp || !formData.tanggal || !formData.jam) {
      setWarning("⚠️ Mohon lengkapi semua data!");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    if (formData.tanggal === today && now.getHours() >= 12) {
      setWarning("❌ Booking hari ini hanya sampai pukul 12:00 siang.");
      return;
    }

    // Double check lagi sebelum insert (perlindungan terakhir)
    const slotTerambil = room.bookedSlots?.find(
      (s) =>
        s.date === formData.tanggal &&
        s.time === formData.jam &&
        (s.status === "pending" || s.status === "booked")
    );

    if (slotTerambil) {
      setWarning("Maaf, slot ini baru saja diambil orang lain. Silakan pilih jam lain.");
      return;
    }

    try {
      const { error } = await supabase.from("bookings").insert({
        nama: formData.nama.trim(),
        whatsapp: formData.whatsapp.trim(),
        tanggal: formData.tanggal,
        jam: formData.jam,
        status: "pending",
        room_id: parseInt(room.id),
      });

      if (error) {
        // Jika error unique violation (double booking)
        if (error.code === "23505") {
          setWarning("❌ Maaf, slot ini baru saja diambil orang lain! Silakan refresh halaman dan pilih jam lain.");
          // Optional: trigger refresh global kalau kamu punya prop refresh
        } else {
          setWarning("Gagal booking: " + error.message);
        }
        return;
      }

      // Sukses booking
      const pesan = `*BOOKING BARU*\nStudio: ${room.name}\nNama: ${formData.nama}\nWA: ${formData.whatsapp}\nTanggal: ${formData.tanggal}\nJam: ${formData.jam}\n\nSegera konfirmasi DP ya! 🎸`;
      window.open(`https://wa.me/6285886933826?text=${encodeURIComponent(pesan)}`, "_blank");
      closeModal();
    } catch (err) {
      setWarning("Gagal booking. Coba lagi dalam beberapa detik.");
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal}></div>

      <div className="relative z-10 bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="relative h-24 w-full flex-shrink-0">
          <img src={room.image} className="w-full h-full object-cover opacity-30" alt={room.name} />
          <button onClick={closeModal} className="absolute top-4 right-4 text-white/60 hover:text-white">
            <X size={24} />
          </button>
          <div className="absolute bottom-3 left-6">
            <h2 className="text-2xl font-bold text-white">{room.name}</h2>
            <p className="text-sm text-zinc-400">Rp {room.price} / sesi</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <input
            type="text"
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            placeholder="Nama Band / Penyanyi"
            className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white focus:border-red-500 transition"
          />

          <input
            type="tel"
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            placeholder="Nomor WhatsApp"
            className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white focus:border-red-500 transition"
          />

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase">Tanggal</label>
            <input
              type="date"
              value={formData.tanggal}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => {
                setFormData({ ...formData, tanggal: e.target.value, jam: "" });
                setWarning("");
              }}
              className="mt-2 w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white focus:border-red-500 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase">Pilih Jam</label>
            <div className="grid grid-cols-4 gap-3 mt-3">
              {timeSlots.map((jam) => {
                const slot = room.bookedSlots?.find(
                  (s) => s.date === formData.tanggal && s.time === jam
                );

                const isTaken = slot?.status === "pending" || slot?.status === "booked";
                const isSelected = formData.jam === jam && !isTaken;

                return (
                  <button
                    key={jam}
                    type="button"
                    disabled={isTaken || !formData.tanggal}
                    onClick={() => handleJamClick(jam)}
                    className={`relative py-4 rounded-xl font-bold border-2 transition-all flex flex-col items-center justify-center
                      ${isTaken
                        ? slot?.status === "booked"
                          ? "bg-red-900/40 border-red-700 text-red-300 cursor-not-allowed"
                          : "bg-yellow-900/40 border-yellow-700 text-yellow-300 cursor-not-allowed animate-pulse"
                        : isSelected
                        ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/50"
                        : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-red-500 hover:text-white"
                      }`}
                  >
                    <span className="text-base">{jam}</span>
                    {slot?.status === "pending" && (
                      <div className="flex items-center gap-1 mt-1 text-xs">
                        <Clock size={14} />
                        <span>Pending</span>
                      </div>
                    )}
                    {slot?.status === "booked" && (
                      <div className="flex items-center gap-1 mt-1 text-xs">
                        <Lock size={14} />
                        <span>Booked</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {warning && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400 text-sm animate-pulse">
              <AlertCircle size={18} />
              <span>{warning}</span>
            </div>
          )}

          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl text-center">
            <p className="text-xs text-zinc-500 uppercase">Transfer DP 50% ke</p>
            <p className="font-mono text-lg font-bold text-white mt-1">BCA 123-456-7890 a.n. Wangsa Studio</p>
          </div>

          {/* Tombol Konfirmasi disabled kalau slot sudah diambil */}
          <button
            onClick={handleWhatsapp}
            disabled={
              !formData.nama ||
              !formData.whatsapp ||
              !formData.tanggal ||
              !formData.jam ||
              room.bookedSlots?.some(
                (s) =>
                  s.date === formData.tanggal &&
                  s.time === formData.jam &&
                  (s.status === "pending" || s.status === "booked")
              )
            }
            className="w-full py-5 rounded-2xl font-bold text-lg transition-all bg-red-600 hover:bg-red-500 text-white shadow-lg disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
          >
            Konfirmasi & Lock Jadwal via WA
          </button>
        </div>
      </div>
    </div>
  );
}