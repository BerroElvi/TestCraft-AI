import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Send, FileDown, CheckSquare, Square, Loader2, Plane, Hotel, Briefcase, 
  Users, Map, Ship, Mountain, Bus, History, Sparkles, ChevronDown, 
  ChevronUp, Activity, PlayCircle, Cpu, Code2, Terminal, Plus, Paperclip, CheckCircle2, Table,
  FileText, FileSpreadsheet, File as FileWord
} from 'lucide-react';

// Librerías necesarias para exportación local
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; // CAMBIO: Importación directa para evitar errores de registro

const API_URL = 'http://localhost:4000/api/tests';
const AUTO_API_URL = 'http://localhost:4000/api/automation';

const SERVICES = [
  { id: 'aereos', name: 'Aéreos', icon: Plane },
  { id: 'hoteles', name: 'Hoteles', icon: Hotel },
  { id: 'paquetes', name: 'Paquetes', icon: Briefcase },
  { id: 'paquetes_v2', name: 'Paquetes V2', icon: Briefcase },
  { id: 'circuitos', name: 'Circuitos', icon: Map },
  { id: 'cruceros', name: 'Cruceros', icon: Ship },
  { id: 'excursiones', name: 'Excursiones', icon: Mountain },
  { id: 'traslados', name: 'Traslados', icon: Bus },
];

