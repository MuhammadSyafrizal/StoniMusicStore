import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-6 md:px-12 py-6 border-b border-white/5">
      <div className="text-2xl font-black tracking-tighter">WANGSA<span className="text-red-600">STUDIO</span></div>
      
      
      <div className="hidden md:flex gap-8 text-sm font-medium">
        <a href="#" className="hover:text-red-500">Rooms</a>
        <a href="#" className="hover:text-red-500">Equipment</a>
        <a href="#" className="hover:text-red-500">Contact</a>
        <Link to={"/admin-wangsa-rahasia"}>Admin</Link>
      </div>

      <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold">
        Login
      </button>
    </nav>
  )
}