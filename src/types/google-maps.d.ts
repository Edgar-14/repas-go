/* eslint-disable @typescript-eslint/no-unused-vars */
declare namespace google {
  namespace maps {
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface LatLngBoundsLiteral {
      east: number;
      west: number;
      north: number;
      south: number;
    }

    class LatLngBounds {
      constructor(southwest: LatLngLiteral, northeast: LatLngLiteral);
      contains(point: LatLngLiteral): boolean;
    }

    interface SizeLiteral {
      width: number;
      height: number;
    }

    interface Icon {
      url: string;
      anchor?: { x: number; y: number };
      scaledSize?: SizeLiteral;
    }

    interface MapsEventListener {
      remove(): void;
    }

    interface MapOptions {
      center?: LatLngLiteral;
      zoom?: number;
      mapTypeId?: string;
      disableDefaultUI?: boolean;
    }

    class Map {
      constructor(element: HTMLElement, options?: MapOptions);
      panTo(latLng: LatLngLiteral): void;
      setZoom(zoom: number): void;
      getZoom(): number;
      fitBounds(bounds: LatLngBounds): void;
    }

    interface MarkerOptions {
      position?: LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | Icon;
    }

    class Marker {
      constructor(options?: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(position: LatLngLiteral): void;
    }

    enum TravelMode {
      DRIVING = 'DRIVING',
      WALKING = 'WALKING',
      BICYCLING = 'BICYCLING',
      TRANSIT = 'TRANSIT'
    }

    enum Animation {
      BOUNCE = 1,
      DROP = 2
    }

    interface DirectionsRequest {
      origin: LatLngLiteral | string;
      destination: LatLngLiteral | string;
      travelMode: TravelMode;
      avoidTolls?: boolean;
      avoidHighways?: boolean;
    }

    interface DirectionsResult {
      routes: any[];
    }

    type DirectionsStatus = 'OK' | 'NOT_FOUND' | 'ZERO_RESULTS' | 'MAX_WAYPOINTS_EXCEEDED' | 'INVALID_REQUEST' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'UNKNOWN_ERROR';

    class DirectionsService {
      constructor();
      route(request: DirectionsRequest, callback: (result: DirectionsResult | null, status: DirectionsStatus) => void): void;
    }

    interface DirectionsRendererOptions {
      suppressMarkers?: boolean;
      polylineOptions?: {
        strokeColor?: string;
        strokeWeight?: number;
        strokeOpacity?: number;
      };
    }

    class DirectionsRenderer {
      constructor(options?: DirectionsRendererOptions);
      setMap(map: Map | null): void;
      setDirections(directions: DirectionsResult): void;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    namespace event {
      function addListener(instance: any, eventName: string, handler: () => void): MapsEventListener;
      function removeListener(listener: MapsEventListener): void;
    }

    namespace places {
      interface AutocompleteOptions {
        bounds?: LatLngBounds | LatLngBoundsLiteral;
        componentRestrictions?: { country?: string | string[] };
        fields?: Array<'address_component' | 'adr_address' | 'formatted_address' | 'geometry' | 'icon' | 'name' | 'photo' | 'place_id' | 'plus_code' | 'type' | 'url' | 'utc_offset_minutes' | 'vicinity' | 'website'>;
        strictBounds?: boolean;
        types?: string[];
      }

      interface PlaceResult {
        formatted_address?: string;
        geometry?: {
          location: {
            lat(): number;
            lng(): number;
          };
        };
        name?: string;
        place_id?: string;
      }

      class Autocomplete {
        constructor(input: HTMLInputElement, options?: AutocompleteOptions);
        addListener(eventName: string, handler: () => void): MapsEventListener;
        getPlace(): PlaceResult;
      }
    }
  }
}

declare global {
  interface Window {
    google?: typeof google;
  }
}

export {};
