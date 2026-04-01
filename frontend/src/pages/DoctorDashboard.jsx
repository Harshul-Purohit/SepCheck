import { useState, useEffect, useRef } from 'react';
import { Stethoscope, AlertTriangle, Users, Download, Activity, FileText, User as UserIcon, ShieldCheck, Clock, CheckCircle, XCircle, Send, HeartPulse, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import DoctorProfileForm from '../components/DoctorProfileForm';
import ChatWindow from '../components/ChatWindow';

function DoctorDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [responseForm, setResponseForm] = useState({
    appointment_time: '',
    hospital: '',
    notes: ''
  });
  
  const [emergencies, setEmergencies] = useState([]);
  const [showChat, setShowChat] = useState(null);
  
  const pollInterval = useRef(null);
  const emergencyPoll = useRef(null);
  const [prescribingFor, setPrescribingFor] = useState(null);
  const [prescribtionText, setPrescriptionText] = useState("");
  const [prescribeLoading, setPrescribeLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
    pollInterval.current = setInterval(fetchConsultations, 20000);
    emergencyPoll.current = setInterval(fetchEmergencies, 10000);
    return () => {
      clearInterval(pollInterval.current);
      clearInterval(emergencyPoll.current);
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get('/doctor/profile');
      setProfile(profileRes.data);
      
      const reportsRes = await api.get('/doctor/reports');
      setReports(reportsRes.data);
      
      await fetchConsultations();
      await fetchEmergencies();
    } catch (err) {
      if (err.response?.status === 404) {
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchEmergencies = async () => {
    try {
      const res = await api.get('/doctor/emergencies');
      setEmergencies(res.data);
    } catch (err) {
      console.error("Emergency fetch failed", err);
    }
  };

  const fetchConsultations = async () => {
    try {
      const res = await api.get('/doctor/consultations');
      setConsultations(res.data);
    } catch (err) {
      console.error("Failed to fetch consults", err);
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/consult/respond/${respondingTo}`, {
        status: 'accepted',
        appointment_time: responseForm.appointment_time,
        hospital: responseForm.hospital || profile.hospital_details,
        doctor_notes: responseForm.notes,
        required_tests: ["Complete Blood Count (CBC)", "Lactate Test"]
      });
      setRespondingTo(null);
      setResponseForm({ appointment_time: '', hospital: '', notes: '' });
      fetchConsultations();
    } catch (err) {
      console.error("Response failed", err);
    }
  };

  const handlePrescribe = async (e) => {
    e.preventDefault();
    setPrescribeLoading(true);
    try {
      await api.post(`/consult/respond/${prescribingFor}`, {
        status: 'accepted', // Keep current status
        prescribed_tests_meds: prescribtionText
      });
      setPrescribingFor(null);
      setPrescriptionText("");
      fetchConsultations();
      alert("Prescription sent to patient successfully!");
    } catch (err) {
      console.error("Prescription failed", err);
      alert("Failed to send prescription.");
    } finally {
      setPrescribeLoading(false);
    }
  };

  const highRiskCount = reports.filter(r => r.risk_level === 'High').length;
  const pendingConsults = consultations.filter(c => c.status === 'pending').length;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium tracking-widest uppercase text-xs">Synchronizing Clinical Queue...</div>;
  }

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <DoctorProfileForm onProfileCreated={fetchInitialData} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50/30">
      {/* EMERGENCY STICKY BANNER */}
      {emergencies.length > 0 && (
        <div className="sticky top-0 z-[100] bg-rose-600 text-white py-4 px-8 shadow-2xl flex items-center justify-between animate-pulse ring-4 ring-rose-500/50">
          <div className="flex items-center gap-6">
            <div className="p-3 bg-white/20 rounded-2xl">
              <HeartPulse className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight uppercase">Critical Patient Emergency Alert</h3>
              <p className="text-rose-100 text-sm font-bold">{emergencies.length} active emergency signal{emergencies.length > 1 ? 's' : ''} detected.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {emergencies.map(e => (
               <div key={e.id} className="bg-white text-rose-600 px-4 py-2 rounded-xl text-xs font-black shadow-lg">
                 PATIENT #{e.patient_id}
               </div>
             ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              Hi Doctor 👋
            </h1>
            <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">Verified Medical Professional</span>
              {profile.specialization} • {profile.hospital_details}
            </p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex-1 md:flex-none bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-black text-slate-900 leading-none">{reports.length}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-2">Total Cases</div>
              </div>
              <div className="w-px h-12 bg-slate-100"></div>
              <div className="text-center">
                <div className="text-3xl font-black text-rose-600 leading-none">{highRiskCount}</div>
                <div className="text-[10px] text-rose-400 uppercase tracking-widest font-black mt-2">Critical</div>
              </div>
              <div className="w-px h-12 bg-slate-100"></div>
              <div className="text-center">
                <div className="text-3xl font-black text-brand-600 leading-none">{pendingConsults}</div>
                <div className="text-[10px] text-brand-400 uppercase tracking-widest font-black mt-2">Consults</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
           {/* Consultation Requests Section */}
           <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
              <div className="px-8 py-6 bg-brand-50/50 border-b border-brand-100 flex items-center justify-between">
                 <h3 className="font-bold text-brand-900 flex items-center gap-3">
                   <Clock className="w-5 h-5 text-brand-600" /> Consultations Management
                 </h3>
                 <span className="text-[10px] font-black text-brand-400 tracking-widest uppercase">Live Queue</span>
              </div>
              <div className="p-4 space-y-4">
                 {consultations.length === 0 ? (
                   <div className="py-12 text-center text-slate-400 font-medium">No consultation requests found.</div>
                 ) : (
                   consultations.map(c => (
                     c.status === 'pending' ? (
                       <div key={c.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${c.severity === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-brand-100 text-brand-600'}`}>
                               {c.severity[0]}
                             </div>
                             <div>
                                <p className="font-bold text-slate-900">Case ID: #{c.report_id + 1000}</p>
                                <p className="text-xs text-slate-500 font-medium">Requested on {new Date(c.created_at).toLocaleDateString()}</p>
                             </div>
                          </div>
                          <button 
                            onClick={() => setRespondingTo(c.id)}
                            className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-brand-100"
                          >
                            Respond & Schedule
                          </button>
                       </div>
                     ) : c.status === 'accepted' ? (
                       <div key={c.id} className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex justify-between items-center transition hover:bg-emerald-50">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                               <CheckCircle className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">Active Consultation</p>
                                <p className="text-xs font-bold text-slate-700">Patient Case #{c.report_id + 1000}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <button 
                               onClick={() => setPrescribingFor(c.id)}
                               className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-sm font-bold text-xs"
                             >
                               <ShieldCheck className="w-4 h-4" /> Prescribe
                             </button>
                             <button 
                               onClick={() => setShowChat(c.id)}
                               className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition shadow-sm border border-emerald-100 font-bold text-xs"
                             >
                               <MessageSquare className="w-4 h-4" /> Open Chat
                             </button>
                          </div>
                       </div>
                     ) : null
                   ))
                 )}
              </div>
           </div>

           {/* Stats/Action Card */}
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
              <ShieldCheck className="absolute bottom-0 right-0 w-48 h-48 text-white/5 -mb-12 -mr-12" />
              <h3 className="text-xl font-bold mb-4">Quality Control</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-8">
                Every SepCheck report is vetted by our AI. Your human clinical oversight ensures 100% accuracy in acute sepsis intervention.
              </p>
              <div className="space-y-3">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                    <span className="text-xs font-medium text-white/80">Active Specialists</span>
                    <span className="font-bold text-emerald-400">Online</span>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                    <span className="text-xs font-medium text-white/80">Avg Response Time</span>
                    <span className="font-bold">12m</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Main Reports Queue */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
             <h3 className="font-bold text-slate-800 flex items-center gap-3">
               <FileText className="w-5 h-5 text-emerald-600" /> Clinical Assessment Queue
             </h3>
             <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">System Operational</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-[10px] text-slate-400 uppercase font-black bg-white border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6">Patient Case</th>
                  <th className="px-8 py-6">Risk Level</th>
                  <th className="px-8 py-6">AI Probability</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reports.length === 0 ? (
                  <tr><td colSpan="5" className="px-8 py-16 text-center text-slate-400 font-medium">No patient assessments available in queue.</td></tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/50 transition group">
                      <td className="px-8 py-8">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${report.risk_level === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50'}`}>
                            #{report.id + 1000}
                          </div>
                          <div>
                             <p className="font-bold text-slate-900 text-xs">Clinical Case</p>
                             <p className="text-[10px] text-slate-400 font-medium">{new Date(report.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <span className={`px-4 py-1 text-[10px] font-black rounded-full border uppercase tracking-widest
                          ${report.risk_level === 'High' ? 'text-rose-700 bg-rose-100 border-rose-200' :
                            report.risk_level === 'Medium' ? 'text-amber-700 bg-amber-100 border-amber-200' :
                            'text-emerald-700 bg-emerald-100 border-emerald-200'
                          }`}>
                          {report.risk_level}
                        </span>
                      </td>
                      <td className="px-8 py-8">
                        <div className="space-y-1">
                           <p className="font-black text-slate-800 text-xs">{(report.probability_score * 100).toFixed(0)}%</p>
                           <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                             <div className={`h-full ${report.probability_score > 0.7 ? 'bg-rose-500' : 'bg-brand-500'}`} style={{width: `${(report.probability_score * 100)}%`}}></div>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <p className={`text-[10px] font-black uppercase ${report.urgency_level === 'Immediate' ? 'text-rose-600' : 'text-slate-500'}`}>{report.urgency_level}</p>
                      </td>
                      <td className="px-8 py-8 text-right">
                        <button 
                          onClick={() => setSelectedReport(report)}
                          className="text-slate-400 hover:text-emerald-600 transition-all font-bold"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Response Modal */}
        {respondingTo && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Schedule Consultation</h3>
                   <button onClick={() => setRespondingTo(null)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleRespond} className="space-y-6">
                   <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Appointment Time</label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g., Tomorrow, 10:30 AM"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        value={responseForm.appointment_time}
                        onChange={(e) => setResponseForm({...responseForm, appointment_time: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Facility / Hospital</label>
                      <input 
                        required
                        type="text" 
                        placeholder={profile.hospital_details}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        value={responseForm.hospital}
                        onChange={(e) => setResponseForm({...responseForm, hospital: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Doctor's Notes</label>
                      <textarea 
                        placeholder="Admission instructions or initial advice..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
                        rows="3"
                        value={responseForm.notes}
                        onChange={(e) => setResponseForm({...responseForm, notes: e.target.value})}
                      />
                   </div>
                   <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-100 flex items-center justify-center gap-2">
                      <Send className="w-5 h-5" /> Send Response to Patient
                   </button>
                </form>
             </div>
          </div>
        )}
        
        {/* Prescription Modal */}
        {prescribingFor && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Prescribe Tests & Meds</h3>
                   <button onClick={() => setPrescribingFor(null)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handlePrescribe} className="space-y-6">
                   <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Prescription Details</label>
                      <textarea 
                        required
                        placeholder="List medicines, dosages, and any further diagnostic tests required..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
                        rows="6"
                        value={prescribtionText}
                        onChange={(e) => setPrescriptionText(e.target.value)}
                      />
                      <p className="mt-2 text-[10px] text-slate-400 font-medium italic">* This will be reflected instantly on the patient's dashboard.</p>
                   </div>
                   <button 
                    type="submit" 
                    disabled={prescribeLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transition-all"
                   >
                      {prescribeLoading ? <Activity className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                      Send Prescription to Patient
                   </button>
                </form>
             </div>
          </div>
        )}

        {/* Report Review Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                   <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Assessment Review</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Case ID: #{selectedReport.id + 1000} • Patient Data</p>
                   </div>
                   <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><XCircle className="w-8 h-8" /></button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                   <div className="grid md:grid-cols-3 gap-6">
                      <div className={`p-6 rounded-3xl border-2 ${selectedReport.risk_level === 'High' ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Risk Classification</p>
                         <p className={`text-2xl font-black ${selectedReport.risk_level === 'High' ? 'text-rose-600' : 'text-emerald-600'}`}>{selectedReport.risk_level}</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">AI Confidence Score</p>
                         <p className="text-2xl font-black text-slate-900">{(selectedReport.probability_score * 100).toFixed(1)}%</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Clinic Urgency</p>
                         <p className={`text-2xl font-black ${selectedReport.urgency_level === 'Immediate' ? 'text-rose-600' : 'text-slate-900'}`}>{selectedReport.urgency_level}</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                         <Activity className="w-5 h-5 text-brand-600" /> AI Diagnostic Summary
                      </h4>
                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                         <p className="text-slate-700 font-medium leading-relaxed">{selectedReport.symptoms_summary}</p>
                      </div>
                   </div>

                   <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <h4 className="font-bold text-slate-900 text-lg">Questionnaire Data</h4>
                         <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                               <tbody className="divide-y divide-slate-50">
                                  {Object.entries(selectedReport.questionnaire_data).map(([key, val]) => (
                                     <tr key={key}>
                                        <td className="px-6 py-4 font-bold text-slate-500 capitalize">{key.replace(/_/g, ' ')}</td>
                                        <td className="px-6 py-4 text-right">
                                           <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${val === true ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                              {val === true ? 'Yes' : val === false ? 'No' : val}
                                           </span>
                                        </td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <h4 className="font-bold text-slate-900 text-lg">AI Recommendations</h4>
                         <div className="bg-brand-600 text-white p-8 rounded-[2rem] shadow-xl shadow-brand-100/20 relative overflow-hidden">
                            <FileText className="absolute bottom-0 right-0 w-32 h-32 text-white/10 -mb-8 -mr-8" />
                            <p className="relative z-10 leading-relaxed font-medium">{selectedReport.recommendations}</p>
                         </div>
                      </div>
                   </div>
                </div>
                
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                   <button 
                    onClick={() => setSelectedReport(null)}
                    className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all"
                   >
                     Complete Review
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* LIVE CHAT WINDOW */}
      {showChat && (
        <ChatWindow consultationId={showChat} onClose={() => setShowChat(null)} />
      )}
    </div>
  );
}

export default DoctorDashboard;