function App() {
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeService, setActiveService] = useState('aereos');
  const [currentView, setCurrentView] = useState('generator');
  const [expandedId, setExpandedId] = useState(null);
  const [selectedTests, setSelectedTests] = useState([]);
  const [selectedSteps, setSelectedSteps] = useState([]);

  const [gherkinScript, setGherkinScript] = useState('Feature: Reserva de Vuelo...');
  const [objectRepo, setObjectRepo] = useState([]);
  const [newElement, setNewElement] = useState({ name: '', selector: '', type: 'id' });
  const [execLog, setExecLog] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    fetchHistory();
    fetchObjectRepo();
  }, [activeService]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/service/${activeService}`);
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (error) { 
      setHistory([]); 
    }
  };

  const handleExport = (format) => {
    const dataToExport = [];
    
    history.filter(t => selectedTests.includes(t.id)).forEach(test => {
        test.steps.forEach((step, idx) => {
            dataToExport.push({
                Test: test.title,
                Critica: test.criticality || 'Media',
                Paso_Num: idx + 1,
                Accion: step.action,
                Resultado_Esperado: step.expected,
                Estado: step.status || 'Pendiente'
            });
        });
    });

    selectedSteps.forEach(key => {
        const [testId, stepIdx] = key.split('-');
        if (!selectedTests.includes(parseInt(testId))) {
            const parentTest = history.find(t => t.id === parseInt(testId));
            const step = parentTest?.steps[stepIdx];
            if (step) {
                dataToExport.push({
                    Test: `(Paso Suelto) ${parentTest.title}`,
                    Critica: parentTest.criticality || 'Media',
                    Paso_Num: parseInt(stepIdx) + 1,
                    Accion: step.action,
                    Resultado_Esperado: step.expected,
                    Estado: step.status || 'Pendiente'
                });
            }
        }
    });

    if (dataToExport.length === 0) {
      alert("Selecciona al menos un Test o un Paso para exportar.");
      return;
    }

    const fileName = `QA_Report_${activeService}_${new Date().getTime()}`;

    if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "QA_Results");
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    } 
    
    else if (format === 'pdf') {
      try {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Reporte de Pruebas - ${activeService.toUpperCase()}`, 14, 20);
        
        const headers = [["Test", "#", "Acción", "Esperado", "Estado"]];
        const body = dataToExport.map(d => [d.Test, d.Paso_Num, d.Accion, d.Resultado_Esperado, d.Estado]);
        
        // CAMBIO: Uso de la función autoTable importada directamente
        autoTable(doc, {
          head: headers,
          body: body,
          startY: 30,
          theme: 'striped',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [0, 40, 85] }
        });
        
        doc.save(`${fileName}.pdf`);
      } catch (err) {
        console.error("Error al generar PDF:", err);
        alert("Error generando PDF. Asegúrate de tener instalado jspdf-autotable.");
      }
    } 
    
    else if (format === 'word') {
      const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>";
      const footer = "</body></html>";
      let table = `<h1>Reporte QA: ${activeService}</h1><table border='1' style='border-collapse: collapse;'><tr><th>Test</th><th>Paso</th><th>Acción</th><th>Esperado</th><th>Estado</th></tr>`;
      
      dataToExport.forEach(d => {
        table += `<tr><td>${d.Test}</td><td>${d.Paso_Num}</td><td>${d.Accion}</td><td>${d.Resultado_Esperado}</td><td>${d.Estado}</td></tr>`;
      });
      table += "</table>";

      const source = header + table + footer;
      const blob = new Blob(['\ufeff', source], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.doc`;
      link.click();
    }
  };

  const updateStepStatus = async (testId, stepIdx, newStatus) => {
    const updatedHistory = history.map(test => {
      if (test.id === testId) {
        const newSteps = [...test.steps];
        newSteps[stepIdx] = { ...newSteps[stepIdx], status: newStatus };
        return { ...test, steps: newSteps };
      }
      return test;
    });
    setHistory(updatedHistory);
    try {
      const targetTest = updatedHistory.find(t => t.id === testId);
      await axios.patch(`${API_URL}/${testId}`, { steps: targetTest.steps });
    } catch (error) {
      console.error("Error al guardar estado del paso");
    }
  };

  const toggleStepSelection = (testId, stepIdx) => {
    const stepKey = `${testId}-${stepIdx}`;
    setSelectedSteps(prev => 
      prev.includes(stepKey) ? prev.filter(k => k !== stepKey) : [...prev, stepKey]
    );
  };

  const handleCreateTest = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post(API_URL, { prompt, service: activeService });
      if (response.data.history) setHistory(response.data.history);
      else fetchHistory();
      setPrompt('');
    } catch (error) {
      alert("Error al conectar con el servidor de IA");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedTests(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const updateExecutionStatus = async (id, newStatus) => {
    try {
      await axios.patch(`${API_URL}/${id}`, { executionStatus: newStatus });
      setHistory(prev => prev.map(t => t.id === id ? { ...t, executionStatus: newStatus } : t));
    } catch (error) {
      console.error("Error actualizando estado");
    }
  };

  const handleUploadEvidence = async (id) => {
    const url = window.prompt("Introduce la URL de la evidencia (Jira, Drive, Screenshot):");
    if (url) {
      try {
        await axios.patch(`${API_URL}/${id}`, { evidence_url: url });
        fetchHistory();
      } catch (error) {
        console.error("Error guardando evidencia");
      }
    }
  };

  const fetchObjectRepo = async () => {
    try {
      const response = await fetch(`${AUTO_API_URL}/elements/${activeService}`);
      const data = await response.json();
      setObjectRepo(Array.isArray(data) ? data : []);
    } catch (error) { setObjectRepo([]); }
  };

  const saveElementToDB = async () => {
    if (!newElement.name || !newElement.selector) return;
    try {
      const response = await fetch(`${AUTO_API_URL}/elements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newElement, service: activeService }),
      });
      if (response.ok) {
        const saved = await response.json();
        setObjectRepo(prev => [...prev, saved]);
        setNewElement({ name: '', selector: '', type: 'id' });
      }
    } catch (error) { console.error("Error guardando elemento:", error); }
  };

  const runAutomation = async () => {
    setIsExecuting(true);
    setExecLog(["🚀 Iniciando motor Playwright...", "📡 Consultando Object Repo..."]);
    try {
      const response = await fetch(`${AUTO_API_URL}/execute-gherkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gherkin: gherkinScript, service: activeService }),
      });
      const result = await response.json();
      setExecLog(prev => [...prev, "✅ Ejecución completada.", result.log || ""]);
    } catch (error) { 
      setExecLog(prev => [...prev, "❌ Error de conexión con el motor."]); 
    } finally { setIsExecuting(false); }
  };

  return (
    <div className="flex min-h-screen bg-[#F4F7F9] font-sans text-gray-800">
      <aside className="w-72 bg-[#002855] text-white flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/10 text-center">
          <h1 className="font-black text-xl italic uppercase tracking-tighter">TestCraft<span className="text-[#00AEEF]"> AI</span></h1>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {SERVICES.map(s => (
            <button key={s.id} onClick={() => setActiveService(s.id)}
              className={`w-full px-6 py-4 transition-all border-l-4 flex items-center gap-4 ${activeService === s.id ? 'bg-white/10 border-[#00AEEF]' : 'hover:bg-white/5 border-transparent'}`}>
              <s.icon size={20} className={activeService === s.id ? 'text-[#00AEEF]' : 'text-white/30'} />
              <span className={`text-sm font-bold uppercase tracking-wider ${activeService === s.id ? 'text-white' : 'text-white/50'}`}>{s.name}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-2">
            <button onClick={() => setCurrentView('generator')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${currentView === 'generator' ? 'bg-[#00AEEF]' : 'hover:bg-white/5'}`}><Sparkles size={18}/> Generador</button>
            <button onClick={() => setCurrentView('automation')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${currentView === 'automation' ? 'bg-[#00AEEF]' : 'hover:bg-white/5'}`}><Cpu size={18}/> Automation Studio</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b flex items-center justify-between px-8 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl text-[#002855]"><Activity size={24}/></div>
                <div>
                    <h2 className="text-lg font-bold text-[#002855]">Módulo: {activeService?.toUpperCase()}</h2>
                    <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">QA Automation Dashboard</p>
                </div>
            </div>
            <img src="https://www.ola.com.ar/Static/Images/logo-ola.png" alt="Ola" className="h-8 opacity-80" />
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {currentView === 'generator' ? (
            <div className="max-w-5xl mx-auto">
              
              {(selectedTests.length > 0 || selectedSteps.length > 0) && (
                <div className="bg-[#002855] text-white p-4 rounded-2xl mb-6 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-300 shadow-lg border-b-4 border-[#00AEEF]">
                  <div className="flex items-center gap-4 ml-4">
                    <span className="bg-[#00AEEF] px-3 py-1 rounded-full font-bold text-sm text-white">
                        {selectedTests.length} Tests | {selectedSteps.length} Pasos
                    </span>
                    <p className="font-bold tracking-wide text-sm text-white/90 hidden md:block">Exportar selección en:</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={() => handleExport('excel')} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md">
                      <FileSpreadsheet size={16}/> EXCEL
                    </button>
                    <button onClick={() => handleExport('pdf')} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md">
                      <FileText size={16}/> PDF
                    </button>
                    <button onClick={() => handleExport('word')} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md">
                      <FileWord size={16}/> WORD
                    </button>
                    <div className="w-[1px] bg-white/20 mx-2"></div>
                    <button onClick={() => {setSelectedTests([]); setSelectedSteps([]);}} className="text-white/60 hover:text-white text-sm font-bold px-4 transition-colors">Cancelar</button>
                  </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-3xl shadow-xl border border-blue-100 mb-8">
                <div className="flex gap-4">
                  <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ej: Validar proceso de reserva..." className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 focus:border-[#00AEEF] outline-none transition-all font-medium" />
                  <button onClick={handleCreateTest} disabled={loading} className="bg-[#002855] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-blue-900/20 disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />} 
                    {loading ? 'Generando...' : 'Crear Test'}
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-bold text-gray-400 uppercase text-xs tracking-widest"><History size={14}/> Historial de Control de Calidad</h3>
                  
                  {history.length > 0 ? history.map(test => (
                    <div key={test.id} className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden ${selectedTests.includes(test.id) ? 'border-[#00AEEF] ring-4 ring-blue-50' : 'border-gray-100'}`}>
                      <div className="p-4 flex items-center gap-4">
                        <button onClick={() => toggleSelect(test.id)} className={`transition-all ${selectedTests.includes(test.id) ? 'text-[#00AEEF]' : 'text-gray-300 hover:text-gray-400'}`}>
                          {selectedTests.includes(test.id) ? <CheckSquare size={22}/> : <Square size={22}/>}
                        </button>

                        <div className="flex-1 cursor-pointer" onClick={() => setExpandedId(expandedId === test.id ? null : test.id)}>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-[#002855] text-base">{test.title || 'Test sin título'}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${test.criticality === 'Alta' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                              {test.criticality || 'Media'}
                            </span>
                          </div>

                          <div className="flex gap-4 mt-2 items-center">
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <select value={test.executionStatus || 'Por ejecutar'} onChange={(e) => updateExecutionStatus(test.id, e.target.value)} className="text-[11px] font-bold border-2 border-gray-100 bg-gray-50 rounded-lg pl-2 pr-8 py-1.5 outline-none text-gray-600 focus:border-[#00AEEF] appearance-none cursor-pointer">
                                <option value="Por ejecutar">⚪ Por ejecutar</option>
                                <option value="Ejecutando">🔵 Ejecutando</option>
                                <option value="Finalizado">🟢 Finalizado</option>
                                <option value="Bloqueado">🔴 Bloqueado</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
                            </div>
                            {test.evidence_url && (
                              <a href={test.evidence_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-[#00AEEF] font-bold hover:underline bg-blue-50 px-2 py-1 rounded-md" onClick={e => e.stopPropagation()}>
                                <CheckCircle2 size={12}/> Evidencia
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); handleUploadEvidence(test.id); }} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                            <Plus size={22}/>
                          </button>
                          <button onClick={(e) => { 
                            e.stopPropagation();
                            setGherkinScript(`Feature: ${test.title}\n\nScenario: Manual to Auto\n${test.steps?.map(s => `    Given ${s.action}`).join('\n')}`); 
                            setCurrentView('automation'); 
                          }} className="text-[#00AEEF] hover:bg-blue-50 px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm font-bold border border-blue-50">
                            <PlayCircle size={18}/> Auto
                          </button>
                        </div>
                      </div>

                      {expandedId === test.id && (
                        <div className="px-14 pb-6 pt-2 bg-gray-50/50 border-t border-gray-50 animate-in slide-in-from-top-2 duration-200">
                          <div className="space-y-3 mt-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Escenarios QA Individuales</h4>
                            {test.steps?.map((step, idx) => {
                              const stepKey = `${test.id}-${idx}`;
                              const isStepSelected = selectedSteps.includes(stepKey);
                              return (
                                <div key={idx} className={`flex items-center gap-4 bg-white p-3 rounded-xl border transition-all ${isStepSelected ? 'border-[#00AEEF] bg-blue-50/30' : 'border-gray-100'}`}>
                                  <button onClick={() => toggleStepSelection(test.id, idx)} className={`transition-all ${isStepSelected ? 'text-[#00AEEF]' : 'text-gray-300 hover:text-gray-400'}`}>
                                    {isStepSelected ? <CheckSquare size={18}/> : <Square size={18}/>}
                                  </button>
                                  <span className="font-bold text-[#00AEEF] text-xs">{idx + 1}.</span>
                                  <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-700 leading-tight">{step.action}</p>
                                    <p className="text-xs text-gray-500 mt-1 italic font-medium">Esperado: {step.expected}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <select value={step.status || 'Pendiente'} onChange={(e) => updateStepStatus(test.id, idx, e.target.value)} className="text-[10px] font-bold border-2 border-gray-100 bg-gray-50 rounded-lg pl-2 pr-7 py-1.5 outline-none focus:border-[#00AEEF] appearance-none cursor-pointer text-gray-600">
                                        <option value="Pendiente">⚪ Pendiente</option>
                                        <option value="Pasó">🟢 Pasó</option>
                                        <option value="Falló">🔴 Falló</option>
                                        <option value="Bloqueado">🟠 Bloqueado</option>
                                      </select>
                                      <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
                                    </div>
                                    <label className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-[#00AEEF] rounded-lg cursor-pointer transition-colors border border-dashed border-gray-200">
                                      <Paperclip size={16} />
                                      <input type="file" className="hidden" onChange={(e) => { if(e.target.files[0]) alert(`Archivo "${e.target.files[0].name}" para el paso ${idx + 1}`); }} />
                                    </label>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="text-center py-20 text-gray-400 font-medium italic border-2 border-dashed border-gray-200 rounded-[40px]">
                      No hay casos generados en {activeService}.
                    </div>
                  )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-8 h-full">
               <div className="col-span-4 flex flex-col gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-blue-50">
                  <h3 className="font-bold text-[#002855] mb-4 flex items-center gap-2"><Table size={18}/> Object Repository</h3>
                  <div className="space-y-3 mb-6">
                    <input value={newElement.name} onChange={e => setNewElement({...newElement, name: e.target.value})} placeholder="Nombre" className="w-full p-3 bg-gray-50 rounded-xl border text-sm outline-none focus:border-[#00AEEF]" />
                    <input value={newElement.selector} onChange={e => setNewElement({...newElement, selector: e.target.value})} placeholder="Selector" className="w-full p-3 bg-gray-50 rounded-xl border text-sm outline-none focus:border-[#00AEEF]" />
                    <button onClick={saveElementToDB} className="w-full bg-[#00AEEF] text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#0096ce] transition-colors"><Plus size={18}/> Add Element</button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {objectRepo?.map((el, idx) => (
                      <div key={el.id || idx} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-[#002855]">{el.name}</span>
                        <code className="text-[10px] bg-white px-2 py-1 rounded border text-blue-600 font-mono">{el.selector}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-span-8 flex flex-col gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-blue-50 flex-1 flex flex-col min-h-[400px]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-[#002855] flex items-center gap-2"><Code2 size={18}/> Automation Editor</h3>
                    <button onClick={runAutomation} disabled={isExecuting} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50">
                      {isExecuting ? <Loader2 className="animate-spin" size={18}/> : <PlayCircle size={18}/>} Ejecutar
                    </button>
                  </div>
                  <textarea value={gherkinScript} onChange={e => setGherkinScript(e.target.value)} className="flex-1 w-full p-6 bg-[#001529] text-green-400 font-mono text-sm rounded-2xl outline-none border-4 border-gray-800 shadow-inner leading-relaxed resize-none" spellCheck="false" />
                </div>
                <div className="h-48 bg-black rounded-3xl p-6 font-mono text-xs text-gray-400 overflow-y-auto border-t-4 border-[#00AEEF] shadow-2xl">
                    <div className="flex items-center gap-2 text-[#00AEEF] mb-2 font-bold uppercase tracking-widest"><Terminal size={14}/> System_Output:</div>
                    {execLog?.map((log, i) => <div key={i} className="mb-1 leading-relaxed border-l border-white/10 pl-2 text-gray-300 font-medium tracking-tight whitespace-pre-wrap">{`> ${log}`}</div>)}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;