
import React, { useState, useRef } from 'react';
import Header from './components/Header';
import ColorPalette from './components/ColorPalette';
import ZoneSelector from './components/ZoneSelector';
import BeforeAfterSlider from './components/BeforeAfterSlider';
import { AppState, Zone } from './types';
import { paintRoom } from './services/geminiService';
import { Wand2, RefreshCw, AlertCircle, Camera } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    originalImage: null,
    resultImage: null,
    zoneColors: {
      paredes: null,
      techo: null,
      puertas: null,
    },
    activeZone: 'paredes',
    isProcessing: false,
    error: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setState(prev => ({ 
          ...prev, 
          originalImage: e.target?.result as string, 
          resultImage: null,
          error: null 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorSelection = (hex: string) => {
    setState(prev => ({
      ...prev,
      zoneColors: {
        ...prev.zoneColors,
        [prev.activeZone]: hex
      }
    }));
  };

  const toggleZoneSelection = (zone: Zone) => {
    setState(prev => {
      const isEnabling = prev.zoneColors[zone] === null;
      return {
        ...prev,
        // Si estem activant, la fem la zona activa per defecte
        activeZone: isEnabling ? zone : prev.activeZone,
        zoneColors: {
          ...prev.zoneColors,
          [zone]: isEnabling ? '#FFFFFF' : null
        }
      };
    });
  };

  const handlePaint = async () => {
    const currentImg = state.originalImage;
    if (!currentImg) return;
    
    const activeColors: Partial<Record<Zone, string>> = {};
    (Object.entries(state.zoneColors) as [Zone, string | null][]).forEach(([zone, color]) => {
      if (color) activeColors[zone] = color;
    });

    if (Object.keys(activeColors).length === 0) {
      setState(prev => ({ ...prev, error: "Selecciona almenys una zona i un color per començar el disseny." }));
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const paintedImage = await paintRoom(currentImg, activeColors);
      setState(prev => ({ ...prev, resultImage: paintedImage, isProcessing: false }));
      
      setTimeout(() => {
        const resultEl = document.getElementById('result-preview');
        if (resultEl) {
          resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        error: err.message || "S'ha produït un error en el disseny. Torna-ho a provar en uns segons."
      }));
    }
  };

  const resetApp = () => {
    setState({
      originalImage: null,
      resultImage: null,
      zoneColors: { paredes: null, techo: null, puertas: null },
      activeZone: 'paredes',
      isProcessing: false,
      error: null,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const currentSelectedColor = state.zoneColors[state.activeZone] || '#FFFFFF';

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-[#B2FFFF] shadow-2xl border-x border-white/20">
      <Header />

      <main className="flex-grow flex flex-col pb-24 overflow-x-hidden">
        <section className="p-4 flex flex-col items-center">
          {!state.originalImage ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full min-h-[350px] border-4 border-dashed border-[#3db7b3]/30 rounded-[3rem] flex flex-col items-center justify-center bg-white/40 cursor-pointer hover:bg-white/60 transition-all group px-6 text-center backdrop-blur-sm mt-4"
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                <Camera className="text-[#3db7b3] w-10 h-10" />
              </div>
              <p className="text-gray-800 font-black text-xl leading-tight">Puja una foto del teu espai</p>
              <p className="text-[#3db7b3] text-sm mt-3 font-bold uppercase tracking-widest opacity-60">Toca per seleccionar</p>
            </div>
          ) : (
            <div className="w-full relative animate-in fade-in zoom-in-95 duration-500">
              <img 
                src={state.originalImage} 
                alt="Original" 
                className="w-full h-auto rounded-[2.5rem] shadow-2xl border-4 border-white block" 
              />
              <button 
                onClick={resetApp}
                className="absolute top-4 right-4 bg-white/95 p-3 rounded-full shadow-lg text-gray-600 hover:text-[#3db7b3] transition-all active:scale-90"
                aria-label="Reiniciar"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        </section>

        {state.originalImage && (
          <div className="animate-in slide-in-from-bottom-6 duration-500">
            <section className="mt-2 space-y-4">
              <div className="px-4">
                <p className="text-[10px] font-black text-cyan-800/60 mb-3 px-2 uppercase tracking-[0.2em] text-center">1. Selecciona la zona a personalitzar</p>
                <ZoneSelector 
                    zoneColors={state.zoneColors}
                    activeZone={state.activeZone}
                    onSelectZone={(zone) => setState(prev => ({ ...prev, activeZone: zone }))}
                    onToggleZone={toggleZoneSelection}
                  />
              </div>

              <div className="bg-white/30 py-6 backdrop-blur-md border-y border-white/20">
                <ColorPalette 
                  selectedColor={currentSelectedColor} 
                  onSelectColor={handleColorSelection} 
                />
              </div>
              
              <div className="px-4 pb-4">
                <button
                  onClick={handlePaint}
                  disabled={state.isProcessing}
                  className={`w-full py-6 rounded-[2rem] flex items-center justify-center gap-4 font-black text-2xl shadow-xl transition-all transform active:scale-95 ${
                    state.isProcessing
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-[#3db7b3] text-white hover:bg-[#34a09c]'
                  }`}
                >
                  {state.isProcessing ? (
                    <>
                      <RefreshCw className="animate-spin" />
                      <span className="animate-pulse">SARA està dissenyant...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-7 h-7" />
                      <span>Generar Visualització</span>
                    </>
                  )}
                </button>
              </div>
            </section>

            {state.resultImage && (
              <section id="result-preview" className="p-4 mt-8 animate-in zoom-in-95 duration-700">
                <div className="flex flex-col items-center mb-8">
                  <h3 className="text-3xl font-black text-gray-800 text-center leading-none">Resultat Professional</h3>
                  <p className="text-cyan-800/60 text-[10px] mt-2 font-black uppercase tracking-[0.3em]">Llisca per comparar l'abans i el després</p>
                </div>
                
                <BeforeAfterSlider before={state.originalImage} after={state.resultImage} />
                
                <div className="mt-10 flex flex-col gap-4 items-center">
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = state.resultImage!;
                      link.download = 'disseny-SARA-ia.png';
                      link.click();
                    }}
                    className="w-full bg-gray-900 text-white font-black py-6 rounded-[1.5rem] shadow-2xl active:scale-95 transition-all text-xl"
                  >
                    Descarregar Disseny
                  </button>
                  <button 
                    onClick={resetApp}
                    className="flex items-center gap-2 text-[#3db7b3] font-black py-4 rounded-xl hover:underline transition-colors uppercase text-[10px] tracking-[0.2em]"
                  >
                    <RefreshCw size={14} />
                    Començar un projecte nou
                  </button>
                </div>
              </section>
            )}

            {state.error && (
              <div className="mx-4 mt-6 p-5 bg-red-50/90 backdrop-blur-sm border-2 border-red-100 rounded-[2rem] flex items-start gap-4 text-red-700 animate-in shake duration-500 shadow-sm">
                <AlertCircle className="flex-shrink-0 w-6 h-6" />
                <p className="text-sm font-bold leading-tight">{state.error}</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-12 px-4 text-center border-t border-white/20 bg-white/10 backdrop-blur-md">
        <p className="text-cyan-900/40 text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2">
          By Eullin AI <span className="text-red-500 animate-pulse">❤️</span> 2026
        </p>
        <p className="text-[9px] text-cyan-900/30 mt-2 font-medium">Intel·ligència Artificial al servei del disseny</p>
      </footer>
    </div>
  );
};

export default App;
