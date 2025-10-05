import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Move,
  RotateCw,
  Download,
  Share2,
  Home,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import "./App.css";

// ==========================
// ZONE DEFINITIONS
// ==========================
const ZONE_TYPES = {
  sleep: { name: "Sleep Quarters", icon: "🛏", color: "#3B82F6", minArea: 40 },
  hygiene: { name: "Hygiene", icon: "🚿", color: "#06B6D4", minArea: 10 },
  food: { name: "Food Prep", icon: "🍽", color: "#10B981", minArea: 10 },
  exercise: { name: "Exercise", icon: "🏃", color: "#F59E0B", minArea: 8 },
  medical: { name: "Medical", icon: "💊", color: "#EF4444", minArea: 5 },
  maintenance: { name: "Maintenance", icon: "🔧", color: "#8B5CF6", minArea: 15 },
  storage: { name: "Storage", icon: "📦", color: "#6366F1", minArea: 20 },
  environmental: {
    name: "Environmental Control",
    icon: "🌡",
    color: "#14B8A6",
    minArea: 12,
  },
  recreation: { name: "Recreation", icon: "🎮", color: "#EC4899", minArea: 8 },
  command: {
    name: "Command Center",
    icon: "🖥",
    color: "#0EA5E9",
    minArea: 10,
  },
};

const DESTINATIONS = [
  { id: "moon", name: "Moon", duration: "14-30 days", icon: "🌙" },
  { id: "mars", name: "Mars", duration: "500-700 days", icon: "🔴" },
  { id: "transit", name: "Transit", duration: "180-300 days", icon: "🚀" },
];

const HABITAT_TYPES = [
  {
    id: "metallic",
    name: "Metallic (Rigid)",
    desc: "Durable, predictable structure",
  },
  { id: "inflatable", name: "Inflatable", desc: "Lightweight, expandable" },
  {
    id: "surface",
    name: "Surface-Built",
    desc: "Constructed on surface, shielded",
  },
];

