"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input, Button } from "@/components/atoms";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  defaultValue?: string;
}

export function SearchBar({
  placeholder = "Buscar cursos...",
  className,
  defaultValue = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/cursos?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9 w-full bg-white/95"
        />
      </div>
      <Button type="submit" className="bg-brand-secondary hover:bg-brand-secondary/90 text-white shrink-0">
        Buscar
      </Button>
    </form>
  );
}
