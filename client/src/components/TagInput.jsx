import React, { useState } from "react";
import { X } from "lucide-react";

/** Simple comma/enter-delimited tag input for skill/requirement lists. */
export default function TagInput({ value = [], onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const cleaned = draft.trim().replace(/,$/, "");
    if (cleaned && !value.includes(cleaned)) onChange([...value, cleaned]);
    setDraft("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="input flex flex-wrap gap-1.5 items-center min-h-[42px] py-1.5">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 bg-accent-50 text-accent-700 text-xs rounded-full px-2 py-1">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))}>
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[100px] outline-none text-sm bg-transparent"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={value.length ? "" : placeholder}
      />
    </div>
  );
}
