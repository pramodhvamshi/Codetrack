import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Video, Plus, User, FileText, CheckCircle2, ExternalLink 
} from 'lucide-react';

export function GoogleCalendarView({ 
  role, 
  sessions = [], 
  leaves = [], 
  onSelectDate, 
  onBookSlot, 
  onOpenSession 
}) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Calculate calendar grid days for current month
  const calendarGridDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const pDay = prevMonthDays - i;
      const pDateStr = new Date(year, month - 1, pDay).toISOString().split('T')[0];
      days.push({
        dayNum: pDay,
        dateStr: pDateStr,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === new Date().toISOString().split('T')[0],
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const totalCells = days.length > 35 ? 42 : 35;
    const remainingCells = totalCells - days.length;
    for (let n = 1; n <= remainingCells; n++) {
      const nDateStr = new Date(year, month + 1, n).toISOString().split('T')[0];
      days.push({
        dayNum: n,
        dateStr: nDateStr,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(new Date().toISOString().split('T')[0]);
  };

  // Map sessions & leaves to dates
  const eventsByDate = useMemo(() => {
    const map = {};

    // Add Mentoring Sessions
    sessions.forEach((s) => {
      if (!s.date) return;
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push({
        id: s._id,
        type: 'mentoring',
        title: s.category || 'Mentoring',
        timeSlot: s.timeSlot,
        studentName: s.studentId?.name || 'Student',
        status: s.status,
        meetingUrl: s.meetingUrl,
        raw: s,
      });
    });

    // Add Leave Requests
    leaves.forEach((l) => {
      if (!l.startDate) return;
      const stDate = new Date(l.startDate).toISOString().split('T')[0];
      if (!map[stDate]) map[stDate] = [];
      map[stDate].push({
        id: l._id,
        type: 'leave',
        title: `${l.reasonType} Leave`,
        duration: l.duration,
        status: l.status,
        raw: l,
      });
    });

    return map;
  }, [sessions, leaves]);

  return (
    <div className="ct-calendar-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <style>{`
        .ct-calendar-wrapper {
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(59, 130, 246, 0.25);
          border-radius: 24px;
          padding: 1.5rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }
        .ct-cal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          background: linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 1rem 1.2rem;
        }
        .ct-cal-nav {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .ct-cal-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #f1f5f9;
          padding: 0.5rem 0.95rem;
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.18s;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .ct-cal-btn:hover {
          background: rgba(59, 130, 246, 0.25);
          border-color: rgba(59, 130, 246, 0.5);
          color: #60a5fa;
          transform: translateY(-1px);
        }
        .ct-cal-title {
          font-size: 1.4rem;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.02em;
          margin-left: 0.5rem;
        }
        .ct-cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }
        .ct-cal-weekday {
          text-align: center;
          padding: 0.6rem 0.4rem;
          font-size: 0.78rem;
          font-weight: 800;
          color: #818cf8;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          background: rgba(9, 13, 22, 0.5);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.03);
        }
        .ct-cal-day {
          min-height: 110px;
          background: rgba(9, 13, 22, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 0.6rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          cursor: pointer;
          transition: all 0.18s ease;
          position: relative;
        }
        .ct-cal-day:hover {
          border-color: #3b82f6;
          background: rgba(30, 41, 59, 0.85);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
        }
        .ct-cal-day.other-month {
          opacity: 0.3;
        }
        .ct-cal-day.today {
          border: 2px solid #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        }
        .ct-cal-day.selected {
          border: 2px solid #a855f7;
          background: rgba(168, 85, 247, 0.12);
        }
        .ct-cal-day-num {
          font-size: 0.82rem;
          font-weight: 900;
          color: #cbd5e1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ct-cal-day.today .ct-cal-day-num span {
          background: #3b82f6;
          color: #0b1120;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
        }
        .ct-event-chip {
          padding: 0.3rem 0.5rem;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          transition: transform 0.15s;
        }
        .ct-event-chip:hover {
          transform: scale(1.02);
        }
        .ct-event-mentoring {
          background: rgba(139, 92, 246, 0.25);
          color: #d8b4fe;
          border: 1px solid rgba(139, 92, 246, 0.4);
        }
        .ct-event-leave {
          background: rgba(245, 158, 11, 0.25);
          color: #fde047;
          border: 1px solid rgba(245, 158, 11, 0.4);
        }
      `}</style>

      {/* Google Calendar Header Bar */}
      <div className="ct-cal-header">
        <div className="ct-cal-nav">
          <button type="button" onClick={goToToday} className="ct-cal-btn">
            Today
          </button>
          <button type="button" onClick={prevMonth} className="ct-cal-btn">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={nextMonth} className="ct-cal-btn">
            <ChevronRight size={16} />
          </button>
          <h2 className="ct-cal-title">
            {monthNames[month]} {year}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: '#090d16', padding: '4px', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              style={{
                background: viewMode === 'month' ? '#2563eb' : 'transparent',
                color: viewMode === 'month' ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Month View
            </button>
          </div>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="ct-cal-grid">
        {daysOfWeek.map((day) => (
          <div key={day} className="ct-cal-weekday">
            {day}
          </div>
        ))}

        {/* 35 or 42 Calendar Cells */}
        {calendarGridDays.map((cell, idx) => {
          const dayEvents = eventsByDate[cell.dateStr] || [];
          const isSelected = selectedDay === cell.dateStr;
          return (
            <div
              key={idx}
              onClick={() => {
                setSelectedDay(cell.dateStr);
                if (onSelectDate) onSelectDate(cell.dateStr);
              }}
              className={`ct-cal-day ${!cell.isCurrentMonth ? 'other-month' : ''} ${cell.isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
            >
              <div className="ct-cal-day-num">
                <span>{cell.dayNum}</span>
                {dayEvents.length > 0 && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#60a5fa' }}>({dayEvents.length})</span>
                )}
              </div>

              {/* Display Event Chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflow: 'hidden', marginTop: '0.2rem' }}>
                {dayEvents.slice(0, 3).map((ev, i) => (
                  <div
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (ev.type === 'mentoring') {
                        navigate(`/services/mentoring/${ev.id}`);
                      } else if (onOpenSession) {
                        onOpenSession(ev.raw);
                      }
                    }}
                    className={`ct-event-chip ${ev.type === 'mentoring' ? 'ct-event-mentoring' : 'ct-event-leave'}`}
                  >
                    {ev.type === 'mentoring' ? (
                      <>
                        <Video size={10} />
                        <span>{ev.timeSlot ? ev.timeSlot.split('-')[0] : ev.title}</span>
                      </>
                    ) : (
                      <>
                        <FileText size={10} />
                        <span>{ev.title}</span>
                      </>
                    )}
                  </div>
                ))}

                {dayEvents.length > 3 && (
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 800, paddingLeft: '4px' }}>
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
