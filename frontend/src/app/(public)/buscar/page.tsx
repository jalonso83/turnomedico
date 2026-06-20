"use client";

import { useState, useCallback, useEffect } from "react";
import { SPECIALTIES, CITIES_RD } from "@/lib/constants";
import { publicApi } from "@/lib/api";
import { Search, MapPin, Star, UserSearch, Calendar, Loader2, User } from "lucide-react";
import Link from "next/link";

interface DoctorInsurance {
  id: string;
  slug: string;
  shortName: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  city: string | null;
  consultorioName: string | null;
  ratingAvg: number;
  totalReviews: number;
  consultationFee: number | null;
  slug: string;
  photoUrl: string | null;
  insurances: DoctorInsurance[];
}

export default function BuscarPage() {
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-colors text-sm bg-white";

  const fetchDoctors = useCallback(async (spec?: string, cty?: string, name?: string) => {
    setLoading(true);
    setError("");

    const params: Record<string, string> = { limit: "20", offset: "0" };
    if (spec) params.specialty = spec;
    if (cty) params.city = cty;
    if (name && name.trim()) params.name = name.trim();

    try {
      const data = await publicApi.searchDoctors(params) as { doctors: Doctor[]; total: number };
      setResults(data.doctors || []);
      setTotal(data.total || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al buscar médicos";
      setError(message);
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar médicos al entrar a la página (sin filtros)
  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleSearch = () => {
    fetchDoctors(specialty, city, query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClearFilters = () => {
    setSpecialty("");
    setCity("");
    setQuery("");
    fetchDoctors();
  };

  return (
    <div>
      {/* Hero mini */}
      <section className="bg-brand-gradient text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Encuentra tu médico</h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Busca por especialidad, nombre o ciudad y agenda tu cita en segundos
          </p>
        </div>
      </section>

      {/* Search filters */}
      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-md p-4">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.5} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nombre del médico..."
                className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-colors text-sm"
              />
            </div>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className={inputClass}
            >
              <option value="">Todas las especialidades</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
            >
              <option value="">Todas las ciudades</option>
              {CITIES_RD.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-navy text-white px-6 py-3 rounded-lg font-medium hover:bg-navy-dark transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                "Buscar"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-1" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-10 bg-gray-200 rounded-lg mt-3" />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {total} médico{total !== 1 ? "s" : ""} disponible{total !== 1 ? "s" : ""}
              </p>
              {(specialty || city || query) && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-teal hover:text-teal-dark transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((doctor) => (
                <Link
                  key={doctor.id}
                  href={`/doctor/${doctor.slug}`}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-teal/30 transition-all block"
                >
                  {/* Doctor header */}
                  <div className="flex items-center gap-3 mb-3">
                    {doctor.photoUrl ? (
                      <img
                        src={doctor.photoUrl}
                        alt={doctor.name}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-teal" strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{doctor.name}</h3>
                      <p className="text-sm text-teal font-medium">{doctor.specialty}</p>
                    </div>
                  </div>

                  {/* Location */}
                  {doctor.city && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                      <span className="truncate">
                        {doctor.consultorioName ? `${doctor.consultorioName}, ${doctor.city}` : doctor.city}
                      </span>
                    </div>
                  )}

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.floor(doctor.ratingAvg || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
                        }`}
                        strokeWidth={1.5}
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">
                      {(doctor.ratingAvg || 0).toFixed(1)} ({doctor.totalReviews || 0})
                    </span>
                  </div>

                  {/* Insurances */}
                  {doctor.insurances && doctor.insurances.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {doctor.insurances.slice(0, 4).map((ins) => (
                        <span
                          key={ins.id}
                          className="text-[10px] px-2 py-0.5 bg-teal/10 text-teal rounded-full font-medium"
                        >
                          {ins.shortName}
                        </span>
                      ))}
                      {doctor.insurances.length > 4 && (
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                          +{doctor.insurances.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Agenda disponible
                    </div>
                    {doctor.consultationFee != null && doctor.consultationFee > 0 && (
                      <span className="text-xs font-semibold text-navy">
                        RD${doctor.consultationFee.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 text-center bg-teal text-white py-2.5 rounded-lg text-sm font-medium">
                    Agendar cita
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <UserSearch className="w-10 h-10 text-teal" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay médicos disponibles
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              No se encontraron médicos con agenda activa. Estamos creciendo y cada día se unen más médicos a la plataforma.
            </p>
            {(specialty || city || query) && (
              <button
                onClick={handleClearFilters}
                className="mt-4 text-sm text-teal font-medium hover:text-teal-dark transition-colors"
              >
                Limpiar filtros y ver todos
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
