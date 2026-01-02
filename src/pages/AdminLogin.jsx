import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";


export default function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({ email, password })
        
        if (error) {
            alert("Akses Ditolak: " + error.message)
        } else {
            navigate('/admin-wangsa-rahasia')
        }
        setLoading(false)
    }

    return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Admin Access</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" placeholder="Email Admin" 
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white"
            onChange={(e) => setEmail(e.target.value)} required
          />
          <input 
            type="password" placeholder="Password" 
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white"
            onChange={(e) => setPassword(e.target.value)} required
          />
          <button 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all"
          >
            {loading ? "Checking..." : "Masuk Panel"}
          </button>
        </form>
      </div>
    </div>
  );

   
}


