import { useState } from 'react';
import { User, Activity, Smartphone, Hash, Droplets, Thermometer, HeartPulse, Gauge } from 'lucide-react';
import api from '../services/api';

function PatientProfileForm({ onProfileCreated }) {
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: 'Male',
    weight: '',
    height: '',
    blood_group: 'A+',
    blood_pressure: '',
    heart_rate: '',
    temperature: '',
    existing_diseases: '',
    allergies: '',
    contact_info: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/patient/profile', {
        ...formData,
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        heart_rate: parseInt(formData.heart_rate),
        temperature: parseFloat(formData.temperature)
      });
      onProfileCreated();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create profile. Please check your inputs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="bg-brand-600 px-8 py-10 text-white text-center">
          <div className="inline-flex p-3 bg-white/20 rounded-2xl mb-4 backdrop-blur-md">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold">Complete Your Medical Profile</h2>
          <p className="text-brand-100 mt-2">To provide accurate AI analysis, we need your basic health information.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm flex items-center justify-center font-medium">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  required
                  name="full_name"
                  type="text"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Age</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    required
                    name="age"
                    type="number"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none"
                    placeholder="25"
                    value={formData.age}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Gender</label>
                <select
                  name="gender"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none appearance-none"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Weight (kg)</label>
                <input
                  required
                  name="weight"
                  type="number"
                  step="0.1"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none"
                  placeholder="70.5"
                  value={formData.weight}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Height (cm)</label>
                <input
                  required
                  name="height"
                  type="number"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none"
                  placeholder="175"
                  value={formData.height}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Blood Group</label>
              <div className="relative">
                <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  name="blood_group"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none appearance-none"
                  value={formData.blood_group}
                  onChange={handleChange}
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Blood Pressure (mmHg)</label>
              <div className="relative">
                <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  required
                  name="blood_pressure"
                  type="text"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none placeholder:text-slate-300"
                  placeholder="e.g., 120/80"
                  value={formData.blood_pressure}
                  onChange={handleChange}
                />
              </div>
              <p className="text-[10px] text-slate-400 ml-1 italic font-medium">Use Systolic/Diastolic format (e.g., 120/80)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Heart Rate (bpm)</label>
                <div className="relative">
                  <HeartPulse className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    required
                    name="heart_rate"
                    type="number"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none"
                    placeholder="72"
                    value={formData.heart_rate}
                    onChange={handleChange}
                  />
                </div>
                <p className="text-[10px] text-slate-400 ml-1 italic">Range: 40-200</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Temp (°F)</label>
                <div className="relative">
                  <Thermometer className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    required
                    name="temperature"
                    type="number"
                    step="0.1"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none"
                    placeholder="98.6"
                    value={formData.temperature}
                    onChange={handleChange}
                  />
                </div>
                <p className="text-[10px] text-slate-400 ml-1 italic">Range: 95-110</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Contact Number</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  required
                  name="contact_info"
                  type="text"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none"
                  placeholder="+1 (555) 000-0000"
                  value={formData.contact_info}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Existing Diseases</label>
              <textarea
                name="existing_diseases"
                rows="2"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none"
                placeholder="List any chronic illnesses (e.g., Diabetes, Hypertension)"
                value={formData.existing_diseases}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Allergies</label>
              <textarea
                name="allergies"
                rows="2"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none"
                placeholder="List any medicine or food allergies"
                value={formData.allergies}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full primary-btn py-4 text-lg font-bold shadow-lg shadow-brand-200 hover:shadow-xl transition-all"
          >
            {loading ? 'Creating Profile...' : 'Save and Continue to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PatientProfileForm;
