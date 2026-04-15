import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Send, FileDown, CheckSquare, Square, Loader2, Plane, Hotel, Briefcase, 
  Users, Map, Ship, Mountain, Bus, History, Sparkles, ChevronDown, 
  ChevronUp, Trash2, Edit3, MousePointer2, Info, Activity, Bug, ExternalLink, Image as ImageIcon
} from 'lucide-react';

const API_URL = 'http://localhost:3000/tests';

const SERVICES = [
  { id: 'aereos', name: 'Aéreos', icon: Plane },
  { id: 'hoteles', name: 'Hoteles', icon: Hotel },
  { id: 'paquetes', name: 'Paquetes', icon: Briefcase },
  { id: 'grupales', name: 'Grupales', icon: Users },
  { id: 'circuitos', name: 'Circuitos', icon: Map },
  { id: 'cruceros', name: 'Cruceros', icon: Ship },
  { id: 'excursiones', name: 'Excursiones', icon: Mountain },
  { id: 'traslados', name: 'Traslados', icon: Bus },
];

const STATES = {
  PENDING: { label: 'Por Ejecutar', color: 'bg-gray-100 text-gray-500' },
  RUNNING: { label: 'Ejecutando', color: 'bg-blue-100 text-blue-600' },
  BLOCKED: { label: 'Bloqueado', color: 'bg-orange-100 text-orange-600' },
  BUG: { label: 'Bug', color: 'bg-red-100 text-red-600' },
  PASS: { label: 'Pass', color: 'bg-green-100 text-green-600' }
};

const LOGO_OLA = "https://www.ola.com.ar/Static/Images/logo-ola.png";

