"use client";

import { useState } from "react";
import { Plus, User, Trash2, Edit2, ShieldAlert } from "lucide-react";
import { saveChildAction, deleteChildAction } from "../actions";
import { STANDARD_SCHOOL_CLASSES, calculateAge } from "@/core/kids/age-eligibility";

interface ChildItem {
  id: string;
  displayName: string;
  birthYear: number | null;
  birthDate: string | null;
  schoolClass: string | null;
  activityNotes: string | null;
}

export function ChildrenManager({ initialChildren }: { initialChildren: ChildItem[] }) {
  const [children, setChildren] = useState<ChildItem[]>(initialChildren);
  const [editingChild, setEditingChild] = useState<ChildItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [birthYear, setBirthYear] = useState<number>(2019);
  const [schoolClass, setSchoolClass] = useState<string>("Class 1");
  const [activityNotes, setActivityNotes] = useState("");

  const startEdit = (child: ChildItem) => {
    setEditingChild(child);
    setDisplayName(child.displayName);
    setBirthYear(child.birthYear || 2019);
    setSchoolClass(child.schoolClass || "Class 1");
    setActivityNotes(child.activityNotes || "");
    setIsAdding(true);
    setError(null);
  };

  const resetForm = () => {
    setEditingChild(null);
    setDisplayName("");
    setBirthYear(2019);
    setSchoolClass("Class 1");
    setActivityNotes("");
    setIsAdding(false);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const res = await saveChildAction({
        id: editingChild?.id,
        displayName,
        birthYear,
        schoolClass,
        activityNotes,
      });

      if (!res.ok) {
        setError(res.error);
        setIsPending(false);
        return;
      }

      if (editingChild) {
        setChildren((prev) =>
          prev.map((c) =>
            c.id === editingChild.id
              ? { ...c, displayName, birthYear, schoolClass, activityNotes }
              : c
          )
        );
      } else if (res.childId) {
        setChildren((prev) => [
          ...prev,
          {
            id: res.childId!,
            displayName,
            birthYear,
            birthDate: null,
            schoolClass,
            activityNotes,
          },
        ]);
      }
      resetForm();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async (childId: string) => {
    if (!confirm("Are you sure you want to remove this child profile?")) return;
    setIsPending(true);
    setError(null);

    try {
      const res = await deleteChildAction({ childId });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setChildren((prev) => prev.filter((c) => c.id !== childId));
    } catch {
      setError("Failed to delete child profile.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border-2 border-red-500 bg-red-50 p-3 text-xs font-bold text-red-900 shadow-[2px_2px_0_0_#ef4444]">
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Children list */}
      <div className="space-y-2.5">
        {children.length === 0 && !isAdding && (
          <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
            <span className="text-4xl" aria-hidden="true">👶</span>
            <p className="mt-2 text-sm font-black text-slate-900">No child profiles yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Add your child once to quickly book classes, workshops, and manage age-appropriate activities.
            </p>
          </div>
        )}

        {children.map((child) => {
          const age = calculateAge(child.birthYear);
          return (
            <div
              key={child.id}
              className="flex items-center justify-between rounded-2xl border-2 border-slate-900 bg-white p-3.5 shadow-[2px_2px_0_0_#0f172a]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-900 bg-amber-200 text-lg shadow-sm">
                  <User className="h-5 w-5 text-slate-900" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-950">{child.displayName}</h4>
                  <p className="text-xs font-semibold text-slate-500">
                    {age > 0 ? `Age ${age}` : ""} {child.schoolClass ? `· ${child.schoolClass}` : ""}
                  </p>
                  {child.activityNotes && (
                    <p className="text-[11px] font-medium text-slate-400 line-clamp-1">
                      {child.activityNotes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(child)}
                  aria-label={`Edit ${child.displayName}`}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(child.id)}
                  aria-label={`Delete ${child.displayName}`}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Form */}
      {isAdding ? (
        <form
          onSubmit={handleSave}
          className="rounded-3xl border-2 border-slate-900 bg-amber-50/70 p-4 shadow-[3px_3px_0_0_#0f172a] space-y-3"
        >
          <h3 className="text-sm font-black text-slate-950">
            {editingChild ? "Edit Child Profile" : "Add Child Profile"}
          </h3>

          <div>
            <label className="block text-[11px] font-bold text-slate-700">Display Name / Nickname</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Aarav, Ananya"
              className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700">Birth Year</label>
              <select
                value={birthYear}
                onChange={(e) => setBirthYear(parseInt(e.target.value, 10))}
                className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-none"
              >
                {Array.from({ length: 14 }, (_, i) => new Date().getFullYear() - 3 - i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr} ({new Date().getFullYear() - yr} yrs)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700">School Class</label>
              <select
                value={schoolClass}
                onChange={(e) => setSchoolClass(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-none"
              >
                {STANDARD_SCHOOL_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700">
              Activity Notes (Allergies, preferences)
            </label>
            <input
              type="text"
              value={activityNotes}
              onChange={(e) => setActivityNotes(e.target.value)}
              placeholder="e.g. Loves building blocks, allergic to peanuts"
              className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full border-2 border-slate-900 bg-amber-400 px-4 py-1.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_0_#0f172a] active:translate-y-0.5 active:shadow-none"
            >
              {isPending ? "Saving..." : editingChild ? "Update Child" : "Save Child"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-900 bg-amber-50 p-3 text-xs font-black text-slate-900 hover:bg-amber-100 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Another Child Profile</span>
        </button>
      )}
    </div>
  );
}
