import React, { useState, useRef, useEffect } from 'react';
import { Camera, Move, RotateCw, Download, Share2, Home, Users, Calendar, AlertCircle, CheckCircle, Info } from 'lucide-react';

// Zone definitions with NASA-based requirements
const ZONE_TYPES = {
  sleep: { name: 'Sleep Quarters', icon: '🛏', color: '#3B82F6', minArea: 40, category: 'Life Support' },
  hygiene: { name: 'Hygiene', icon: '🚿', color: '#06B6D4', minArea: 10, category: 'Life Support' },
  food: { name: 'Food Prep', icon: '🍽', color: '#10B981', minArea: 10, category: 'Life Support' },
  exercise: { name: 'Exercise', icon: '🏃', color: '#F59E0B', minArea: 8, category: 'Life Support' },
  medical: { name: 'Medical', icon: '💊', color: '#EF4444', minArea: 5, category: 'Operations' },
  maintenance: { name: 'Maintenance', icon: '🔧', color: '#8B5CF6', minArea: 15, category: 'Operations' },
  storage: { name: 'Storage', icon: '📦', color: '#6366F1', minArea: 20, category: 'Operations' },
  environmental: { name: 'Environmental Control', icon: '🌡', color: '#14B8A6', minArea: 12, category: 'Systems' },
  recreation: { name: 'Recreation', icon: '🎮', color: '#EC4899', minArea: 8, category: 'Life Support' },
  command: { name: 'Command Center', icon: '🖥', color: '#0EA5E9', minArea: 10, category: 'Operations' }
};

const DESTINATIONS = [
  { id: 'moon', name: 'Moon', duration: '14-30 days', icon: '🌙' },
  { id: 'mars', name: 'Mars', duration: '500-700 days', icon: '🔴' },
  { id: 'transit', name: 'Transit', duration: '180-300 days', icon: '🚀' }
];

const HABITAT_TYPES = [
  { id: 'metallic', name: 'Metallic (Rigid)', desc: 'Durable, predictable structure' },
  { id: 'inflatable', name: 'Inflatable', desc: 'Lightweight, expandable volume' },
  { id: 'surface', name: 'Surface-Built', desc: 'In-situ construction, radiation shielding' }
];