// ==========================
// MAIN APP
// ==========================
export default function App() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    destination: "moon",
    crewSize: 4,
    duration: 30,
    habitatType: "inflatable",
    length: 15,
    diameter: 8,
    floors: 1,
  });
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [draggedZone, setDraggedZone] = useState(null);
  const canvasRef = useRef(null);

  // ==========================
  // SAVE HABITAT FUNCTION
  // ==========================
  const saveHabitat = async () => {
    const payload = { config, zones };

    try {
      const res = await fetch("http://localhost:5000/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        alert("✅ " + result.message);
      } else {
        alert("❌ Failed: " + result.message);
      }
    } catch (error) {
      console.error("Error saving habitat:", error);
      alert("🚨 Error saving habitat. Check backend connection!");
    }
  };

  const totalVolume =
    Math.PI * Math.pow(config.diameter / 2, 2) * config.length;
  const totalArea = config.length * config.diameter * config.floors * 2.5;

  // ==========================
  // ZONE FUNCTIONS
  // ==========================
  const addZone = (type) => {
    const zoneType = ZONE_TYPES[type];
    const newZone = {
      id: Date.now(),
      type,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: Math.sqrt(zoneType.minArea) * 15,
      height: Math.sqrt(zoneType.minArea) * 15,
    };
    setZones([...zones, newZone]);
  };

  const updateZone = (id, updates) => {
    setZones(zones.map((z) => (z.id === id ? { ...z, ...updates } : z)));
  };

  const handleMouseDown = (e, zone) => {
    if (e.target.classList.contains("resize-handle")) return;
    setSelectedZone(zone.id);
    setDraggedZone({
      zone,
      offsetX: e.clientX - zone.x,
      offsetY: e.clientY - zone.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!draggedZone) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(
        e.clientX - rect.left - draggedZone.offsetX,
        rect.width - draggedZone.zone.width
      )
    );
    const y = Math.max(
      0,
      Math.min(
        e.clientY - rect.top - draggedZone.offsetY,
        rect.height - draggedZone.zone.height
      )
    );
    updateZone(draggedZone.zone.id, { x, y });
  };

  const handleMouseUp = () => setDraggedZone(null);

  useEffect(() => {
    if (draggedZone) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggedZone]);

  // ==========================
  // STEP 1: Mission Parameters
  // ==========================
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              NASA Space Habitat Designer
            </h1>
            <p className="text-blue-300 text-lg">
              Design sustainable living spaces for space exploration
            </p>
          </div>

          {/* Destination */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {DESTINATIONS.map((dest) => (
              <button
                key={dest.id}
                onClick={() => setConfig({ ...config, destination: dest.id })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  config.destination === dest.id
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-slate-600"
                }`}
              >
                <div className="text-4xl mb-2">{dest.icon}</div>
                <div className="font-bold">{dest.name}</div>
                <div className="text-xs text-slate-400">{dest.duration}</div>
              </button>
            ))}
          </div>

          {/* Crew Size */}
          <label className="block mb-2">
            Crew Size: {config.crewSize} astronauts
          </label>
          <input
            type="range"
            min="1"
            max="12"
            value={config.crewSize}
            onChange={(e) =>
              setConfig({ ...config, crewSize: parseInt(e.target.value) })
            }
            className="w-full mb-6"
          />

          {/* Duration */}
          <label className="block mb-2">
            Mission Duration: {config.duration} days
          </label>
          <input
            type="range"
            min="7"
            max="700"
            value={config.duration}
            onChange={(e) =>
              setConfig({ ...config, duration: parseInt(e.target.value) })
            }
            className="w-full mb-6"
          />

          {/* Habitat Type */}
          <h2 className="text-xl font-bold mb-3">Habitat Type</h2>
          {HABITAT_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setConfig({ ...config, habitatType: type.id })}
              className={`w-full p-4 mb-3 rounded-xl border-2 text-left ${
                config.habitatType === type.id
                  ? "border-blue-500 bg-blue-500/20"
                  : "border-slate-600"
              }`}
            >
              <div className="font-bold">{type.name}</div>
              <div className="text-sm text-slate-400">{type.desc}</div>
            </button>
          ))}

          {/* Habitat Stats */}
          <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30 mt-6">
            <div className="flex items-center gap-2 mb-2">
              <Info size={20} />
              <span className="font-bold">Habitat Capacity</span>
            </div>
            <div className="text-sm space-y-1">
              <div>Total Volume: {totalVolume.toFixed(1)} m³</div>
              <div>Floor Area: {totalArea.toFixed(1)} m²</div>
              <div>
                Volume per Crew: {(totalVolume / config.crewSize).toFixed(1)} m³
              </div>
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={() => setStep(2)}
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold text-lg"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // ==========================
  // STEP 2: Layout Designer
  // ==========================
  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Habtiant Nova</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <Users size={16} /> {config.crewSize}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={16} /> {config.duration}d
            </span>
            <span className="flex items-center gap-1">
              <Home size={16} /> {config.destination}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep(1)}
            className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
          >
            ← Back
          </button>

          <button
            onClick={saveHabitat}
            className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <CheckCircle size={16} /> Save Habitat
          </button>

          <button className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Download size={16} /> Export
          </button>

          <button className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2">
            <Share2 size={16} /> Share
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL */}
        <div className="w-80 bg-slate-800 border-r border-slate-700 overflow-y-auto p-4">
          <h3 className="font-bold mb-4 text-lg">Functional Zones</h3>
          <div className="space-y-4">
            {Object.entries(ZONE_TYPES).map(([type, info]) => (
              <div key={type} className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{info.icon}</span>
                    <span className="font-medium text-sm">{info.name}</span>
                  </div>
                  <CheckCircle size={16} className="text-green-400" />
                </div>
                <button
                  onClick={() => addZone(type)}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                >
                  Add Zone
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CANVAS */}
        <div className="flex-1 relative bg-slate-950">
          <div
            ref={canvasRef}
            className="absolute inset-0 overflow-hidden"
            style={{
              backgroundImage:
                "radial-gradient(circle, #334155 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            {/* Habitat Outline */}
            <div
              className="absolute border-4 border-blue-500/30 rounded-lg"
              style={{
                left: "50px",
                top: "50px",
                width: `${config.length * 30}px`,
                height: `${config.diameter * 30}px`,
              }}
            />

            {/* Zones */}
            {zones.map((zone) => {
              const zoneType = ZONE_TYPES[zone.type];
              const isSelected = selectedZone === zone.id;

              return (
                <div
                  key={zone.id}
                  onMouseDown={(e) => handleMouseDown(e, zone)}
                  className={`absolute rounded-lg cursor-move transition-all ${
                    isSelected ? "ring-4 ring-white z-10" : ""
                  }`}
                  style={{
                    left: zone.x,
                    top: zone.y,
                    width: zone.width,
                    height: zone.height,
                    backgroundColor: zoneType.color + "66",
                  }}
                >
                  <div className="absolute text-xs bottom-1 left-1 bg-black/40 px-1 rounded">
                    {zoneType.icon} {zoneType.name}
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      </div>
    </div>
  );
}
