import React from 'react';
import type { AcademicProjectInfo } from '../services/api.ts';
import {
  GraduationCap,
  X,
  Users,
  Award,
  BookOpen,
  CheckCircle2,
  Mail,
  Phone,
  Building,
} from 'lucide-react';

interface AcademicModalProps {
  isOpen: boolean;
  onClose: () => void;
  info: AcademicProjectInfo | null;
}

export const AcademicModal: React.FC<AcademicModalProps> = ({ isOpen, onClose, info }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-indigo-700/80 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/30">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Vardhaman College of Engineering (Autonomous)
              </h3>
              <p className="text-xs text-indigo-300">
                Department of Computer Science and Engineering · NAAC A++ Accredited
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Project Meta Pill */}
        <div className="mt-4 rounded-xl bg-indigo-950/40 p-4 border border-indigo-800/60">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">
                Project Work Phase-I (2026-2027)
              </span>
              <h4 className="text-sm font-extrabold text-white mt-0.5">
                {info?.projectTitle || 'Autonomous Incident Commander (EchoGuard)'}
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-indigo-900/80 px-2 py-1 font-mono text-xs font-bold text-indigo-200 border border-indigo-700">
                Batch ID: {info?.batchId || '24MPCS-A18'}
              </span>
              <span className="rounded bg-slate-800 px-2 py-1 font-mono text-xs text-slate-300">
                III B. TECH II SEM CSE-A
              </span>
            </div>
          </div>
        </div>

        {/* Team Members Roster */}
        <div className="mt-4">
          <div className="flex items-center gap-2 text-xs font-bold text-white mb-2.5">
            <Users className="h-4 w-4 text-cyan-400" />
            <span>Student Engineering Team</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {info?.teamMembers.map((member) => (
              <div
                key={member.rollNumber}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-cyan-400 font-bold">{member.rollNumber}</span>
                  <span className="rounded bg-slate-800 px-1 text-[9px] text-slate-400">#{member.sNo}</span>
                </div>
                <h5 className="font-bold text-white text-xs mt-1 truncate">{member.name}</h5>
                <div className="mt-2 space-y-1 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1 truncate">
                    <Mail className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                    <span>{member.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Guide Details */}
        {info?.guide && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Project Guide & Supervisor</span>
              </div>
              <span className="rounded bg-amber-950/60 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-800">
                Area: {info.guide.areaOfInterest}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-white">{info.guide.name}</span>
                <span className="text-slate-400 block text-[11px]">
                  {info.guide.designation}, {info.guide.department}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-0.5">
                <div>Email: <span className="font-mono text-slate-300">{info.guide.email}</span></div>
                <div>Contact: <span className="font-mono text-slate-300">{info.guide.phone}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-5 flex justify-end border-t border-slate-800 pt-3">
          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
