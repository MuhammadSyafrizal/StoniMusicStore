import { X, AlertCircle, Calendar, Loader2, Clock } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";

export default function BookingModal({ room, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    nama: "",
    whatsapp: "",
    tanggal: "",
    jamMulai: "",
    durasi: 2,
  });

  const [settings, setSettings] = useState({
    jam_buka: "10:00",
    jam_tutup: "00:00",
  });

  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);

  const DURASI_OPTIONS = [2, 3, 4, 5];

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("studio_settings")
        .select("jam_buka, jam_tutup")
        .single();
      if (data) {
        setSettings({
          jam_buka: data.jam_buka || "10:00",
          jam_tutup: data.jam_tutup || "00:00",
        });
      }
    };
    if (isOpen) fetchSettings();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFormData({ nama: "", whatsapp: "", tanggal: "", jamMulai: "", durasi: 2 });
      setWarning("");
      setBookedSlots([]);
    }
  }, [isOpen]);

  // Fetch booked slots
  useEffect(() => {
    if (!formData.tanggal || !isOpen) {
      setBookedSlots([]);
      return;
    }

    const fetchBooked = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("bookings")
          .select("jam, durasi_sewa")
          .eq("tanggal", formData.tanggal)
          .eq("room_id", parseInt(room.id))
          .in("status", ["pending", "booked"]);

        const parsed = (data || []).map((b) => {
          const jamMulai = b.jam.split(" - ")[0].trim();
          const durasi = b.durasi_sewa || 2;
          return { jamMulai, durasi };
        });

        setBookedSlots(parsed);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooked();
  }, [formData.tanggal, room.id, isOpen]);

  // Helper untuk deteksi konflik
  const isSlotConflicting = (jamMulai, durasi) => {
    const requestedStart = parseInt(jamMulai.split(":")[0]);
    const requestedEnd = requestedStart + durasi;

    return bookedSlots.some(booked => {
      const bookedStart = parseInt(booked.jamMulai.split(":")[0]);
      const bookedEnd = bookedStart + booked.durasi;
      // Logika overlap: StartA < EndB && EndA > StartB
      return requestedStart < bookedEnd && requestedEnd > bookedStart;
    });
  };

  // Generate jam yang VALID dan TIDAK BENTROK
  const availableStarts = useMemo(() => {
    const buka = parseInt(settings.jam_buka.split(":")[0]);
    const tutup = settings.jam_tutup === "00:00" ? 24 : parseInt(settings.jam_tutup.split(":")[0]);
    const currentDurasi = formData.durasi;

    let startHour = buka;
    const today = new Date().toISOString().split("T")[0];
    
    if (formData.tanggal === today) {
      const now = new Date();
      startHour = now.getMinutes() > 0 ? now.getHours() + 1 : now.getHours();
      if (startHour < buka) startHour = buka;
    }

    const jams = [];
    for (let h = startHour; h <= tutup - currentDurasi; h++) {
      const jamStr = `${h.toString().padStart(2, "0")}:00`;
      
      // PERUBAHAN: Jika bentrok, jangan masukkan ke array (hilangkan dari opsi)
      if (!isSlotConflicting(jamStr, currentDurasi)) {
        jams.push(jamStr);
      }
    }
    return jams;
  }, [settings, formData.durasi, formData.tanggal, bookedSlots]);

  // Helper display jam selesai (17:59)
  const getDisplayEndTime = (jamMulai, durasi) => {
    if (!jamMulai) return "";
    const end = parseInt(jamMulai.split(":")[0]) + durasi;
    return `${(end - 1).toString().padStart(2, "0")}:59`;
  };

  // Format database tetap bulat (15:00 - 18:00)
  const jamSelesaiDb = formData.jamMulai 
    ? `${(parseInt(formData.jamMulai.split(":")[0]) + formData.durasi).toString().padStart(2, "0")}:00` 
    : "";

  const handleSubmit = async () => {
    if (!formData.nama || !formData.whatsapp || !formData.tanggal || !formData.jamMulai) {
      setWarning("⚠️ Lengkapi semua data!");
      return;
    }

    try {
      const { error } = await supabase.from("bookings").insert({
        nama: formData.nama.trim(),
        whatsapp: formData.whatsapp.trim(),
        tanggal: formData.tanggal,
        jam: `${formData.jamMulai} - ${jamSelesaiDb}`,
        status: "pending",
        room_id: parseInt(room.id),
        durasi_sewa: formData.durasi,
      });

      if (error) throw error;

      const pesan = `*BOOKING BARU*\nStudio: ${room.name}\nNama: ${formData.nama}\nTanggal: ${formData.tanggal}\nJam: ${formData.jamMulai} - ${getDisplayEndTime(formData.jamMulai, formData.durasi)}\nDurasi: ${formData.durasi} jam`;
      window.open(`https://wa.me/6285886933826?text=${encodeURIComponent(pesan)}`, "_blank");
      onClose();
    } catch (err) {
      setWarning("Gagal booking. Coba lagi.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative z-10 bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header Image */}
        <div className="relative h-24 w-full">
          <img src={room.image} className="w-full h-full object-cover opacity-30" alt="" />
          <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white"><X size={24} /></button>
          <div className="absolute bottom-3 left-6">
            <h2 className="text-2xl font-bold text-white">{room.name}</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <input
            type="text" placeholder="Nama Band / Penyanyi"
            value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white focus:border-red-500 outline-none"
          />

          <input
            type="tel" placeholder="Nomor WhatsApp"
            value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white focus:border-red-500 outline-none"
          />

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><Calendar size={16} /> Tanggal</label>
            <input
              type="date" min={new Date().toISOString().split("T")[0]}
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value, jamMulai: "" })}
              className="mt-2 w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white"
            />
          </div>

          {/* Durasi */}
          <div>
            <label className="text-lg font-bold text-white">Pilih Durasi Sewa</label>
            <div className="grid grid-cols-4 gap-3 mt-4">
              {DURASI_OPTIONS.map((d) => (
                <button
                  key={d} onClick={() => setFormData({ ...formData, durasi: d, jamMulai: "" })}
                  className={`py-4 rounded-2xl font-bold text-xl transition-all ${formData.durasi === d ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400"}`}
                >
                  {d} Jam
                </button>
              ))}
            </div>
          </div>

          {/* Jam Mulai - Hanya yang tidak konflik yang muncul */}
          <div>
            <label className="text-lg font-bold text-white flex items-center gap-3">
              <Clock size={20} /> Pilih Jam Mulai
              {loading && <Loader2 className="animate-spin" size={20} />}
            </label>
            <p className="text-sm text-zinc-400 mt-1 mb-4">
              Jam operasional: {settings.jam_buka} - {settings.jam_tutup}
            </p>
            
            {formData.tanggal ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                {availableStarts.map((jam) => {
                  const selected = formData.jamMulai === jam;
                  const displayEnd = getDisplayEndTime(jam, formData.durasi);

                  return (
                    <button
                      key={jam}
                      onClick={() => setFormData({ ...formData, jamMulai: jam })}
                      className={`p-4 rounded-3xl border-4 transition-all text-center ${
                        selected ? "bg-red-600 border-red-600 text-white scale-105" : "bg-zinc-900 border-zinc-700 text-white"
                      }`}
                    >
                      <div className="text-xl font-bold">{jam}</div>
                      <div className="text-xs opacity-70">- {displayEnd}</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-zinc-500 text-center py-8">Pilih tanggal terlebih dahulu</p>
            )}
            
            {formData.tanggal && availableStarts.length === 0 && !loading && (
              <p className="text-red-400 text-center py-8">Maaf, tidak ada slot tersedia untuk durasi ini.</p>
            )}
          </div>

          {/* Preview Booking */}
          {formData.jamMulai && (
            <div className="p-6 bg-red-600/10 border-2 border-red-600 rounded-3xl text-center">
              <p className="text-sm text-red-400 uppercase font-bold">Slot Terpilih</p>
              <p className="text-3xl font-bold text-white mt-1">
                {formData.jamMulai} - {getDisplayEndTime(formData.jamMulai, formData.durasi)}
              </p>
            </div>
          )}

          {warning && <div className="p-4 bg-red-500/10 border border-red-500 text-red-400 rounded-xl flex items-center gap-2"><AlertCircle size={20}/>{warning}</div>}
          
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl text-center">
            <p className="text-sm text-zinc-500 uppercase">Transfer DP 50% ke</p>
            <p className="font-mono text-xl font-bold text-white mt-2">BCA 123-456-7890 a.n. Wangsa Studio</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!formData.jamMulai || loading}
            className="w-full py-6 rounded-3xl font-bold text-xl bg-red-600 text-white disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            Konfirmasi Booking WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}