export default function SpaceHabitatDesigner() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    destination: 'moon',
    crewSize: 4,
    duration: 30,
    habitatType: 'inflatable',
    length: 15,
    diameter: 8,
    floors: 1
  });
  
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [draggedZone, setDraggedZone] = useState(null);
  const canvasRef = useRef(null);

  const totalVolume = Math.PI * Math.pow(config.diameter / 2, 2) * config.length;
  const totalArea = config.length * config.diameter * config.floors * 2.5; // approximate floor area

  const addZone = (type) => {
    const zoneType = ZONE_TYPES[type];
    const newZone = {
      id: Date.now(),
      type,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: Math.sqrt(zoneType.minArea) * 15,
      height: Math.sqrt(zoneType.minArea) * 15,
      floor: 1
    };
    setZones([...zones, newZone]);
  };

  const updateZone = (id, updates) => {
    setZones(zones.map(z => z.id === id ? { ...z, ...updates } : z));
  };

  const deleteZone = (id) => {
    setZones(zones.filter(z => z.id !== id));
    if (selectedZone === id) setSelectedZone(null);
  };

  const calculateZoneArea = (zone) => {
    return (zone.width * zone.height) / 225; // Convert pixels to m²
  };

  const getZoneStatus = (zone) => {
    const area = calculateZoneArea(zone);
    const minArea = ZONE_TYPES[zone.type].minArea;
    if (area >= minArea) return 'ok';
    if (area >= minArea * 0.8) return 'warning';
    return 'error';
  };

  const getTotalAllocated = () => {
    return zones.reduce((sum, zone) => sum + calculateZoneArea(zone), 0);
  };

  const getConstraintsSummary = () => {
    const required = Object.values(ZONE_TYPES).reduce((sum, type) => sum + type.minArea, 0);
    const allocated = getTotalAllocated();
    const missing = Object.keys(ZONE_TYPES).filter(type => 
      !zones.some(z => z.type === type)
    );
    
    return { required, allocated, missing };
  };

  const calculateScore = () => {
    const summary = getConstraintsSummary();
    const coverage = Math.min((zones.length / Object.keys(ZONE_TYPES).length) * 100, 100);
    const efficiency = Math.min((summary.allocated / totalArea) * 100, 100);
    const compliance = zones.filter(z => getZoneStatus(z) === 'ok').length / Math.max(zones.length, 1) * 100;
    
    return Math.round((coverage * 0.4 + efficiency * 0.3 + compliance * 0.3));
  };

  const handleMouseDown = (e, zone) => {
    if (e.target.classList.contains('resize-handle')) return;
    setSelectedZone(zone.id);
    setDraggedZone({ zone, offsetX: e.clientX - zone.x, offsetY: e.clientY - zone.y });
  };

  const handleMouseMove = (e) => {
    if (!draggedZone) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left - draggedZone.offsetX, rect.width - draggedZone.zone.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top - draggedZone.offsetY, rect.height - draggedZone.zone.height));
    updateZone(draggedZone.zone.id, { x, y });
  };

  const handleMouseUp = () => {
    setDraggedZone(null);
  };

  useEffect(() => {
    if (draggedZone) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedZone]);

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">NASA Space Habitat Designer</h1>
            <p className="text-blue-300 text-lg">Design sustainable living spaces for space exploration</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-blue-500/30">
            <h2 className="text-2xl font-bold mb-6">Mission Parameters</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Destination</label>
                <div className="grid grid-cols-3 gap-4">
                  {DESTINATIONS.map(dest => (
                    <button
                      key={dest.id}
                      onClick={() => setConfig({ ...config, destination: dest.id })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        config.destination === dest.id
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-slate-600 hover:border-blue-400'
                      }`}
                    >
                      <div className="text-4xl mb-2">{dest.icon}</div>
                      <div className="font-bold">{dest.name}</div>
                      <div className="text-xs text-slate-400">{dest.duration}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Crew Size: {config.crewSize} astronauts
                </label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={config.crewSize}
                  onChange={(e) => setConfig({ ...config, crewSize: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Mission Duration: {config.duration} days
                </label>
                <input
                  type="range"
                  min="7"
                  max="700"
                  value={config.duration}
                  onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Habitat Type</label>
                <div className="space-y-2">
                  {HABITAT_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setConfig({ ...config, habitatType: type.id })}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        config.habitatType === type.id
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-slate-600 hover:border-blue-400'
                      }`}
                    >
                      <div className="font-bold">{type.name}</div>
                      <div className="text-sm text-slate-400">{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Length (m)</label>
                  <input
                    type="number"
                    value={config.length}
                    onChange={(e) => setConfig({ ...config, length: parseFloat(e.target.value) })}
                    className="w-full bg-slate-700 rounded px-3 py-2"
                    min="5"
                    max="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Diameter (m)</label>
                  <input
                    type="number"
                    value={config.diameter}
                    onChange={(e) => setConfig({ ...config, diameter: parseFloat(e.target.value) })}
                    className="w-full bg-slate-700 rounded px-3 py-2"
                    min="3"
                    max="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Floors</label>
                  <input
                    type="number"
                    value={config.floors}
                    onChange={(e) => setConfig({ ...config, floors: parseInt(e.target.value) })}
                    className="w-full bg-slate-700 rounded px-3 py-2"
                    min="1"
                    max="3"
                  />
                </div>
              </div>

              <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={20} />
                  <span className="font-bold">Habitat Capacity</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>Total Volume: {totalVolume.toFixed(1)} m³</div>
                  <div>Floor Area: {totalArea.toFixed(1)} m²</div>
                  <div>Volume per Crew: {(totalVolume / config.crewSize).toFixed(1)} m³</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold text-lg transition-colors"
            >
              Continue to Layout Design →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const summary = getConstraintsSummary();
  const score = calculateScore();

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">NASA Habitat Designer</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1"><Users size={16}/> {config.crewSize}</span>
            <span className="flex items-center gap-1"><Calendar size={16}/> {config.duration}d</span>
            <span className="flex items-center gap-1"><Home size={16}/> {config.destination}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setStep(1)} className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600">
            ← Back
          </button>
          <button className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Download size={16}/> Export
          </button>
          <button className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2">
            <Share2 size={16}/> Share
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-80 bg-slate-800 border-r border-slate-700 overflow-y-auto p-4">
          <h3 className="font-bold mb-4 text-lg">Functional Zones</h3>
          
          <div className="space-y-4">
            {Object.entries(ZONE_TYPES).map(([type, info]) => {
              const existing = zones.filter(z => z.type === type);
              const totalArea = existing.reduce((sum, z) => sum + calculateZoneArea(z), 0);
              const status = totalArea >= info.minArea ? 'ok' : existing.length > 0 ? 'warning' : 'error';
              
              return (
                <div key={type} className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{info.icon}</span>
                      <span className="font-medium text-sm">{info.name}</span>
                    </div>
                    {status === 'ok' && <CheckCircle size={16} className="text-green-400"/>}
                    {status === 'warning' && <AlertCircle size={16} className="text-yellow-400"/>}
                    {status === 'error' && <AlertCircle size={16} className="text-red-400"/>}
                  </div>
                  <div className="text-xs text-slate-400 mb-2">
                    {totalArea.toFixed(1)} m² / {info.minArea} m² required
                  </div>
                  <button
                    onClick={() => addZone(type)}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                  >
                    Add Zone
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-slate-950">
          <div 
            ref={canvasRef}
            className="absolute inset-0 overflow-hidden"
            style={{ 
              backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            {/* Habitat outline */}
            <div 
              className="absolute border-4 border-blue-500/30 rounded-lg"
              style={{
                left: '50px',
                top: '50px',
                width: `${config.length * 30}px`,
                height: `${config.diameter * 30}px`
              }}
            />


            {/* Zones */}
            {zones.map(zone => {
              const zoneType = ZONE_TYPES[zone.type];
              const status = getZoneStatus(zone);
              const isSelected = selectedZone === zone.id;
              
              return (
                <div
                  key={zone.id}
                  className={`absolute rounded-lg cursor-move transition-all ${
                    isSelected ? 'ring-4 ring-white z-10' : ''
                  }`}
                  style={{
                    left: zone.x,
                    top: zone.y,
                    width: zone.width,
                    height: zone.height,
                    backgroundColor: zoneType.color + '40',
                    border: `3px solid ${
                      status === 'ok' ? '#10B981' :
                      status === 'warning' ? '#F59E0B' : '#EF4444'
                    }`
                  }}
                  onMouseDown={(e) => handleMouseDown(e, zone)}
                >
                  <div className="p-2 text-xs font-bold flex flex-col h-full justify-between">
                    <div className="flex items-center justify-between">
                      <span>{zoneType.icon}</span>
                      <button
                        onClick={() => deleteZone(zone.id)}
                        className="bg-red-500 hover:bg-red-600 rounded px-2 py-0.5 text-white"
                      >
                        ×
                      </button>
                    </div>
                    <div>
                      <div>{zoneType.name}</div>
                      <div className="text-slate-300">{calculateZoneArea(zone).toFixed(1)} m²</div>
                    </div>
                  </div>
                  
                  {/* Resize handle */}
                  <div
                    className="resize-handle absolute bottom-0 right-0 w-4 h-4 bg-white rounded-tl cursor-se-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startWidth = zone.width;
                      const startHeight = zone.height;
                      
                      const handleResize = (e) => {
                        updateZone(zone.id, {
                          width: Math.max(50, startWidth + (e.clientX - startX)),
                          height: Math.max(50, startHeight + (e.clientY - startY))
                        });
                      };
                      
                      const stopResize = () => {
                        window.removeEventListener('mousemove', handleResize);
                        window.removeEventListener('mouseup', stopResize);
                      };
                      
                      window.addEventListener('mousemove', handleResize);
                      window.addEventListener('mouseup', stopResize);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 bg-slate-800 border-l border-slate-700 overflow-y-auto p-4">
          <h3 className="font-bold mb-4 text-lg">Mission Status</h3>
          
          {/* Score */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 mb-4 text-center">
            <div className="text-5xl font-bold mb-2">{score}</div>
            <div className="text-sm opacity-90">Mission Success Score</div>
            <div className="mt-3 flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-2xl">{i < Math.floor(score / 20) ? '★' : '☆'}</span>
              ))}
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-3">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Space Allocation</div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">{summary.allocated.toFixed(0)}</span>
                <span className="text-slate-400">/ {totalArea.toFixed(0)} m²</span>
              </div>
              <div className="mt-2 h-2 bg-slate-600 rounded-full overflow-hidden">
                <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${Math.min((summary.allocated / totalArea) * 100, 100)}%` }}
              />
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Zone Coverage</div>
              <div className="text-2xl font-bold mb-2">
                {zones.length} / {Object.keys(ZONE_TYPES).length} zones
              </div>
              {summary.missing.length > 0 && (
                <div className="text-xs text-red-400">
                  Missing: {summary.missing.map(t => ZONE_TYPES[t].name).join(', ')}
                </div>
              )}
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Crew Comfort</div>
              <div className="text-2xl font-bold">
                {(summary.allocated / config.crewSize).toFixed(1)} m²
              </div>
              <div className="text-xs text-slate-400">per astronaut</div>
            </div>

            {/* Constraint Alerts */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm font-bold mb-3 flex items-center gap-2">
                <AlertCircle size={16}/>
                Active Constraints
              </div>
              <div className="space-y-2 text-xs">
                {zones.filter(z => getZoneStatus(z) !== 'ok').map(zone => (
                  <div key={zone.id} className="flex items-start gap-2 text-yellow-400">
                    <span>⚠</span>
                    <span>{ZONE_TYPES[zone.type].name} needs {(ZONE_TYPES[zone.type].minArea - calculateZoneArea(zone)).toFixed(1)} m² more</span>
                  </div>
                ))}
                {zones.filter(z => getZoneStatus(z) !== 'ok').length === 0 && (
                  <div className="text-green-400 flex items-center gap-2">
                    <CheckCircle size={16}/>
                    <span>All zones meet requirements!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}