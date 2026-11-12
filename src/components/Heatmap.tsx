'use client';

import React, { useState, useEffect } from 'react';

interface HeatmapProps {
  activityData?: Array<{ activity_date: string; recording_count: number }>;
}

export default function Heatmap({ activityData = [] }: HeatmapProps) {
  // Generate 52 weeks x 7 days (364 cells) ending today, computed on client mount
  const [cells, setCells] = useState<Array<{ date: string; level: number; count: number }>>(() => {
    return Array.from({ length: 52 * 7 }, () => ({ date: '', level: 0, count: 0 }));
  });

  useEffect(() => {
    const activityMap = new Map<string, number>();
    activityData.forEach((item) => {
      activityMap.set(item.activity_date, item.recording_count);
    });

    const today = new Date();
    const result: Array<{ date: string; level: number; count: number }> = [];

    const totalDays = 52 * 7;
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];

      let level = 0;
      const count = activityMap.get(dateKey) || 0;

      if (count >= 4) level = 4;
      else if (count === 3) level = 3;
      else if (count === 2) level = 2;
      else if (count === 1) level = 1;

      result.push({ date: dateKey, level, count });
    }

    setCells(result);
  }, [activityData]);

  const getCellColorClass = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-[#CDC7BB]';
      case 2:
        return 'bg-[#8E887D]';
      case 3:
        return 'bg-[#3A3833]';
      case 4:
        return 'bg-[#0E0D0B]';
      default:
        return 'bg-[#EFECE6]';
    }
  };

  return (
    <div className="select-none overflow-hidden rounded-[24px] border border-[#E7E3DB] bg-white p-5 shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)] sm:p-6">
      <div className="w-full overflow-x-auto pb-1 scrollbar-thin">
        <div className="min-w-[560px]">
          <div className="flex items-start">
            {/* Weekday Labels (Mon, Wed, Fri) */}
            <div
              className="w-7 flex-shrink-0 pt-5 pr-2 flex flex-col justify-between text-[10px] text-slate-400 font-medium leading-none"
              style={{ height: '80px' }}
            >
              <span style={{ marginTop: '10px' }}>Mon</span>
              <span style={{ marginTop: '12px' }}>Wed</span>
              <span style={{ marginTop: '12px' }}>Fri</span>
            </div>

            {/* Heatmap Grid & Month Labels */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Months Row */}
              <div className="flex justify-between text-[10px] text-slate-400 font-medium pb-1.5 w-full pr-1">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
              </div>

              {/* Matrix Cells: 52 columns x 7 rows */}
              <div
                className="grid grid-rows-7 grid-flow-col gap-[2.5px] justify-between"
                style={{ height: '80px' }}
              >
                {cells.map((cell, index) => (
                  <div
                    key={index}
                    title={`${cell.date}: ${cell.count} recording${cell.count === 1 ? '' : 's'}`}
                    className={`w-2 h-2 rounded-[2px] transition-colors ${getCellColorClass(cell.level)}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3 sm:mt-4 text-[10px] sm:text-[11px] text-slate-400">
        <span className="mr-0.5">Less</span>
        <span className="w-2.5 h-2.5 rounded-[2px] bg-[#EFECE6]"></span>
        <span className="w-2.5 h-2.5 rounded-[2px] bg-[#CDC7BB]"></span>
        <span className="w-2.5 h-2.5 rounded-[2px] bg-[#8E887D]"></span>
        <span className="w-2.5 h-2.5 rounded-[2px] bg-[#3A3833]"></span>
        <span className="w-2.5 h-2.5 rounded-[2px] bg-[#0E0D0B]"></span>
        <span className="ml-0.5">More</span>
      </div>
    </div>
  );
}

