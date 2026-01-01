import { X, AlertCircle, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function BookingModal({ room, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    nama: "",
    whatsapp: "",
    tanggal: "",
    jamMulai: "",
  });

  const [warning, setWarning] = useState("");

  // SLOT 2 JAM YANG TERSEDIA (bisa diubah admin di masa depan lewat database)
  const timeSlotsMulai = ["10:00", "13:00", "16:00", "19:00", "22:00"];

  const DURASI_SEWA = 2; // 2 jam tetap

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

  // Hitung jam selesai
  const jamSelesai = formData.jamMulai
    ? `${(parseInt(formData.jamMulai.split(":")[0]) + DURASI_SEWA).toString().padStart(2, "0")}:00`
    : "";

  // Format jam untuk database: "16:00 - 18:00"
  const jamUntukDatabase = formData.jamMulai && jamSelesai ? `${formData.jamMulai} - ${jamSelesai}` : "";

  // Cek apakah blok 2 jam sudah ada yang taken
  const isBlockTaken = (jamMulai) => {
    if (!formData.tanggal || !jamMulai) return false;

    const startHour = parseInt(jamMulai.split(":")[0]);
    for (let h = 0; h < DURASI_SEWA; h++) {
      const jamCheck = `${(startHour + h).toString().padStart(2, "0")}:00`;
      const taken = room.bookedSlots?.some(
        (slot) =>
          slot.date === formData.tanggal &&
          slot.time === jamCheck &&
          (slot.status === "pending" || slot.status === "booked")
      );
      if (taken) return true;
    }
    return false;
  };

  const handleJamClick = (jam) => {
    if (isBlockTaken(jam)) {
      setWarning("Slot ini sudah dibooking orang lain. Silakan pilih slot lain yang tersedia.");
      return;
    }

    setFormData({ ...formData, jamMulai: jam });
    setWarning("");
  };

  const handleWhatsapp = async () => {
    if (!formData.nama || !formData.whatsapp || !formData.tanggal || !formData.jamMulai) {
      setWarning("⚠️ Mohon lengkapi semua data!");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    if (formData.tanggal === today && now.getHours() >= 12) {
      setWarning("❌ Booking hari ini hanya sampai pukul 12:00 siang.");
      return;
    }

    if (isBlockTaken(formData.jamMulai)) {
      setWarning("Maaf, slot ini baru saja dibooking orang lain. Silakan pilih slot lain.");
      return;
    }

    try {
      const { error } = await supabase.from("bookings").insert({
        nama: formData.nama.trim(),
        whatsapp: formData.whatsapp.trim(),
        tanggal: formData.tanggal,
        jam: jamUntukDatabase, // simpan sebagai "16:00 - 18:00"
        status: "pending",
        room_id: parseInt(room.id),
      });

      if (error) {
        if (error.code === "23505") {
          setWarning("❌ Maaf, slot ini baru saja dibooking orang lain!");
        } else {
          setWarning("Gagal booking: " + error.message);
        }
        return;
      }

      const pesan = `*BOOKING BARU (2 JAM)*\nStudio: ${room.name}\nNama: ${formData.nama}\nWA: ${formData.whatsapp}\nTanggal: ${formData.tanggal}\nJam: ${jamUntukDatabase}\n\nSegera konfirmasi DP ya! 🎸`;
      window.open(`https://wa.me/6285886933826?text=${encodeURIComponent(pesan)}`, "_blank");
      closeModal();
    } catch (err) {
      setWarning("Gagal booking. Coba lagi sebentar.");
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
            <p className="text-sm text-zinc-400">Rp {room.price} / 2 jam</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
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
            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
              <Calendar size={16} />
              Pilih Tanggal
            </label>
            <input
              type="date"
              value={formData.tanggal}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => {
                setFormData({ ...formData, tanggal: e.target.value, jamMulai: "" });
                setWarning("");
              }}
              className="mt-2 w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white focus:border-red-500 transition"
            />
          </div>

          {/* PILIH SLOT 2 JAM - LEBIH JELAS & RAPI */}
          <div>
            <label className="text-lg font-bold text-white">Pilih Slot Sewa 2 Jam</label>
            <p className="text-sm text-zinc-400 mt-1 mb-4">Minimal sewa 2 jam berturut-turut</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {timeSlotsMulai.map((jam) => {
                const blockTaken = isBlockTaken(jam);
                const isSelected = formData.jamMulai === jam && !blockTaken;

                const jamSelesaiTemp = `${(parseInt(jam.split(":")[0]) + 2).toString().padStart(2, "0")}:00`;

                return (
                  <button
                    key={jam}
                    type="button"
                    disabled={blockTaken || !formData.tanggal}
                    onClick={() => handleJamClick(jam)}
                    className={`relative p-6 rounded-3xl border-4 transition-all text-center
                      ${blockTaken
                        ? "bg-red-900/50 border-red-700 text-red-300 cursor-not-allowed"
                        : isSelected
                        ? "bg-red-600 border-red-600 text-white shadow-2xl scale-105"
                        : "bg-zinc-900 border-zinc-700 text-white hover:border-red-500 hover:bg-zinc-800"
                      }`}
                  >
                    <div className="text-2xl font-bold">{jam}</div>
                    <div className="text-lg mt-1 opacity-80">- {jamSelesaiTemp}</div>
                    {blockTaken && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-3xl">
                        <span className="text-lg font-bold">DIBOOKING</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* KONFIRMASI SLOT YANG DIPILIH */}
            {formData.jamMulai && !isBlockTaken(formData.jamMulai) && (
              <div className="mt-8 p-6 bg-gradient-to-br from-red-900/30 to-zinc-900 border-2 border-red-600 rounded-3xl text-center">
                <p className="text-lg text-zinc-300">Slot yang akan Anda booking:</p>
                <p className="text-4xl font-bold text-white mt-3">
                  {formData.jamMulai} - {jamSelesai}
                </p>
                <p className="text-xl text-green-400 mt-3 font-bold">Durasi 2 Jam</p>
              </div>
            )}
          </div>

          {warning && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/50 p-5 rounded-2xl text-red-400 text-base animate-pulse">
              <AlertCircle size={24} />
              <span>{warning}</span>
            </div>
          )}

          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl text-center">
            <p className="text-sm text-zinc-500 uppercase">Transfer DP 50% ke</p>
            <p className="font-mono text-xl font-bold text-white mt-2">BCA 123-456-7890 a.n. Wangsa Studio</p>
          </div>

          <button
            onClick={handleWhatsapp}
            disabled={
              !formData.nama ||
              !formData.whatsapp ||
              !formData.tanggal ||
              !formData.jamMulai ||
              isBlockTaken(formData.jamMulai)
            }
            className="w-full py-6 rounded-3xl font-bold text-xl transition-all bg-red-600 hover:bg-red-500 text-white shadow-2xl disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
          >
            Konfirmasi Booking 2 Jam via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}