
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
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Materi Pembelajaran</h1>
          <p className="text-xs text-slate-500">Referensi belajar mandiri PAI & Budi Pekerti.</p>
        </div>
        <div className="flex gap-1.5">
          {(['all', '7', '8', '9'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGrade(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                grade === g ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {g === 'all' ? 'Semua' : `Kelas ${g}`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((m) => (
          <div key={m.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden group hover:shadow-lg transition-all">
            <div className="relative h-36">
              <img src={m.thumbnail} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 left-3">
                <span className="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 shadow-sm capitalize">
                  {m.category}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kelas {m.grade}</span>
                <h3 className="text-base font-bold text-slate-800 line-clamp-2 mt-0.5 leading-tight">{m.title}</h3>
              </div>
              <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">
                {m.description}
              </p>
              <div className="pt-1">
                <a 
                  href={m.content_url} 
                  className="w-full flex items-center justify-center gap-1.5 bg-slate-50 text-emerald-700 py-2 rounded-lg text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all"
                >
                  <BookOpen size={14} /> Pelajari <ExternalLink size={10} />
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
