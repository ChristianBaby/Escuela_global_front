"use client";

import { useState, useEffect } from "react";
import { Star, RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/atoms";
import { Slider } from "@/components/ui/slider";
import type { Category } from "@/types";

export interface FiltersState {
  categoria_ids: string[];
  min_rating: number;
  duration: string;
  softwares: string[];
  min_price: number;
  max_price: number;
}

export const EMPTY_FILTERS: FiltersState = {
  categoria_ids: [],
  min_rating: 0,
  duration: "",
  softwares: [],
  min_price: 0,
  max_price: 0,
};

const DURATION_OPTIONS = [
  { value: "<10", label: "Menos de 10 horas" },
  { value: "10-30", label: "De 10 a 30 horas" },
  { value: ">30", label: "Más de 30 horas" },
];

const MAX_PRICE = 1000;

interface CourseFiltersProps {
  filters: FiltersState;
  onChange: (f: FiltersState) => void;
  categories: Category[];
  softwares: string[];
}

export function CourseFilters({ filters, onChange, categories, softwares }: CourseFiltersProps) {
  const [localPrice, setLocalPrice] = useState<[number, number]>([
    filters.min_price,
    filters.max_price > 0 ? filters.max_price : MAX_PRICE,
  ]);

  useEffect(() => {
    setLocalPrice([
      filters.min_price,
      filters.max_price > 0 ? filters.max_price : MAX_PRICE,
    ]);
  }, [filters.min_price, filters.max_price]);

  const hasActiveFilters =
    filters.categoria_ids.length > 0 ||
    filters.min_rating > 0 ||
    filters.duration !== "" ||
    filters.softwares.length > 0 ||
    filters.min_price > 0 ||
    filters.max_price > 0;

  function toggleCategoria(id: string) {
    const ids = filters.categoria_ids.includes(id)
      ? filters.categoria_ids.filter((c) => c !== id)
      : [...filters.categoria_ids, id];
    onChange({ ...filters, categoria_ids: ids });
  }

  function toggleSoftware(name: string) {
    const list = filters.softwares.includes(name)
      ? filters.softwares.filter((s) => s !== name)
      : [...filters.softwares, name];
    onChange({ ...filters, softwares: list });
  }

  function setRating(rating: number) {
    onChange({ ...filters, min_rating: filters.min_rating === rating ? 0 : rating });
  }

  function setDuration(value: string) {
    onChange({ ...filters, duration: filters.duration === value ? "" : value });
  }

  return (
    <aside className="space-y-6">
      {/* Encabezado con botón limpiar */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-brand-primary text-sm uppercase tracking-wide">Filtros</h2>
        {hasActiveFilters && (
          <button
            onClick={() => onChange(EMPTY_FILTERS)}
            className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-secondary transition-colors"
          >
    
            <RotateCcw size={11} />
            Limpiar          
          </button>
        )}
      </div>

      {/* Categorías */}
      {categories.length > 0 && (
        <FilterSection title="Categorías">
          <div className="space-y-2">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  id={`cat-${cat.id}`}
                  checked={filters.categoria_ids.includes(cat.id)}
                  onCheckedChange={() => toggleCategoria(cat.id)}
                  className="data-[state=checked]:bg-brand-primary data-[state=checked]:border-brand-primary"
                />
                <span className="text-sm text-gray-700 group-hover:text-brand-primary transition-colors select-none">
                  {cat.name}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Calificación */}
      <FilterSection title="Calificación mínima">
        <div className="space-y-1.5">
          {[4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              onClick={() => setRating(stars)}
              className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors ${
                filters.min_rating === stars
                  ? "bg-brand-primary/10 text-brand-primary font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={i < stars ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                  />
                ))}
              </span>
              <span>{stars}+ estrellas</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Duración */}
      <FilterSection title="Duración">
        <div className="space-y-2">
          {DURATION_OPTIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
              <Checkbox
                id={`dur-${value}`}
                checked={filters.duration === value}
                onCheckedChange={() => setDuration(value)}
                className="data-[state=checked]:bg-brand-primary data-[state=checked]:border-brand-primary"
              />
              <span className="text-sm text-gray-700 group-hover:text-brand-primary transition-colors select-none">
                {label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Rango de precio */}
      <FilterSection title="Precio (USD)">
        <div className="px-1">
          <Slider
            min={0}
            max={MAX_PRICE}
            step={10}
            value={localPrice}
            onValueChange={(values) => setLocalPrice(values as [number, number])}
            onValueCommitted={(values) => {
              if (Array.isArray(values)) {
                onChange({ ...filters, min_price: values[0], max_price: values[1] });
              }
            }}
            className="my-4"
          />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>${localPrice[0]}</span>
            <span>{localPrice[1] >= MAX_PRICE ? "Cualquier precio" : `$${localPrice[1]}`}</span>
          </div>
        </div>
      </FilterSection>

      {/* Softwares */}
      {softwares.length > 0 && (
        <FilterSection title="Software">
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {softwares.map((sw) => (
              <label key={sw} className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  id={`sw-${sw}`}
                  checked={filters.softwares.includes(sw)}
                  onCheckedChange={() => toggleSoftware(sw)}
                  className="data-[state=checked]:bg-brand-primary data-[state=checked]:border-brand-primary"
                />
                <span className="text-sm text-gray-700 group-hover:text-brand-primary transition-colors select-none truncate">
                  {sw}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}
    </aside>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-gray-100 pt-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}
