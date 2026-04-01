import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Thermometer, HeartPulse, AlertTriangle, FileText, Upload, Download, User as UserIcon, Gauge, Clock, Building, CheckCircle, MessageSquare, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PatientProfileForm from '../components/PatientProfileForm';
import ChatWindow from '../components/ChatWindow';
import AIFollowupChat from '../components/AIFollowupChat';

function PatientDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [consulting, setConsulting] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [showHospitals, setShowHospitals] = useState(false);
  const [showChat, setShowChat] = useState(null);
  const [testUploading, setTestUploading] = useState(null);
  const pollInterval = useRef(null);

  useEffect(() => {
    fetchInitialData();
    // Setup polling for consultations
    pollInterval.current = setInterval(fetchConsultations, 15000);
    return () => clearInterval(pollInterval.current);
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await fetchProfileAndReports();
      await fetchConsultations();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileAndReports = async () => {
    try {
      const profileRes = await api.get('/patient/profile');
      setProfile(profileRes.data);
      const reportsRes = await api.get('/patient/reports');
      setReports(reportsRes.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setProfile(null);
      }
    }
  };

  const fetchConsultations = async () => {
    try {
      const res = await api.get('/patient/consultations');
      setConsultations(res.data);
    } catch (err) {
      console.error("Consultation fetch failed", err);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Upload & Extract
      const uploadRes = await api.post('/patient/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const extracted = uploadRes.data.extracted_data;
      
      // 2. Auto-trigger Assessment
      await api.post('/patient/assessment', {
        ...extracted,
        additional_notes: `Automated analysis from uploaded report: ${file.name}`,
        is_doctor_suggested: true
      });

      setUploadSuccess(true);
      fetchProfileAndReports(); // Refresh
    } catch (error) {
      console.error("Upload/Analysis failed", error);
      alert("Failed to analyze report automatically. Please try the manual questionnaire.");
    } finally {
      setUploading(false);
    }
  };

  const handleConsultNow = async (reportId, severity) => {
    setConsulting(reportId);
    try {
      await api.post('/consult/request', {
        report_id: reportId,
        severity: severity
      });
      fetchConsultations();
    } catch (err) {
      console.error("Consultation request failed", err);
    } finally {
      setConsulting(false);
    }
  };

  const handleNeedHelpNow = async () => {
    if (reports.length === 0) {
      alert("Please complete at least one assessment first so doctors have your data.");
      return;
    }
    
    setEmergencyLoading(true);
    try {
      // 1. Send Emergency Signal to Backend FIRST
      await api.post('/patient/emergency', {
        report_id: reports[0].id 
      });

      // 2. Try to get location for nearby hospitals
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`Emergency at: ${latitude}, ${longitude}`);
          
          try {
            // Fetch nearby hospitals from Overpass API (OpenStreetMap)
            const query = `[out:json];node["amenity"="hospital"](around:10000,${latitude},${longitude});out 5;`;
            const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
            
            const response = await axios.get(overpassUrl);
            const hospitals = response.data.elements.map(h => ({
              name: h.tags.name || "Hospital",
              lat: h.lat,
              lon: h.lon
            }));
            setNearbyHospitals(hospitals);
            setShowHospitals(true);
            alert("Emergency Alert Sent! Note: Check the clinical map now appearing on your screen!");
          } catch (osmError) {
            console.error("OSM/Overpass fail", osmError);
            alert(`Emergency Alert Sent! Note: Hospitals could not be retrieved instantly. \n\nWe have provided a direct Google Maps link for you.`);
            // Set a fallback link to searching hospitals near me
            setNearbyHospitals([{ 
                name: "Find Hospitals in Google Maps", 
                lat: latitude, 
                lon: longitude, 
                is_fallback: true 
            }]);
            setShowHospitals(true);
          }
        }, (err) => {
          console.warn("Location access denied", err);
          alert("Emergency Alert Sent! (Location access denied for hospital search)");
        });
      } else {
        alert("Emergency Alert Sent! (Geolocation not supported by this browser)");
      }
      
      fetchConsultations();
    } catch (err) {
      console.error("Emergency failed", err);
      alert("Emergency alert failed! Please call emergency services immediately.");
    } finally {
      setEmergencyLoading(false);
    }
  };

  const handleDiagnosticUpload = async (reportId, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setTestUploading(reportId);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const url = `/patient/report/${reportId}/upload-diagnostic`;
      await api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchProfileAndReports();
      alert("Diagnostic report uploaded and summarized successfully!");
    } catch (error) {
      console.error("Diagnostic upload failed", error);
      const serverDetail = error.response?.data?.detail;
      const status = error.response?.status;
      const errorMsg = serverDetail 
        ? `Server Error (${status}): ${serverDetail}` 
        : `Diagnostic upload failed: ${error.message}`;
      alert(errorMsg);
    } finally {
      setTestUploading(null);
    }
  };

  const downloadPDF = async (reportId) => {
    try {
      const res = await api.get(`/patient/report/${reportId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SepCheck_Report_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("PDF Download failed", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const getRiskColor = (level) => {
    switch(level) {
      case 'High': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Low': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getReportStyle = (isSuggested) => {
    if (isSuggested) {
      return "p-8 bg-indigo-50/30 border-2 border-indigo-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:bg-indigo-50/50 transition-all duration-300 ring-1 ring-indigo-50";
    }
    return "p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300";
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">Synchronizing Medical Records...</div>;
  }

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <PatientProfileForm onProfileCreated={() => {
           fetchInitialData();
           window.location.href = '/patient/questionnaire'; 
        }} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* EMERGENCY BUTTON SECTION */}
      <div className="mb-10 p-1 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-6 p-6">
          <div className="bg-rose-50 p-4 rounded-3xl text-rose-600">
            <HeartPulse className="w-10 h-10 animate-pulse" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Need Help Now?</h2>
            <p className="text-slate-500 font-medium">One-tap emergency signal to notify all on-call clinical specialists.</p>
          </div>
          <button 
            onClick={handleNeedHelpNow}
            disabled={emergencyLoading}
            className="w-full md:w-auto px-10 py-5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-black rounded-[2rem] shadow-2xl shadow-rose-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
          >
            {emergencyLoading ? <Activity className="w-6 h-6 animate-spin" /> : <AlertTriangle className="w-6 h-6" />}
            HELP ME NOW
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Patient Portal</h1>
          <p className="text-slate-500 mt-1 uppercase tracking-widest font-bold text-xs text-brand-600">SEPCHECK AI CLOUD</p>
        </div>
        <Link to="/patient/questionnaire" className="primary-btn flex items-center gap-2 text-sm shadow-lg shadow-brand-100 px-6 py-3">
          <Activity className="w-5 h-5" /> Start AI Screening
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="md:col-span-1 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm transition hover:shadow-md h-full">
           <div className="flex justify-between items-start mb-4">
              <div className="bg-brand-50 p-2 rounded-xl text-brand-600">
                <UserIcon className="w-6 h-6" />
              </div>
              <span className="text-xs bg-brand-100 text-brand-700 font-bold px-2 py-1 rounded-full">{profile.blood_group}</span>
           </div>
           <h3 className="font-bold text-slate-900 text-lg mb-1">{profile.full_name}</h3>
           <p className="text-sm text-slate-500 mb-4">{profile.age} years • {profile.gender}</p>
           
           <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Weight</p>
                <p className="font-bold text-slate-700">{profile.weight}kg</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Height</p>
                <p className="font-bold text-slate-700">{profile.height}cm</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">BP</p>
                <p className="font-bold text-slate-700">{profile.blood_pressure}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Temp</p>
                <p className="font-bold text-slate-700">{profile.temperature}°F</p>
              </div>
           </div>

           <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-brand-600" /> Upload Doctor Suggested Reports Here
            </h3>
            <label className="block bg-slate-100 hover:bg-slate-200 border border-slate-200 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all">
                {uploading ? <Activity className="w-5 h-5 animate-spin mx-auto text-brand-600" /> : <Upload className="w-5 h-5 mx-auto text-slate-500 mb-1" />}
                <span className="text-xs font-bold text-slate-600 block">{uploading ? 'Analyzing...' : 'Upload Report'}</span>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
           </div>
        </div>
        
        <div className="p-8 rounded-3xl bg-brand-600 text-white shadow-xl shadow-brand-200 flex flex-col justify-between md:col-span-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition duration-500">
            <MessageSquare className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-2xl mb-4">Clinical Consultations</h3>
            <div className="space-y-3">
              {consultations.length === 0 ? (
                <p className="text-brand-100 text-base mb-8 max-w-lg leading-relaxed">
                  No active consultation requests. Once you generate a report, you can request an immediate review from our specialists.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {consultations.map(c => (
                    <div key={c.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${c.status === 'accepted' ? 'bg-emerald-500' : 'bg-amber-500'}`}>{c.status}</span>
                        <span className="text-[10px] font-medium text-white/60">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      {c.status === 'accepted' ? (
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-emerald-300 flex items-center gap-1"><Clock className="w-3 h-3" /> {c.appointment_time}</p>
                            <p className="text-xs text-white flex items-center gap-1"><Building className="w-3 h-3" /> {c.hospital}</p>
                          </div>
                          <button 
                            onClick={() => setShowChat(c.id)}
                            className="p-2 bg-white text-brand-600 rounded-xl hover:bg-brand-50 transition shadow-lg"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-white/80">Awaiting specialist assignment...</p>
                      )}
                      {c.prescribed_tests_meds && (
                        <div className="mt-4 p-3 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
                          <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Doctor Prescription
                          </p>
                          <p className="text-xs text-white font-medium italic">"{c.prescribed_tests_meds}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="relative z-10 flex gap-4 mt-6">
            <Link to="/patient/recommendations" className="bg-white text-brand-700 text-sm font-bold py-3 px-8 rounded-xl hover:bg-brand-50 transition-all shadow-md">
              Browse Specialists
            </Link>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <FileText className="w-6 h-6 text-brand-600" /> Sepsis Report History
        </h2>
        <span className="text-sm font-bold text-slate-400">{reports.length} Reports Found</span>
      </div>
      
      {reports.length === 0 ? (
        <div className="text-center py-24 bg-white border-2 border-slate-100 border-dashed rounded-[2.5rem]">
          <AlertTriangle className="w-16 h-16 text-slate-200 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">No Reports Available</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">Please take the assessment or upload a clinical report for AI analysis.</p>
          <Link to="/patient/questionnaire" className="primary-btn inline-block px-10 py-4 shadow-lg shadow-brand-100">Register First Case</Link>
        </div>
      ) : (
        <div className="grid gap-8">
          {reports.map((report) => (
            <div key={report.id} className={getReportStyle(report.is_doctor_suggested)}>
              {report.is_doctor_suggested && (
                <div className="mb-4 flex items-center gap-2 text-indigo-600 bg-indigo-100/50 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <UserIcon className="w-3 h-3" /> Doctor Suggested Report
                </div>
              )}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 pb-8 border-b border-slate-50">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">{new Date(report.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <div className="h-1 w-1 bg-slate-200 rounded-full"></div>
                    <span className="text-sm font-bold text-slate-400">REPORT #{report.id + 1000}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className={`px-5 py-1.5 text-xs font-black rounded-full border shadow-sm ${getRiskColor(report.risk_level)}`}>
                      {report.risk_level.toUpperCase()} RISK
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                      {(report.probability_score * 100).toFixed(0)}% AI CONFIDENCE
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                   {report.risk_level === 'High' && (
                    <button 
                      onClick={() => handleConsultNow(report.id, report.risk_level)}
                      disabled={consulting === report.id || consultations.some(c => c.report_id === report.id)}
                      className={`px-6 py-3 rounded-2xl text-xs font-black border uppercase tracking-wider transition-all flex items-center gap-2
                        ${consultations.some(c => c.report_id === report.id) 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600 opacity-70 cursor-not-allowed' 
                          : 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-200 hover:bg-rose-700'
                        }
                      `}
                    >
                      {consultations.some(c => c.report_id === report.id) ? (
                        <><CheckCircle className="w-4 h-4" /> Consultation Requested</>
                      ) : consulting === report.id ? (
                        <><Activity className="w-4 h-4 animate-spin" /> Processing...</>
                      ) : (
                        <><MessageSquare className="w-4 h-4" /> Consult Now</>
                      )}
                    </button>
                   )}
                  
                  <button 
                    onClick={() => downloadPDF(report.id)}
                    className="p-3 rounded-2xl bg-white border border-slate-200 text-brand-600 hover:bg-brand-50 hover:border-brand-200 transition-all shadow-sm flex items-center gap-2 group"
                  >
                    <Download className="w-5 h-5 group-hover:scale-110 transition" />
                    <span className="text-xs font-bold">DOWNLOAP PDF</span>
                  </button>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-brand-500" /> AI Diagnostic Summary
                    </h4>
                    <p className="text-slate-600 text-md leading-relaxed font-medium">{report.symptoms_summary}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" /> Actionable Recommendations
                    </h4>
                    <div className="bg-brand-600 text-white p-6 rounded-3xl relative overflow-hidden shadow-lg shadow-brand-100 mb-6">
                       <p className="font-medium text-sm leading-relaxed relative z-10">{report.recommendations}</p>
                       <FileText className="absolute bottom-0 right-0 w-24 h-24 text-white opacity-10 -mr-4 -mb-4" />
                    </div>

                    <div className="space-y-4 border-t border-slate-100 pt-6">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            <Thermometer className="w-5 h-5 text-amber-500" /> Suggested Diagnostic Tests
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {report.suggested_tests?.length > 0 ? (
                                report.suggested_tests.map((test, i) => (
                                    <span key={i} className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full">{test}</span>
                                ))
                            ) : (
                                <span className="text-xs text-slate-400 italic">No specific tests suggested by AI for this case.</span>
                            )}
                        </div>
                        
                        <label className="block p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all text-center">
                            {testUploading === report.id ? (
                                <Activity className="w-5 h-5 animate-spin mx-auto text-brand-600" />
                            ) : (
                                <>
                                    <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                                    <span className="text-[10px] font-black uppercase text-slate-500">Upload Test Results for Inner Analysis</span>
                                </>
                            )}
                            <input type="file" className="hidden" onChange={(e) => handleDiagnosticUpload(report.id, e)} />
                        </label>

                        {report.inner_analysis_summary && (
                            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl">
                                <p className="text-[10px] font-black uppercase text-emerald-600 mb-2 tracking-widest">INNER CLINICAL ANALYSIS</p>
                                <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{report.inner_analysis_summary}"</p>
                            </div>
                        )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-6 text-lg">Report Findings</h4>
                  <ul className="space-y-3">
                    {Object.entries(report.questionnaire_data).map(([key, val]) => (
                      <li key={key} className="flex justify-between items-center text-sm bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-slate-500 font-bold capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-md ${val === true ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`}>
                          {val === true ? 'YES' : val === false ? 'NO' : val}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* AI FOLLOW-UP CHAT */}
              <AIFollowupChat reportId={report.id} reportRisk={report.risk_level} />
            </div>
          ))}
        </div>
      )}

      {/* LIVE CHAT WINDOW */}
      {showChat && (
        <ChatWindow consultationId={showChat} onClose={() => setShowChat(null)} />
      )}

      {/* HOSPITAL MODAL */}
      {showHospitals && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="bg-rose-600 p-8 text-white text-center">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-4 animate-bounce" />
                      <h3 className="text-2xl font-black">Emergency Help Found</h3>
                      <p className="text-rose-100 font-medium mt-1">Here are the nearest hospitals for instant action.</p>
                  </div>
                  <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                      {nearbyHospitals.map((h, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-rose-200 transition-all group">
                              <div>
                                  <p className="font-bold text-slate-900">{h.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Building className="w-3 h-3" /> Hospital Node</p>
                              </div>
                              <a 
                                href={h.is_fallback ? `https://www.google.com/maps/search/hospitals+near+me/@${h.lat},${h.lon},14z` : `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-white text-rose-600 text-xs font-black p-3 rounded-xl shadow-sm border border-slate-100 group-hover:bg-rose-600 group-hover:text-white transition-all"
                              >
                                  {h.is_fallback ? "SEARCH" : "NAVIGATE"}
                              </a>
                          </div>
                      ))}
                      {nearbyHospitals.length === 0 && <p className="text-center py-8 text-slate-400 font-bold uppercase tracking-widest text-xs">No hospitals found within 5km.</p>}
                  </div>
                  <div className="p-6 pt-0">
                      <button 
                        onClick={() => setShowHospitals(false)}
                        className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition shadow-lg"
                      >
                          I've found help
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

export default PatientDashboard;
