import { useState, useEffect } from 'react';
import { Stethoscope, MapPin, Phone, Star, ArrowLeft, CheckCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

function Recommendations() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await api.get('/patient/recommendations');
        setDoctors(data);
      } catch (error) {
        console.error("Error fetching doctors", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
      {/* Success Popup with Framer Motion */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all duration-500"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] border border-slate-100 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setShowSuccess(false)} className="text-slate-300 hover:text-slate-600 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <motion.div 
                initial={{ scale: 0.5, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-600 mx-auto mb-8 shadow-inner"
              >
                <CheckCircle className="w-12 h-12" />
              </motion.div>
              
              <h3 className="text-3xl font-black text-slate-900 text-center mb-4 tracking-tight">Request Sent!</h3>
              <p className="text-slate-500 text-center font-medium mb-10 leading-relaxed">
                Your consultation request has been successfully transmitted to <span className="text-brand-600 font-bold">Verified Specialists</span>. We will notify you immediately in your dashboard once a doctor accepts.
              </p>
              
              <button 
                onClick={() => setShowSuccess(false)}
                className="w-full bg-slate-900 hover:bg-brand-600 text-white font-bold py-5 rounded-[1.5rem] text-xs uppercase tracking-[0.2em] transition-all shadow-xl hover:shadow-brand-200 active:scale-95"
              >
                Return to Dashboard
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Link to="/patient/dashboard" className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-bold text-sm mb-8 transition-all group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" /> BACK TO DASHBOARD
      </Link>

      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Verified Specialists</h1>
        <p className="text-slate-500 font-medium">Connect with top-rated critical care professionals for immediate consultation.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-bold tracking-widest uppercase text-xs">Matching with doctors...</div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-24 bg-white border-2 border-slate-100 border-dashed rounded-[3rem]">
          <Stethoscope className="w-16 h-16 text-slate-200 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">No Doctors Available</h3>
          <p className="text-slate-500 max-w-md mx-auto font-medium text-sm">Our medical network is currently syncing. Please try again in a few minutes or consult a local hospital immediately if risk is High.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {doctors.map((doc) => (
            <div key={doc.doctor_id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 border border-brand-100 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-500">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-full border border-amber-100">
                  <Star className="w-3 h-3 fill-amber-600" />
                  <span className="text-[10px] font-black uppercase">4.9</span>
                </div>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-1 font-outfit uppercase tracking-tight">{doc.doctor_name}</h3>
              <p className="text-brand-600 font-bold text-xs uppercase tracking-widest mb-6">{doc.specialization}</p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-slate-500">
                  <Building className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold leading-tight uppercase">{doc.hospital}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold uppercase">Critical Care Unit</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-tighter hover:text-brand-600 cursor-pointer">+1 (555) 000-0000</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Experience</p>
                   <p className="text-sm font-black text-slate-800 uppercase">{doc.experience}+ Years</p>
                </div>
                <button 
                  onClick={() => setShowSuccess(true)}
                  className="bg-slate-900 hover:bg-brand-600 text-white font-bold py-3 px-6 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-lg hover:shadow-brand-200"
                >
                  CONSULT NOW
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Inline replacement for missing building icon (since lucide might not have it or spelled differently)
function Building({className}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
  );
}

export default Recommendations;
