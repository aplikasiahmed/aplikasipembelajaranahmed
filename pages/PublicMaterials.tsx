
import React, { useState, useEffect } from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { Material, GradeLevel } from '../types';

const PublicMaterials: React.FC = () => {
  const [grade, setGrade] = useState<GradeLevel | 'all'>('all');
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    db.getMaterials(grade === 'all' ? undefined : grade).then(setMaterials);
  }, [grade]);

  return (
    <div className="space-y-4 md:space-y-6 animate-fadeIn px-1 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Materi Pembelajaran</h1>
          <p className="text-[10px] md:text-xs text-slate-500">Referensi belajar mandiri PAI & Budi Pekerti.</p>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {(['all', '7', '8', '9'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGrade(g)}
              className={`px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all whitespace-nowrap ${
                grade === g ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {g === 'all' ? 'Semua' : `Kelas ${g}`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {materials.map((m) => (
          <div key={m.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden group hover:shadow-lg transition-all shadow-sm">
            <div className="relative h-28 md:h-36">
              <img src={m.thumbnail} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-2 left-2">
                <span className="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-700 shadow-sm capitalize">
                  {m.category}
                </span>
              </div>
            </div>
            <div className="p-3 md:p-4 space-y-2 md:space-y-3">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kelas {m.grade}</span>
                <h3 className="text-sm md:text-base font-bold text-slate-800 line-clamp-2 mt-0.5 leading-tight">{m.title}</h3>
              </div>
              <p className="text-slate-500 text-[10px] md:text-[11px] line-clamp-2 leading-relaxed">
                {m.description}
              </p>
              <div className="pt-1">
                <a 
                  href={m.content_url} 
                  className="w-full flex items-center justify-center gap-1.5 bg-slate-50 text-emerald-700 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all border border-emerald-50"
                >
                  <BookOpen size={12} /> Pelajari <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublicMaterials;