"use client";

import { UiIcon } from "@/components/ui/app-icon";

import { useState } from "react";
import { Plus, User, Trash2, Edit2, ShieldAlert } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { saveChildAction, deleteChildAction } from "../actions";
import { kidsPrimaryButton, kidsSecondaryButton } from "./kids-ui";
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
    if (!confirm("Remove this child profile?")) return;
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
        <div role="alert" className="flex items-center gap-2 rounded-[16px] border border-bad/25 bg-bad/5 p-3 text-sm font-medium text-bad">
          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Children list */}
      <div className="space-y-2.5">
        {children.length === 0 && !isAdding && (
          <div className="rounded-[20px] border border-dashed border-kids-ink/20 bg-white p-6 text-center">
            <UiIcon name="age" className="h-6 w-6 text-accent" />
            <p className="mt-2 text-base font-semibold text-kids-ink">No child profiles yet</p>
            <p className="mt-1 text-sm text-kids-ink/65">
              Add your child once to quickly book classes, workshops, and manage age-appropriate activities.
            </p>
          </div>
        )}

        {children.map((child) => {
          const age = calculateAge(child.birthYear);
          return (
            <div
              key={child.id}
              className="flex items-center justify-between rounded-[20px] border border-kids-ink/10 bg-white p-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-kids-sunny/70">
                  <User className="h-5 w-5 text-kids-ink" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-kids-ink">{child.displayName}</h3>
                  <p className="text-sm text-kids-ink/65">
                    {[age > 0 ? `Age ${age}` : null, child.schoolClass].filter(Boolean).join(" · ")}
                  </p>
                  {child.activityNotes && (
                    <p className="line-clamp-1 text-xs text-kids-ink/60">
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
                  disabled={isPending}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-kids-ink/65 hover:bg-kids-ink/5 hover:text-kids-ink disabled:opacity-50"
                >
                  <Edit2 className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(child.id)}
                  aria-label={`Remove ${child.displayName}`}
                  disabled={isPending}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-kids-ink/65 hover:bg-bad/5 hover:text-bad disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
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
          className="space-y-3 rounded-[20px] border border-kids-ink/10 bg-white p-4"
        >
          <h2 className="text-base font-semibold text-kids-ink">
            {editingChild ? "Edit child profile" : "Add a child"}
          </h2>

          <div>
            <label htmlFor="child-name" className="block text-sm font-semibold text-kids-ink">Name or nickname</label>
            <input
              id="child-name"
              type="text"
              required
              minLength={2}
              maxLength={50}
              autoComplete="off"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Aarav"
              className="mt-1 w-full rounded-[12px] border border-kids-ink/15 bg-white px-3 py-2 text-base text-kids-ink placeholder:text-kids-ink/45"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="child-birth-year" className="block text-sm font-semibold text-kids-ink">Birth year</label>
              <select
                id="child-birth-year"
                value={birthYear}
                onChange={(e) => setBirthYear(parseInt(e.target.value, 10))}
                className="mt-1 w-full rounded-[12px] border border-kids-ink/15 bg-white px-3 py-2 text-base text-kids-ink placeholder:text-kids-ink/45"
              >
                {Array.from({ length: 14 }, (_, i) => new Date().getFullYear() - 3 - i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr} ({new Date().getFullYear() - yr} yrs)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="child-class" className="block text-sm font-semibold text-kids-ink">School class</label>
              <select
                id="child-class"
                value={schoolClass}
                onChange={(e) => setSchoolClass(e.target.value)}
                className="mt-1 w-full rounded-[12px] border border-kids-ink/15 bg-white px-3 py-2 text-base text-kids-ink placeholder:text-kids-ink/45"
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
            <label htmlFor="child-notes" className="block text-sm font-semibold text-kids-ink">
              Notes for teachers (optional)
            </label>
            <input
              id="child-notes"
              type="text"
              maxLength={500}
              value={activityNotes}
              onChange={(e) => setActivityNotes(e.target.value)}
              placeholder="Allergies, interests, anything a teacher should know"
              className="mt-1 w-full rounded-[12px] border border-kids-ink/15 bg-white px-3 py-2 text-base text-kids-ink placeholder:text-kids-ink/45"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className={kidsSecondaryButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(kidsPrimaryButton, "disabled:opacity-50")}
            >
              {isPending ? "Saving…" : editingChild ? "Save changes" : "Add child"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[20px] border border-dashed border-kids-ink/25 bg-white px-3 text-sm font-semibold text-kids-ink transition-colors hover:border-kids-ink/45"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{children.length === 0 ? "Add a child" : "Add another child"}</span>
        </button>
      )}
    </div>
  );
}
