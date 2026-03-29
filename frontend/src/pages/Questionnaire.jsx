import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Loader } from 'lucide-react';
import api from '../services/api';

function Questionnaire() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({
    fever: false,
    heart_rate_high: false,
    rapid_breathing: false,
    confusion: false,
    infection_history: false,
    low_blood_pressure_symptoms: false,
    recent_surgery_injury: false,
    additional_notes: ''
  });

  const questions = [
    { key: 'fever', label: 'Do you currently have a fever or feel unusually cold/shivering?' },
    { key: 'heart_rate_high', label: 'Is your heart beating much faster than normal (>90 bpm)?' },
    { key: 'rapid_breathing', label: 'Are you breathing rapidly or experiencing shortness of breath?' },
    { key: 'confusion', label: 'Are you experiencing confusion, slurred speech, or altered mental state?' },
    { key: 'infection_history', label: 'Have you had a recent infection (UTI, pneumonia, skin infection, etc.)?' },
    { key: 'low_blood_pressure_symptoms', label: 'Do you feel extremely weak, dizzy, or like you might pass out (signs of low blood pressure)?' },
    { key: 'recent_surgery_injury', label: 'Have you had a recent surgery, medical procedure, or severe injury?' }
  ];

  const handleToggle = (key) => {
    setAnswers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/patient/assessment', answers);
      if (res.data) {
        navigate('/patient/dashboard');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting assessment. Please ensure your profile is complete.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10 animate-float text-center max-w-xl mx-auto">
        <div className="w-16 h-16 bg-brand-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-brand-100">
          <Activity className="w-8 h-8 text-brand-600" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">SepCheck AI</h1>
        <p className="text-slate-500 font-medium">
          Answer the following clinical questions accurately. Our medical-grade AI will analyze these inputs against thousands of sepsis patterns.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
          {questions.map((q, index) => (
            <div key={q.key} className={`py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${index !== questions.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <div className="md:w-3/4">
                <span className="text-brand-600 font-bold mr-3 block md:inline mb-1 md:mb-0">0{index + 1}.</span>
                <span className="text-slate-800 font-medium text-lg leading-relaxed">{q.label}</span>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl w-32 shrink-0">
                <button
                  type="button"
                  onClick={() => setAnswers({...answers, [q.key]: true})}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${answers[q.key] ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 bg-transparent hover:bg-slate-200'}`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setAnswers({...answers, [q.key]: false})}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${!answers[q.key] ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 bg-transparent hover:bg-slate-200'}`}
                >
                  No
                </button>
              </div>
            </div>
          ))}

          <div className="pt-6 border-t border-slate-100">
            <label className="block text-slate-800 font-medium text-lg leading-relaxed mb-3">
              <span className="text-brand-600 font-bold mr-3">08.</span>
              Any additional symptoms or notes?
            </label>
            <textarea
              rows="3"
              className="input-field bg-slate-50 border-slate-200 focus:bg-white resize-none"
              placeholder="E.g., extreme pain, skin discoloration, chills that won't stop..."
              value={answers.additional_notes}
              onChange={(e) => setAnswers({...answers, additional_notes: e.target.value})}
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="primary-btn flex items-center justify-center gap-2 px-10 py-4 text-lg w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" /> Analyzing with LLM...
              </>
            ) : (
              <>
                Generate Final Report <ArrowRight className="w-5 h-5"/>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Questionnaire;