function App() {
  const [prompt, setPrompt] = useState('');
  const [newTests, setNewTests] = useState([]); 
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedExportCases, setSelectedExportCases] = useState({}); 
  const [activeService, setActiveService] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (activeService) {
      setNewTests([]); 
      setSelectedExportCases({});
      setExpandedId(null);
      fetchHistory();
    }
  }, [activeService]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(API_URL);
      setHistory(res.data.filter(t => t.service === activeService));
    } catch (error) { console.error("Error historial:", error); }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !activeService) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/generate`, { prompt, service: activeService });
      const nextId = newTests.length + 1;
      const initializedSteps = res.data.latest.steps.map(s => ({
        ...s,
        status: 'PENDING',
        evidence: '',
        bugLink: ''
      }));
      const newCase = { ...res.data.latest, steps: initializedSteps, visualId: nextId };
      setNewTests(prev => [newCase, ...prev]);
      setHistory(res.data.history);
      setPrompt('');
      setExpandedId(`new-${nextId}`);
    } catch (error) { alert("Error en generación"); }
    finally { setLoading(false); }
  };

  // --- LÓGICA DE PROGRESO ---
  const calculateProgress = (steps) => {
    if (!steps || steps.length === 0) return { executed: 0, pending: 100 };
    const executedCount = steps.filter(s => s.status && s.status !== 'PENDING').length;
    const executedPct = Math.round((executedCount / steps.length) * 100);
    return { executed: executedPct, pending: 100 - executedPct };
  };

  // --- ACTUALIZACIÓN DE ESTADOS ---
  const updateExecution = (testKey, idx, updates, isHistory = false) => {
    if (isHistory) {
      setHistory(prev => prev.map(h => {
        if (h.id === testKey) {
          const newSteps = [...h.steps];
          newSteps[idx] = { ...newSteps[idx], ...updates };
          return { ...h, steps: newSteps };
        }
        return h;
      }));
    } else {
      setNewTests(prev => prev.map(test => {
        if (`new-${test.visualId}` === testKey) {
          const newSteps = [...test.steps];
          newSteps[idx] = { ...newSteps[idx], ...updates };
          return { ...test, steps: newSteps };
        }
        return test;
      }));
    }
  };

  const toggleCaseSelection = (testKey, idx) => {
    setSelectedExportCases(prev => {
      const current = prev[testKey] || [];
      const updated = current.includes(idx) ? current.filter(i => i !== idx) : [...current, idx];
      return { ...prev, [testKey]: updated };
    });
  };

  const toggleFullScenarioSelection = (testKey, steps) => {
    const allIndices = steps.map((_, i) => i);
    setSelectedExportCases(prev => {
      const isAllSelected = (prev[testKey] || []).length === steps.length;
      return { ...prev, [testKey]: isAllSelected ? [] : allIndices };
    });
  };

  return (
    <div className="flex min-h-screen bg-[#F4F7F9] font-sans text-gray-800">
      {/* SIDEBAR LIMPIO (SIN PORCENTAJES) */}
      <aside className="w-72 bg-[#002855] text-white flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/10 text-center">
          <h1 className="font-black text-xl italic uppercase tracking-tighter">TestCraft<span className="text-[#00AEEF]"> AI</span></h1>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {SERVICES.map((s) => (
            <button key={s.id} onClick={() => setActiveService(s.id)}
              className={`w-full px-6 py-4 transition-all border-l-4 flex items-center gap-4 ${activeService === s.id ? 'bg-[#00AEEF] border-white' : 'hover:bg-white/5 border-transparent'}`}>
              <s.icon size={20} className={activeService === s.id ? 'text-white' : 'text-[#00AEEF]'} />
              <span className="text-sm font-bold uppercase tracking-wider">{s.name}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 bg-black/20"><img src={LOGO_OLA} className="h-4 mx-auto opacity-50" alt="Ola Logo" /></div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white h-16 shadow-sm flex items-center justify-between px-8 border-b">
          <div className="flex items-center gap-2">
            <Activity className="text-[#00AEEF]" size={18} />
            <span className="text-[#002855] font-black text-xs uppercase tracking-widest">{activeService || 'Seleccione Módulo'}</span>
          </div>
          <button className="bg-[#28a745] text-white px-5 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg">
            <FileDown size={14} /> EXPORTAR ({Object.values(selectedExportCases).flat().length})
          </button>
        </header>

        <main className="p-8 overflow-y-auto flex-1">
          {activeService ? (
            <div className="max-w-6xl mx-auto space-y-8">
              {/* GENERADOR */}
              <div className="bg-white rounded-2xl shadow-xl p-5 border-t-4 border-[#00AEEF] flex gap-4 items-center">
                <textarea className="flex-1 border-none bg-gray-50 rounded-xl p-4 text-sm outline-none min-h-[90px] resize-none font-medium"
                  placeholder={`¿Qué quieres probar en ${activeService}?`}
                  value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                <button onClick={handleGenerate} disabled={loading} className="bg-[#002855] text-white px-8 py-10 rounded-2xl font-black flex flex-col items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin" /> : <Send size={24} />}
                  <span className="text-[10px] tracking-widest uppercase">{loading ? 'IA...' : 'Generar'}</span>
                </button>
              </div>

              {/* SESIÓN ACTUAL */}
              {newTests.map((test) => {
                const testKey = `new-${test.visualId}`;
                const isExpanded = expandedId === testKey;
                const selCases = selectedExportCases[testKey] || [];
                const metrics = calculateProgress(test.steps);

                return (
                  <div key={testKey} className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-8">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-5">
                          <button onClick={() => toggleFullScenarioSelection(testKey, test.steps)}>
                             {selCases.length === test.steps.length ? <CheckSquare className="text-[#00AEEF]"/> : <Square className="text-gray-300"/>}
                          </button>
                          <div>
                            <h3 className="font-black text-[#002855] text-xl uppercase tracking-tighter">{test.title}</h3>
                            <div className="flex gap-4 mt-1">
                               <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">EJECUTADOS: {metrics.executed}%</span>
                               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PENDIENTES: {metrics.pending}%</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => setExpandedId(isExpanded ? null : testKey)} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
                           {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                        </button>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                        <div className="bg-green-500 h-full transition-all duration-700" style={{ width: `${metrics.executed}%` }}></div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-8 bg-gray-50 grid grid-cols-1 lg:grid-cols-2 gap-6 border-t">
                        {test.steps?.map((step, idx) => (
                          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-transparent hover:border-blue-100 transition-all relative">
                            <button onClick={() => toggleCaseSelection(testKey, idx)} className="absolute top-5 right-5 z-10">
                              {selCases.includes(idx) ? <CheckSquare className="text-[#00AEEF]" size={20}/> : <Square className="text-gray-200" size={20}/>}
                            </button>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center pr-8">
                                <span className="bg-[#002855] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">CASO {idx + 1}</span>
                                <select className={`text-[9px] font-black px-2 py-1 rounded border-none ${STATES[step.status || 'PENDING'].color}`}
                                  value={step.status || 'PENDING'} onChange={(e) => updateExecution(testKey, idx, { status: e.target.value })}>
                                  {Object.entries(STATES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                </select>
                              </div>
                              <p className="text-xs font-bold text-gray-700">{step.action}</p>
                              <div className="bg-green-50 p-3 rounded-xl"><p className="text-[11px] text-gray-600 font-medium">{step.expected}</p></div>
                              <div className="space-y-2 pt-2 border-t border-gray-50">
                                <input className="w-full bg-gray-50 p-2 rounded-lg text-[10px] outline-none font-bold" placeholder="Evidencia (Link/Texto)..." value={step.evidence || ''} onChange={(e) => updateExecution(testKey, idx, { evidence: e.target.value })} />
                                {step.status === 'BUG' && <input className="w-full bg-red-50 p-2 rounded-lg text-[10px] outline-none font-bold text-red-600 border border-red-100" placeholder="JIRA Bug Link..." value={step.bugLink || ''} onChange={(e) => updateExecution(testKey, idx, { bugLink: e.target.value })} />}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* HISTORIAL GENERAL DESPLEGABLE */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="px-8 py-5 bg-gray-50 border-b flex justify-between items-center font-black text-[#002855] text-xs uppercase tracking-widest">
                  <div className="flex items-center gap-2"><History size={16}/> Historial de Pruebas</div>
                </div>
                <div className="divide-y divide-gray-50">
                   {history.map(h => {
                     const isHExpanded = expandedId === h.id;
                     const metrics = calculateProgress(h.steps);
                     const hKey = h.id;
                     const hSelCases = selectedExportCases[hKey] || [];

                     return (
                       <div key={h.id}>
                          <div className="p-6 flex items-center justify-between hover:bg-blue-50/30 cursor-pointer group" onClick={() => setExpandedId(isHExpanded ? null : h.id)}>
                            <div className="flex items-center gap-5">
                               <button onClick={(e) => { e.stopPropagation(); toggleFullScenarioSelection(hKey, h.steps); }}>
                                  {hSelCases.length === h.steps.length ? <CheckSquare className="text-[#00AEEF]"/> : <Square className="text-gray-300"/>}
                               </button>
                               <div>
                                  <h4 className="text-sm font-bold text-[#002855] uppercase tracking-tighter">{h.title}</h4>
                                  <div className="flex gap-4 mt-1">
                                     <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded">EJECUCIÓN: {metrics.executed}%</span>
                                     <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{new Date(h.createdAt).toLocaleDateString()}</span>
                                  </div>
                               </div>
                            </div>
                            <ChevronDown className={`text-gray-300 transition-transform ${isHExpanded ? 'rotate-180' : ''}`} />
                          </div>
                          
                          {isHExpanded && (
                            <div className="p-8 bg-gray-50 grid grid-cols-1 lg:grid-cols-2 gap-6 border-t border-b animate-in fade-in duration-300">
                               {h.steps?.map((step, idx) => (
                                 <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-transparent relative">
                                    <button onClick={() => toggleCaseSelection(hKey, idx)} className="absolute top-5 right-5 z-10">
                                      {hSelCases.includes(idx) ? <CheckSquare className="text-[#00AEEF]" size={20}/> : <Square className="text-gray-200" size={20}/>}
                                    </button>
                                    <div className="space-y-4">
                                       <div className="flex justify-between items-center pr-8">
                                          <span className="bg-[#002855]/10 text-[#002855] text-[9px] font-black px-3 py-1 rounded-full">CASO {idx + 1}</span>
                                          <select className={`text-[9px] font-black px-2 py-1 rounded border-none ${STATES[step.status || 'PENDING'].color}`}
                                            value={step.status || 'PENDING'} onChange={(e) => updateExecution(h.id, idx, { status: e.target.value }, true)}>
                                            {Object.entries(STATES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                          </select>
                                       </div>
                                       <p className="text-xs font-bold text-gray-600">{step.action}</p>
                                       <div className="bg-green-50 p-2 rounded-lg text-[10px] text-gray-500 font-medium italic">{step.expected}</div>
                                       {step.status === 'BUG' && step.bugLink && (
                                         <div className="flex items-center gap-2 text-[9px] font-black text-red-500 bg-red-50 p-2 rounded-lg">
                                           <Bug size={12}/> BUG: <a href={step.bugLink} target="_blank" className="underline truncate">{step.bugLink}</a>
                                         </div>
                                       )}
                                    </div>
                                 </div>
                               ))}
                            </div>
                          )}
                       </div>
                     );
                   })}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-10">
               <MousePointer2 size={100} className="mb-4 animate-bounce" />
               <h2 className="text-2xl font-black text-[#002855] uppercase tracking-widest tracking-[0.2em]">Selecciona un Módulo</h2>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;