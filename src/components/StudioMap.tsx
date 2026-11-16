// Source: Google Maps Platform Code Assist
import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin, Globe, Sparkles, Navigation } from 'lucide-react';

interface StudioLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  position: { lat: number; lng: number };
  role: string;
  projects: string;
  status: string;
}

const STUDIO_LOCATIONS: StudioLocation[] = [
  {
    id: 'tokyo',
    name: 'Mushaf Khan Studio — Tokyo',
    city: 'Tokyo',
    country: 'Japan',
    position: { lat: 35.6762, lng: 139.6503 },
    role: 'Creative 3D & WebGL Prototyping',
    projects: 'Artisan Roast, Cyberpunk Spatial Web, Neo-Kyoto 3D',
    status: 'Active Studio Node',
  },
  {
    id: 'london',
    name: 'Mushaf Khan Studio — London',
    city: 'London',
    country: 'UK',
    position: { lat: 51.5074, lng: -0.1278 },
    role: 'Motion Graphics & Video Direction',
    projects: 'Kinetix Brand Films, Monolith Title Sequence',
    status: 'Client Liaison Node',
  },
  {
    id: 'nyc',
    name: 'Mushaf Khan Studio — New York',
    city: 'New York',
    country: 'USA',
    position: { lat: 40.7128, lng: -74.006 },
    role: 'Full-Stack Web & Brand Architecture',
    projects: 'Verve Commerce, Atlas Design System',
    status: 'Active Client Node',
  },
  {
    id: 'dubai',
    name: 'Mushaf Khan Studio — Dubai',
    city: 'Dubai',
    country: 'UAE',
    position: { lat: 25.2048, lng: 55.2708 },
    role: 'AI Automation & Enterprise Digital Systems',
    projects: 'Oasis AI Workflows, Luxury Real Estate Spatial Tour',
    status: 'Active Studio Node',
  },
  {
    id: 'islamabad',
    name: 'Mushaf Khan Studio — Islamabad HQ',
    city: 'Islamabad',
    country: 'Pakistan',
    position: { lat: 33.6844, lng: 73.0479 },
    role: 'Primary Creative Engineering & Lead Direction',
    projects: 'Direct Studio Operations, Lead Production & Code',
    status: 'Global Headquarters',
  },
];

export const StudioMap: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<StudioLocation | null>(null);

  useEffect(() => {
    // Fetch Maps Key from backend endpoint or meta env
    const clientKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
    if (clientKey) {
      setApiKey(clientKey);
      return;
    }

    fetch('/api/config/maps')
      .then((res) => res.json())
      .then((data) => {
        if (data.apiKey) {
          setApiKey(data.apiKey);
        }
      })
      .catch((err) => console.warn('Could not load Google Maps configuration:', err));
  }, []);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-[#E7E3DA] bg-white shadow-sm">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-[#FAF8F4] border-b border-[#E7E3DA] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#B6F500]/25 border border-[#6BAA00]/30 flex items-center justify-center text-[#6BAA00]">
            <Globe size={18} />
          </div>
          <div>
            <h3 className="font-display font-medium text-lg sm:text-xl text-[#111111]">
              Global Studio Hubs & Client Deployments
            </h3>
            <p className="font-mono text-xs text-[#5B5B56]">
              Interactive Google Maps Platform • Worldwide delivery across 5 hubs
            </p>
          </div>
        </div>

        {/* Location Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STUDIO_LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc)}
              className={`min-h-[44px] px-3.5 py-2 rounded-full text-xs font-mono transition-all cursor-pointer ${
                selectedLocation?.id === loc.id
                  ? 'bg-[#B6F500] text-[#111111] font-bold shadow-xs'
                  : 'bg-white hover:bg-[#FAF8F4] text-[#5B5B56] hover:text-[#111111] border border-[#E7E3DA]'
              }`}
            >
              {loc.city}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="w-full h-[360px] sm:h-[480px] relative">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={{ lat: 30.0, lng: 40.0 }}
            defaultZoom={2.4}
            mapId="DEMO_MAP_ID"
            gestureHandling="cooperative"
            disableDefaultUI={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {STUDIO_LOCATIONS.map((location) => (
              <AdvancedMarker
                key={location.id}
                position={location.position}
                title={location.name}
                onClick={() => setSelectedLocation(location)}
              >
                <Pin
                  background="#B6F500"
                  glyphColor="#111111"
                  borderColor="#111111"
                  scale={1.15}
                />
              </AdvancedMarker>
            ))}

            {selectedLocation && (
              <InfoWindow
                position={selectedLocation.position}
                onCloseClick={() => setSelectedLocation(null)}
              >
                <div className="p-3 text-[#111] max-w-xs font-sans">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#3f6b00] font-bold uppercase mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#3f6b00]" />
                    {selectedLocation.status}
                  </div>
                  <h4 className="font-semibold text-sm text-[#050505] mb-1">
                    {selectedLocation.name}
                  </h4>
                  <p className="text-xs text-[#444] mb-2">{selectedLocation.role}</p>
                  <div className="p-2 bg-gray-100 rounded-lg text-[11px] font-mono text-[#555] mb-2">
                    <strong className="text-[#111]">Featured Work:</strong> {selectedLocation.projects}
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.position.lat},${selectedLocation.position.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#3f6b00] hover:underline"
                  >
                    <Navigation size={11} /> Get Directions
                  </a>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
};
