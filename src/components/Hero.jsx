export default function Hero() {
    return (
        <section className="relative h-[80vh] flex items-center justify-center bg-zinc-900 overflow-hidden">
            <div className="absolute inset-0 bg-black/60 z-10"></div>

            <img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=2070" className="absolute inset-0 w-full h-full object-cover" alt="Studio Background" />
            <div className="relative z-20 text-center px-4">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
          REKAM <span className="text-red-500">KARYA</span> TERBAIKMU
        </h1>
        <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-8">
          Fasilitas premium dengan akustik profesional untuk latihan band, rekaman, hingga mixing & mastering.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button className="bg-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:scale-105 transition">
            Lihat Jadwal Kosong
          </button>
          <button className="border border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-black transition">
            Tur Virtual
          </button>
        </div>
      </div>
        </section>
    )
}