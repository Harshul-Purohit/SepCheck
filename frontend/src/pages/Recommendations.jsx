import { useState, useEffect } from 'react';
import { Stethoscope, MapPin, Phone, Star, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Recommendations() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                <button className="bg-slate-900 hover:bg-brand-600 text-white font-bold py-3 px-6 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-lg hover:shadow-brand-200">
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
