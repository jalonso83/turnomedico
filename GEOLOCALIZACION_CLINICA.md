# 🗺️ Geolocalización de la Clínica - Setup Completo

## 📌 Dónde se Guarda la Ubicación

La ubicación de la clínica se almacena en la tabla `DoctorProfile`:

```sql
ALTER TABLE doctor_profiles ADD COLUMN latitude FLOAT;
ALTER TABLE doctor_profiles ADD COLUMN longitude FLOAT;
```

En Prisma:
```prisma
model DoctorProfile {
  ...
  latitude  Float?
  longitude Float?
  ...
}
```

---

## 🎯 3 Formas de Asignar Coordenadas de la Clínica

### **Opción 1: Google Places Autocomplete (Recomendado)**

#### Backend Endpoint
```typescript
// backend/src/modules/doctors/doctors.service.ts

import axios from 'axios';

async updateDoctorLocation(
  doctorId: string,
  placeId: string,
  tenantId: string
) {
  // 1. Obtener detalles del lugar desde Google Places API
  const response = await axios.get(
    'https://maps.googleapis.com/maps/api/place/details/json',
    {
      params: {
        place_id: placeId,
        key: process.env.GOOGLE_MAPS_API_KEY,
        fields: 'geometry,formatted_address,name'
      }
    }
  );

  const { geometry, formatted_address } = response.data.result;
  
  // 2. Actualizar DoctorProfile
  return this.prisma.doctorProfile.update({
    where: { tenantId },
    data: {
      latitude: geometry.location.lat,
      longitude: geometry.location.lng,
      address: formatted_address,
      googlePlaceId: placeId
    }
  });
}
```

#### Frontend Component
```typescript
// frontend/src/components/LocationPicker.tsx
'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { MapPin, Search } from 'lucide-react';

export function LocationPicker() {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (value: string) => {
    setSearchInput(value);
    
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        {
          params: {
            input: value,
            key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
            components: 'country:do' // Solo República Dominicana
          }
        }
      );

      setSuggestions(response.data.predictions);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlace = async (placeId: string, description: string) => {
    setSearchInput(description);
    setSuggestions([]);
    
    // Guardar en backend
    await api.post('/doctors/update-location', { placeId });
  };

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-white mb-2 block">
          <MapPin className="inline mr-2 w-4 h-4" />
          Ubicación de la clínica
        </span>
        
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Busca tu clínica, consultorio o dirección..."
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
        />
      </label>

      {suggestions.length > 0 && (
        <ul className="bg-gray-800 border border-gray-700 rounded overflow-hidden">
          {suggestions.map((place) => (
            <li key={place.place_id}>
              <button
                onClick={() =>
                  handleSelectPlace(
                    place.place_id,
                    place.description
                  )
                }
                className="w-full text-left px-4 py-3 hover:bg-gray-700 border-b border-gray-700 last:border-b-0"
              >
                <p className="text-white text-sm">{place.main_text}</p>
                <p className="text-gray-400 text-xs">
                  {place.secondary_text}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

### **Opción 2: Entrada Manual (Simple)

User entra las coordenadas manualmente:

```typescript
// backend/src/modules/doctors/dto/update-location.dto.ts
export class UpdateLocationDto {
  latitude: number;   // ej: 18.486
  longitude: number;  // ej: -69.915
  address?: string;   // ej: "Calle Colón 123, SDE"
}

// Endpoint
POST /doctors/location
{
  "latitude": 18.486,
  "longitude": -69.915,
  "address": "Centro Médico San Rafael, Piso 3"
}
```

---

### **Opción 3: GPS en Tiempo Real**

El doctor abre la app desde la clínica:

```typescript
// frontend/src/lib/geolocation.ts
export async function getClinicLocationFromGPS() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      reject,
      {
        enableHighAccuracy: true,
        timeout: 5000
      }
    );
  });
}

// Guardar
const location = await getClinicLocationFromGPS();
await api.post('/doctors/location', {
  latitude: location.lat,
  longitude: location.lng,
  address: `Ubicación GPS (precisión: ${location.accuracy}m)`
});
```

---

## 🔌 Cómo Funciona en SmartReminders

Una vez que la clínica tiene coordenadas:

```typescript
// backend/src/modules/smart-reminders/smart-reminders.service.ts

