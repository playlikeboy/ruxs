"use client";

import { useState } from "react";
import { Calendar, ChevronRight } from "lucide-react";

const DEFAULT_SCHEDULE = [
  { day: "Monday", lunch: "Dal Tadka, Mix Veg, Jeera Rice, 4 Rotis, Salad", dinner: "Paneer Bhurji, Arhar Dal, Phulkas, Rice" },
  { day: "Tuesday", lunch: "Rajma Masala, Aloo Gobi, Steamed Basmati, 4 Rotis", dinner: "Kadhai Paneer, Yellow Dal, 4 Rotis, Gulab Jamun" },
  { day: "Wednesday", lunch: "Chole Masala, Bhindi Fry, Rice, 4 Rotis, Raita", dinner: "Egg Curry / Malai Kofta, Jeera Rice, Phulkas" },
  { day: "Thursday", lunch: "Kadhi Pakora, Aloo Jeera, Steamed Rice, 4 Rotis", dinner: "Dal Makhani, Shahi Paneer, 4 Rotis, Salad" },
  { day: "Friday", lunch: "Matar Paneer, Dal Fry, Pulao, 4 Rotis, Papad", dinner: "Chicken Curry / Paneer Do Pyaza, Phulkas, Rice" },
  { day: "Saturday", lunch: "Veg Biryani, Mirchi Ka Salan, Boondi Raita, Gulab Jamun", dinner: "Khichdi with Desi Ghee, Baingan Bharta, Chokha" },
  { day: "Sunday", lunch: "Chef's Special Thali: Paneer Butter Masala, Dal Makhani, Naan, Kheer", dinner: "Light Dinner: Dal Tadka, Seasonal Sabzi, Phulkas" },
];

export function WeeklyMenuSchedule() {
  const [activeDay, setActiveDay] = useState(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()] || "Monday";
  });

  const current = DEFAULT_SCHEDULE.find((s) => s.day === activeDay) ?? DEFAULT_SCHEDULE[0]!;

  return (
    <div className="rounded-[18px] border border-line bg-surface p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-bold text-ink">Weekly Rotating Menu Planner</h3>
        </div>
        <span className="text-xs font-semibold text-accent font-mono bg-peach/80 px-2.5 py-0.5 rounded-full">
          Today: {activeDay}
        </span>
      </div>

      {/* Day Selector Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {DEFAULT_SCHEDULE.map((s) => {
          const isSelected = s.day === activeDay;
          return (
            <button
              key={s.day}
              type="button"
              onClick={() => setActiveDay(s.day)}
              className={
                "shrink-0 rounded-[10px] px-3 py-1.5 text-xs font-semibold transition " +
                (isSelected
                  ? "bg-ink text-white shadow-2xs"
                  : "border border-line bg-bg text-muted hover:text-ink hover:bg-surface")
              }
            >
              {s.day.slice(0, 3)}
            </button>
          );
        })}
      </div>

      {/* Selected Day Dishes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
        <div className="rounded-[12px] bg-bg/80 p-3 border border-line/60 space-y-1">
          <div className="flex items-center justify-between text-muted">
            <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700">Lunch Thali</span>
            <ChevronRight className="h-3 w-3" />
          </div>
          <p className="font-medium text-ink leading-relaxed mt-1">
            {current.lunch}
          </p>
        </div>

        <div className="rounded-[12px] bg-bg/80 p-3 border border-line/60 space-y-1">
          <div className="flex items-center justify-between text-muted">
            <span className="font-bold uppercase tracking-wider text-[10px] text-purple-700">Dinner Thali</span>
            <ChevronRight className="h-3 w-3" />
          </div>
          <p className="font-medium text-ink leading-relaxed mt-1">
            {current.dinner}
          </p>
        </div>
      </div>
    </div>
  );
}
