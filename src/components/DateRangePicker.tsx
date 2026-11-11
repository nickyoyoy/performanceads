import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DatePreset } from '../types/ads';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
  X,
} from 'lucide-react';
import { formatDateWIB } from '../utils/formatters';

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  datePreset?: DatePreset;
  availableDates: string[];
  activeDateRangeText: string;
  onApply: (start?: string, end?: string, preset?: DatePreset) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  datePreset = '30d',
  availableDates,
  activeDateRangeText,
  onApply,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Temporary selection state inside the popup
  const [tempStart, setTempStart] = useState<string | null>(startDate || null);
  const [tempEnd, setTempEnd] = useState<string | null>(endDate || null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [tempPreset, setTempPreset] = useState<DatePreset>(datePreset);

  // Calendar month view (defaults to latest available date or current November 2026)
  const [viewYear, setViewYear] = useState<number>(2026);
  const [viewMonth, setViewMonth] = useState<number>(10); // 0-indexed: 10 = November

  // Initialize view month based on available dates or current selection
  useEffect(() => {
    if (startDate) {
      const [y, m] = startDate.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
      setTempStart(startDate);
      setTempEnd(endDate || startDate);
    } else if (availableDates.length > 0) {
      const latest = availableDates[availableDates.length - 1];
      const [y, m] = latest.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
    setTempPreset(datePreset);
  }, [startDate, endDate, datePreset, availableDates]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Set of dates that actually have data in the spreadsheet
  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);

  // Calendar grid calculation for viewYear and viewMonth
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    // Convert Sunday=0 to Monday=0: (day + 6) % 7
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      hasData: boolean;
    }> = [];

    // Empty padding slots for days before start of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({
        dateStr: '',
        dayNumber: 0,
        isCurrentMonth: false,
        hasData: false,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(viewMonth + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${viewYear}-${mm}-${dd}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        hasData: availableSet.has(dateStr),
      });
    }

    return days;
  }, [viewYear, viewMonth, availableSet]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Date click handler in calendar grid
  const handleDateClick = (dateStr: string) => {
    if (!dateStr) return;

    setTempPreset('custom');

    // Case 1: No start date chosen yet, or both start & end already chosen -> restart with new start
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dateStr);
      setTempEnd(null);
      return;
    }

    // Case 2: Start is chosen, end is not chosen yet
    if (tempStart && !tempEnd) {
      if (dateStr < tempStart) {
        // If clicked date is earlier than start date, make it the new start date
        setTempStart(dateStr);
        setTempEnd(null);
      } else {
        // Range completed
        setTempEnd(dateStr);
      }
    }
  };

  // Quick preset selector
  const handleSelectPreset = (preset: DatePreset) => {
    setTempPreset(preset);

    if (preset === 'all') {
      if (availableDates.length > 0) {
        setTempStart(availableDates[0]);
        setTempEnd(availableDates[availableDates.length - 1]);
        const [y, m] = availableDates[availableDates.length - 1].split('-').map(Number);
        setViewYear(y);
        setViewMonth(m - 1);
      } else {
        setTempStart(null);
        setTempEnd(null);
      }
    } else if (preset === '30d') {
      if (availableDates.length > 0) {
        const slice = availableDates.slice(-30);
        setTempStart(slice[0]);
        setTempEnd(slice[slice.length - 1]);
        const [y, m] = slice[slice.length - 1].split('-').map(Number);
        setViewYear(y);
        setViewMonth(m - 1);
      }
    } else if (preset === '7d') {
      if (availableDates.length > 0) {
        const slice = availableDates.slice(-7);
        setTempStart(slice[0]);
        setTempEnd(slice[slice.length - 1]);
        const [y, m] = slice[slice.length - 1].split('-').map(Number);
        setViewYear(y);
        setViewMonth(m - 1);
      }
    } else if (preset === 'mtd') {
      setTempStart('2026-11-01');
      setTempEnd('2026-11-30');
      setViewYear(2026);
      setViewMonth(10);
    } else if (preset === 'prev_month') {
      setTempStart('2026-10-01');
      setTempEnd('2026-10-31');
      setViewYear(2026);
      setViewMonth(9);
    } else if (preset === '2026-11-09') {
      setTempStart('2026-11-09');
      setTempEnd('2026-11-09');
      setViewYear(2026);
      setViewMonth(10);
    } else if (preset === '2026-11-10') {
      setTempStart('2026-11-10');
      setTempEnd('2026-11-10');
      setViewYear(2026);
      setViewMonth(10);
    }
  };

  // Apply changes to parent
  const handleApply = () => {
    if (tempPreset === 'custom') {
      const finalStart = tempStart || undefined;
      const finalEnd = tempEnd || tempStart || undefined;
      onApply(finalStart, finalEnd, 'custom');
    } else {
      onApply(undefined, undefined, tempPreset);
    }
    setIsOpen(false);
  };

  // Reset to default 30d
  const handleReset = () => {
    handleSelectPreset('30d');
  };

  // Helper to determine styling of each day in the calendar grid
  const getDayStyle = (dateStr: string) => {
    if (!dateStr) return '';

    const effectiveEnd = tempEnd || (tempStart && hoveredDate && hoveredDate > tempStart ? hoveredDate : tempStart);

    const isStart = tempStart === dateStr;
    const isEnd = tempEnd === dateStr;
    const isInRange =
      tempStart && effectiveEnd && dateStr > tempStart && dateStr < effectiveEnd;

    let classes = 'relative flex items-center justify-center text-xs h-8 w-8 mx-auto rounded-full transition-all cursor-pointer ';

    if (isStart || isEnd) {
      classes += 'bg-blue-600 text-white font-bold shadow-xs hover:bg-blue-700 ';
    } else if (isInRange) {
      classes += 'bg-blue-100 text-blue-900 font-medium rounded-none first:rounded-l-full last:rounded-r-full hover:bg-blue-200 ';
    } else {
      classes += 'text-slate-700 hover:bg-slate-100 ';
    }

    return classes;
  };

  // Label to display on trigger button
  const triggerLabel = useMemo(() => {
    if (datePreset === 'custom' && startDate && endDate) {
      if (startDate === endDate) return formatDateWIB(startDate);
      return `${formatDateWIB(startDate)} - ${formatDateWIB(endDate)}`;
    }
    if (datePreset === 'all') return `Semua Data (${availableDates.length} Hari)`;
    if (datePreset === '30d') return '30 Hari Terakhir';
    if (datePreset === '7d') return '7 Hari Terakhir';
    if (datePreset === 'mtd') return 'November 2026 (MTD)';
    if (datePreset === 'prev_month') return 'Oktober 2026 (Penuh)';
    if (datePreset === '2026-11-09') return '9 November 2026';
    if (datePreset === '2026-11-10') return '10 November 2026';
    return activeDateRangeText;
  }, [datePreset, startDate, endDate, availableDates, activeDateRangeText]);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Pilih rentang tanggal dan periode"
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
          isOpen || datePreset === 'custom'
            ? 'bg-blue-50 text-blue-800 border-blue-300 ring-2 ring-blue-100 shadow-2xs'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-2xs'
        }`}
      >
        <CalendarIcon className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
        <span className="font-mono text-slate-900 font-medium truncate max-w-[220px]">
          {triggerLabel}
        </span>
        {datePreset === 'custom' && (
          <span className="px-1.5 py-0.2 text-3xs font-bold uppercase tracking-wider bg-blue-600 text-white rounded">
            Kustom
          </span>
        )}
      </button>

      {/* Calendar Dropdown Modal / Popup */}
      {isOpen && (
        <div className="absolute left-0 mt-2 z-40 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden w-[340px] sm:w-[620px] transition-all">
          {/* Header Modal */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Pilih Periode & Kalender Rentang Tanggal
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row">
            {/* Left Column: Preset Shortcuts */}
            <div className="w-full sm:w-48 bg-slate-50/80 p-3 border-b sm:border-b-0 sm:border-r border-slate-200 space-y-1">
              <div className="text-3xs font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Preset Cepat
              </div>

              {[
                { id: '30d' as DatePreset, label: '30 Hari Terakhir' },
                { id: '7d' as DatePreset, label: '7 Hari Terakhir' },
                { id: 'mtd' as DatePreset, label: 'November 2026 (MTD)' },
                { id: 'prev_month' as DatePreset, label: 'Oktober 2026' },
                { id: 'all' as DatePreset, label: `Semua Data (${availableDates.length} Hari)` },
                { id: '2026-11-09' as DatePreset, label: '9 Nov (Data Awal)' },
                { id: '2026-11-10' as DatePreset, label: '10 Nov (Hari Ini)' },
                { id: 'custom' as DatePreset, label: '🗓️ Kustom Tanggal...' },
              ].map(preset => {
                const isSelected = tempPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200/70'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>

            {/* Right Column: Interactive Calendar Grid */}
            <div className="flex-1 p-4 bg-white">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-3 px-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Bulan sebelumnya"
                  className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-xs font-bold text-slate-900 font-sans">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Bulan berikutnya"
                  className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {DAY_NAMES.map(day => (
                  <div key={day} className="text-3xs font-bold text-slate-400 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days Matrix */}
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {calendarDays.map((cell, idx) => {
                  if (!cell.isCurrentMonth) {
                    return <div key={`empty-${idx}`} className="h-8 w-8 mx-auto" />;
                  }

                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() => handleDateClick(cell.dateStr)}
                      onMouseEnter={() => tempStart && !tempEnd && setHoveredDate(cell.dateStr)}
                      className={getDayStyle(cell.dateStr)}
                      title={`${cell.dateStr}${cell.hasData ? ' (Data tersedia)' : ''}`}
                    >
                      <span>{cell.dayNumber}</span>
                      {cell.hasData && (
                        <span
                          className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                            tempStart === cell.dateStr || tempEnd === cell.dateStr
                              ? 'bg-white'
                              : 'bg-blue-600'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Manual Date Input Fields */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-3xs font-semibold text-slate-500 uppercase block mb-0.5">
                    Tanggal Awal (Dari):
                  </label>
                  <input
                    type="date"
                    value={tempStart || ''}
                    onChange={e => {
                      setTempPreset('custom');
                      setTempStart(e.target.value || null);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-3xs font-semibold text-slate-500 uppercase block mb-0.5">
                    Tanggal Akhir (Sampai):
                  </label>
                  <input
                    type="date"
                    value={tempEnd || tempStart || ''}
                    onChange={e => {
                      setTempPreset('custom');
                      setTempEnd(e.target.value || null);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Controls: Batal & Terapkan */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset (30 Hari)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-md transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Terapkan Rentang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
