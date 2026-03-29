import { Link } from 'react-router-dom';
import { ArrowRight, Activity, ShieldCheck, Stethoscope } from 'lucide-react';

function Home() {
  return (
    <div className="relative overflow-hidden w-full">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-brand-50 to-slate-50 -z-10 isolate" />
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-brand-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32">
        <div className="text-center max-w-3xl mx-auto animate-float">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100/50 text-brand-700 text-sm font-semibold mb-6 shadow-sm border border-brand-200 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            SepCheck AI-Powered Sepsis Detection
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-tight">
            Early detection <br className="hidden lg:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-cyan-500">
              saves lives today.
            </span>
          </h1>
          
          <p className="text-lg lg:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Every minute counts when fighting sepsis. Our AI instantly analyzes your symptoms to assess risks and securely connects you with leading medical professionals for rapid intervention.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login?role=patient" className="primary-btn flex items-center gap-2 text-lg px-8 py-4 w-full sm:w-auto justify-center">
              Start Screening <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login?role=doctor" className="secondary-btn w-full sm:w-auto text-lg px-8 py-4 justify-center">
              Doctor Login
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:-translate-y-1 hover:shadow-xl duration-300">
            <div className="w-14 h-14 bg-brand-100 rounded-xl flex justify-center items-center text-brand-600 mb-6 shadow-sm">
              <Activity className="w-8 h-8"/>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Risk Prediction</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Our Llama3-powered LLM instantly evaluates your symptoms against thousands of clinical permutations to give you a real-time risk assessment score.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-cyan-50 border border-cyan-100 transition-all hover:-translate-y-1 hover:shadow-xl duration-300">
            <div className="w-14 h-14 bg-cyan-100 rounded-xl flex justify-center items-center text-cyan-600 mb-6 shadow-sm">
              <Stethoscope className="w-8 h-8"/>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Doctor Recommendations</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Matching you with available, specialized doctors who can remotely review your AI-generated lab report in seconds to direct your next steps.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-indigo-50 border border-indigo-100 transition-all hover:-translate-y-1 hover:shadow-xl duration-300">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex justify-center items-center text-indigo-600 mb-6 shadow-sm">
              <ShieldCheck className="w-8 h-8"/>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Secure & Confidential</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Medical-grade encryption ensures your health data remains 100% private between you, the verified doctor, and our secure backend database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
