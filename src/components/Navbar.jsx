import { Link } from 'react-router-dom';
import logo from '../assets/StoniLogo.webp';
import EquipmentPage from './EquipmentPage';

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-6 md:px-12 py-6 border-b border-white/5">
      
      {/* Bagian Logo + Teks STONI */}
      <Link to="/" className="flex items-center gap-3 group"> 
        <img src={logo} alt="Stoni Logo" className="h-24 w-auto group-hover:scale-105 transition-transform" /> 
        <span className="text-xl font-bold tracking-[0.3em] text-white">
          STONI
        </span>
      </Link>

      {/* NAVIGASI LINK */}
      <div className="hidden md:flex gap-10 text-lg font-bold uppercase tracking-widest">
        {/* Gunakan Link ke path yang sesuai, misalnya "/rooms" */}
        <Link to="/" className="text-zinc-400 hover:text-red-500 transition-colors group">
          Rooms
        </Link>
        
        {/* Tombol ke Equipment Page */}
        <Link 
          to="/equipment" 
          className="relative text-zinc-400 hover:text-red-500 transition-colors group"
        >
          Equipment
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 transition-all group-hover:w-full"></span>
        </Link>

        <a href="#contact" className="text-zinc-400 hover:text-red-500 transition-colors">
          Contact
        </a>
        
        <Link 
          to="/admin-wangsa-rahasia" 
          className="text-zinc-400 hover:text-red-500 transition-colors opacity-50 hover:opacity-100"
        >
          Admin
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <button className="bg-transparent text-white px-4 py-2 text-base font-bold hover:text-red-500 transition-colors">
          Login
        </button>
      </div>
    </nav>
  );
}