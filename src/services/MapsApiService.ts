// Servicio de utilidades de Google Maps (Places, Geocoding) para BeFast GO
// Reutiliza la API Key centralizada y no duplica lógica de tracking
import { GOOGLE_MAPS_API_KEY } from '../config/keys';

export interface LatLng { latitude: number; longitude: number }
export interface PlaceResult {
  name: string;
  address?: string;
  location: LatLng;
}

class MapsApiService {
  private apiKey: string;
  constructor(apiKey?: string) {
    this.apiKey = apiKey || GOOGLE_MAPS_API_KEY;
  }

  async geocodeAddress(address: string): Promise<LatLng | null> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    const result = data.results?.[0]?.geometry?.location;
    if (!result) return null;
    return { latitude: result.lat, longitude: result.lng };
  }

  async searchNearby(location: LatLng, keyword: string, radius: number = 1500): Promise<PlaceResult[]> {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${this.apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      name: r.name,
      address: r.vicinity,
      location: { latitude: r.geometry.location.lat, longitude: r.geometry.location.lng },
    }));
  }
}

export default new MapsApiService();

