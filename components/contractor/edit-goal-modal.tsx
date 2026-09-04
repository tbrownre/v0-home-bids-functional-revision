"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setMonthGoal } from "@/lib/contractor-goal";

const PRESETS = [10, 15, 20, 30, 40];

export function EditGoalModal({
  open,
  currentGoal,
  onClose,
  onSaved,
}: {
  open: boolean;
  currentGoal: number;
  onClose: () => void;
  onSaved: (goal: number) => void;
}) {
  const [value, setValue] = useState(String(currentGoal));

  useEffect(() => {
    if (open) setValue(String(currentGoal));
  }, [open, currentGoal]);

  function save() {
    const parsed = parseInt(value, 10);
    const next = setMonthGoal(Number.isFinite(parsed) && parsed > 0 ? parsed : currentGoal);
    onSaved(next);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md rounded-3xl">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary">Monthly tracker</p>
        <DialogTitle className="text-2xl font-extrabold tracking-tight">Set your bid goal</DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
          Pick a number that feels realistic for your business. You can change it anytime.
        </DialogDescription>

        <div className="mt-1 flex flex-wrap gap-2">
          {PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setValue(String(n))}
              className={`rounded-full border px-3.5 py-2 text-sm font-bold transition-colors ${
                value === String(n)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:text-primary"
              }`}
            >
              {n} bids
            </button>
          ))}
        </div>

        <Input
          type="number"
          min={1}
          max={200}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-16 rounded-2xl text-center text-3xl font-extrabold"
          aria-label="Monthly bid goal"
        />

        <div className="mt-1 flex justify-end gap-2">
          <Button variant="outline" className="rounded-full font-semibold" onClick={onClose}>
            Cancel
          </Button>
          <Button className="rounded-full font-semibold" onClick={save}>
            Save goal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