async createSmartReminder(appointmentId: string, tenantId: string) {
  // 1. Obtener ubicación clínica
  const doctorProfile = await this.prisma.doctorProfile.findUnique({
    where: { tenantId }
  });

  const clinicLat = doctorProfile?.latitude ?? 18.486;
  const clinicLng = doctorProfile?.longitude ?? -69.915;

  // 2. Obtener ubicación paciente (se enviará desde frontend)
  const patientLat = appointment.patientLat; // viene del frontend
  const patientLng = appointment.patientLng;

  // 3. Calcular distancia
  const travelTime = await this.getTravelTime(
    patientLat, patientLng,  // DONDE ESTÁ
    clinicLat, clinicLng      // DONDE VA
  );
}
```

---

## 🌍 Coordenadas Útiles (República Dominicana)

| Lugar | Lat | Lng |
|-------|-----|-----|
| Santo Domingo Este | 18.4861 | -69.9155 |
| Santo Domingo Oeste | 18.4744 | -70.1086 |
| San Cristóbal | 18.4241 | -70.1025 |
| La Romana | 18.4206 | -68.9734 |
| Puerto Plata | 19.7866 | -70.1595 |
| Santiago | 19.4517 | -70.6964 |

---

## 🔑 Google Maps API Key - Setup

### 1. Crear proyecto en Google Cloud
```
https://console.cloud.google.com/
```

### 2. Habilitar APIs
- ✅ Maps SDK for JavaScript
- ✅ Distance Matrix API
- ✅ Places API
- ✅ Geocoding API

### 3. Crear credenciales
```
APIs & Services → Credentials → Create Credential → API Key
```

### 4. Restringir key (SEGURIDAD)
```
Application restrictions: HTTP referrers
Website restrictions: *.tudominio.com
API restrictions: 
  - Maps SDK for JavaScript
  - Distance Matrix API
  - Places API
```

### 5. Agregar a .env
```bash
# .env (backend)
GOOGLE_MAPS_API_KEY="AIzaSy..."

# .env.local (frontend)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSy..."
```

---

## 📍 Verificar Coordenadas en Google Maps

```
https://www.google.com/maps/@{LAT},{LNG},15z
```

**Ejemplo:**
```
https://www.google.com/maps/@18.4861,-69.9155,15z
```

---

## 🧪 Test de Distancia

```bash
curl "https://maps.googleapis.com/maps/api/distancematrix/json?origins=18.487,-69.914&destinations=18.486,-69.915&key=YOUR_API_KEY&mode=driving&departure_time=now"

Response:
{
  "rows": [{
    "elements": [{
      "duration": { "value": 543, "text": "9 mins" },
      "distance": { "value": 1234, "text": "1.2 km" }
    }]
  }]
}
```

---

## ⚡ Cómo Integrar al Onboarding

Cuando el doctor se registra:

```typescript
// Paso 1: Datos básicos
email, password, name, phone

// Paso 2: Perfil médico
specialty, license_number, bio

// Paso 3: UBICACIÓN CLÍNICA ← AQUÍ
// Opción A: Google Places autocomplete
// Opción B: Coordenadas manuales
// Opción C: GPS en tiempo real
latitude, longitude, address

// Paso 4: Horario
schedule, breaks
```

---

## 🗺️ Componente Mapa Interactivo (Bonus)

```typescript
// frontend/src/components/MapLocationPicker.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

export function MapLocationPicker() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const googleMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: 18.486, lng: -69.915 },
      zoom: 13
    });

    const googleMarker = new window.google.maps.Marker({
      position: { lat: 18.486, lng: -69.915 },
      map: googleMap,
      draggable: true
    });

    googleMarker.addListener('dragend', async () => {
      const pos = googleMarker.getPosition();
      await api.post('/doctors/location', {
        latitude: pos.lat(),
        longitude: pos.lng()
      });
    });

    setMap(googleMap);
    setMarker(googleMarker);
  }, []);

  return (
    <div>
      <p className="text-sm text-gray-400 mb-2">
        📍 Arrastra el marcador para seleccionar tu clínica
      </p>
      <div
        ref={mapRef}
        className="w-full h-64 rounded border border-gray-700"
      />
    </div>
  );
}
```

Agrega al layout:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>
```

---

## 📊 Validación de Coordenadas

```typescript
function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}

// Test
isValidCoordinate(18.486, -69.915); // true
isValidCoordinate(91, -70); // false
```

---

## 🚀 Configuración Rápida

Para empezar **YA**:

```bash
# 1. Generar API Key de Google Maps
# https://console.cloud.google.com

# 2. Copiar a .env
GOOGLE_MAPS_API_KEY="AIzaSy..."

# 3. Usar coordenadas manuales por ahora
POST /doctors/location
{
  "latitude": 18.486,
  "longitude": -69.915,
  "address": "Centro Médico San Rafael, SDE"
}

# 4. Smart Reminders funciona automáticamente
```

---

## 📝 Checklist de Implementación

- [ ] Google Maps API key obtenida
- [ ] API key restringida por dominio
- [ ] .env actualizado (backend y frontend)
- [ ] DoctorProfile tiene latitude/longitude
- [ ] Endpoint `/doctors/location` creado
- [ ] Frontend component LocationPicker integrado
- [ ] Onboarding incluye paso de ubicación
- [ ] SmartReminders obtiene ubicación clínica correctamente
- [ ] Testeado: Smart Reminder calcula tiempo viaje correcto

