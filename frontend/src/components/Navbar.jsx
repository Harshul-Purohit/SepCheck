import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-brand-600 hover:text-brand-700 transition">
          <ShieldAlert className="w-8 h-8" />
          <span className="font-bold text-xl tracking-tight hidden sm:block">SepCheck</span>
        </Link>
        
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link to="/login?role=patient" className="text-slate-600 hover:text-slate-900 font-semibold text-sm">For Patients</Link>
              <Link to="/login?role=doctor" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-md shadow-brand-100">
                Doctor Login
              </Link>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mr-4 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                <div className={`w-2 h-2 rounded-full ${user.role === 'doctor' ? 'bg-emerald-500' : 'bg-brand-500'}`}></div>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{user.role}</span>
              </div>
              <Link 
                to={user.role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard'} 
                className="text-slate-700 hover:text-brand-600 font-bold text-sm transition"
              >
                Dashboard
              </Link>
              {user.role === 'patient' && (
                <Link to="/patient/questionnaire" className="text-slate-700 hover:text-brand-600 font-bold text-sm transition">
                  Screening
                </Link>
              )}
              <button 
                onClick={handleLogout}
                className="text-rose-500 hover:text-rose-600 font-bold text-sm ml-4 transition border-l border-slate-200 pl-4"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
