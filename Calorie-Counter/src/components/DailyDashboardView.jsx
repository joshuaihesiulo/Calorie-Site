import { useMemo, useState } from 'react';
import { computeStreak, useBoundStore } from '../store/useBoundStore';
import MealModal from './MealModal';
import { UserIcon, CheckCircleIcon, XIcon, FlameIcon, UtensilsIcon, PotIcon, PencilIcon, TrashIcon, CameraIcon } from './icons';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const GOAL_CALORIES = 2400;

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildDayOptions() {
  const days = [];
  for (let i = 0; i < 14; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const isToday = i === 0;
    days.push({
      dateKey: dateKey(date),
      label: isToday ? 'Today' : `${DAY_LABELS[date.getDay()]} ${date.getDate()}`,
      fullLabel: `${DAY_LABELS[date.getDay()]}, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    });
  }
  return days.reverse();
}

export default function DailyDashboardView() {
  const setView = useBoundStore((state) => state.setView);
  const user = useBoundStore((state) => state.user);
  const signout = useBoundStore((state) => state.signout);
  const loggedMeals = useBoundStore((state) => state.loggedMeals);
  const lastCommittedMeal = useBoundStore((state) => state.lastCommittedMeal);
  const addAnotherServing = useBoundStore((state) => state.addAnotherServing);
  const dismissLastCommitted = useBoundStore((state) => state.dismissLastCommitted);
  const deleteMeal = useBoundStore((state) => state.deleteMeal);

  const dayOptions = useMemo(() => buildDayOptions(), []);
  const todayKey = dayOptions[dayOptions.length - 1].dateKey;
  const [selectedKey, setSelectedKey] = useState(todayKey);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);

  const selectedMeals = loggedMeals
    .filter((meal) => meal.dateKey === selectedKey)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const selectedCalories = selectedMeals.reduce((acc, meal) => acc + meal.calories, 0);
  const streak = useMemo(() => computeStreak(loggedMeals), [loggedMeals]);

  const displayName = user?.name || 'there';
  const selectedMeta = dayOptions.find((d) => d.dateKey === selectedKey);

  const openAdd = () => {
    setEditingMeal(null);
    setModalOpen(true);
  };

  const openEdit = (meal) => {
    setEditingMeal(meal);
    setModalOpen(true);
  };

  return (
    <div className="w-full min-h-[85vh] lg:min-h-[75vh] flex flex-col p-5 sm:p-6 lg:p-8 text-[#2C3768]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-[#00F090] overflow-hidden bg-gray-100 flex-shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.name || 'User'} className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center bg-gray-200">
                <UserIcon className="w-5 h-5 text-gray-400" />
              </span>
            )}
          </div>
          <div>
            <span className="font-black text-sm lg:text-base tracking-tight block">Hello, {displayName}</span>
            <span className="text-[11px] font-bold text-gray-400 block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={signout} className="bg-[#FFF4CA] hover:bg-opacity-80 px-4 py-2 rounded-xl text-xs font-bold transition-all">Log Out</button>
        </div>
      </div>

      {user && user.emailVerified === false && (
        <div className="mb-6 bg-[#FFF4CA]/60 border border-[#E7B200]/30 rounded-2xl px-4 py-3 text-xs font-bold text-[#2C3768]">
          Verify your email to keep your account secure — check your inbox for the link we sent.
        </div>
      )}

      {lastCommittedMeal && (
        <div className="mb-6 bg-[#E7F7AD]/60 border border-[#E7F7AD] rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="text-xs font-black flex-1 min-w-[200px] flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
            Logged {lastCommittedMeal.name} — {lastCommittedMeal.calories} Kcal
          </span>
          <div className="flex gap-2">
            <button
              onClick={addAnotherServing}
              className="bg-[#2C3768] text-white text-xs font-black px-3 py-2 rounded-xl hover:opacity-90 transition-all"
            >
              Add Another Serving
            </button>
            <button
              onClick={() => setView('scan')}
              className="bg-white text-[#2C3768] text-xs font-black px-3 py-2 rounded-xl border border-[#2C3768]/20 hover:bg-gray-50 transition-all whitespace-nowrap"
            >
              Scan Another Plate
            </button>
            <button onClick={dismissLastCommitted} className="text-[#2C3768]/40 hover:text-[#2C3768] px-1" aria-label="Dismiss">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-1 sm:gap-2 mb-5 overflow-x-auto pb-1">
            {dayOptions.map((day) => {
              const active = day.dateKey === selectedKey;
              const hasMeals = loggedMeals.some((meal) => meal.dateKey === day.dateKey);
              return (
                <button
                  key={day.dateKey}
                  onClick={() => setSelectedKey(day.dateKey)}
                  className={
                    active
                      ? 'border-2 border-[#00F090] px-3 sm:px-4 py-2 rounded-2xl font-black text-xs text-center shadow-sm bg-white flex-shrink-0'
                      : 'text-xs font-black text-gray-400 flex-shrink-0 px-2 hover:text-[#2C3768] transition-all'
                  }
                >
                  {day.label}
                  {hasMeals && !active && <span className="ml-1 text-[#E92A43]">•</span>}
                </button>
              );
            })}
          </div>

          <div className="border border-gray-100 rounded-[2.5rem] p-5 sm:p-6 shadow-xs bg-white">
            <span className="text-xs font-black text-gray-400 block mb-1">
              {selectedKey === todayKey ? "Today's Calories" : `${selectedMeta?.fullLabel} Calories`}
            </span>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-5xl sm:text-6xl font-black tracking-tighter">{selectedCalories}</span>
              <span className="text-xl font-black tracking-tight">Kcal</span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-[#2C3768] h-full rounded-full" style={{ width: `${Math.min(100, (selectedCalories / GOAL_CALORIES) * 100)}%` }} />
            </div>
            <p className="text-[11px] font-bold text-gray-400 mt-2">
              {Math.round((selectedCalories / GOAL_CALORIES) * 100)}% of daily goal {selectedKey === todayKey ? '' : `(was ${selectedMeta?.fullLabel})`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 lg:w-56 xl:w-64">
          <div className="bg-[#E7F7AD]/50 border border-[#E7F7AD] rounded-2xl p-4 text-center">
            <span className="text-[10px] font-bold text-gray-500 block mb-0.5">Goal</span>
            <span className="text-sm lg:text-base font-black">{GOAL_CALORIES.toLocaleString()} cal</span>
          </div>
          <div className="bg-[#00F090] rounded-2xl p-4 text-center shadow-xs">
            <span className="text-[10px] font-black text-[#2C3768]/70 block mb-0.5">Logged</span>
            <span className="text-sm lg:text-base font-black">{selectedCalories.toLocaleString()} cal</span>
          </div>
          <div className="bg-[#E7F7AD]/50 border border-[#E7F7AD] rounded-2xl p-4 text-center">
            <span className="text-[10px] font-bold text-gray-500 block mb-0.5">Day Streak</span>
            <span className="text-sm lg:text-base font-black">{streak} {streak === 1 ? 'day' : 'days'} <FlameIcon className="w-4 h-4 inline-block -mt-0.5 text-[#FF7A30]" /></span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        <div className="lg:w-72 xl:w-80">
          <h3 className="text-xl lg:text-2xl font-black tracking-tight mb-4">Your Habits</h3>
          <div className="space-y-3">
            <div className="bg-[#00F090]/10 border border-[#00F090]/10 rounded-2xl p-4 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#00F090] flex-shrink-0" />
              <span className="text-xs font-bold leading-tight">Exercise — Target 30 mins active daily</span>
            </div>
            <div className="bg-[#00F090]/10 border border-[#00F090]/10 rounded-2xl p-4 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#3CE8E3] flex-shrink-0" />
              <span className="text-xs font-bold leading-tight">Hydration — Log water before lunch</span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black tracking-tight">{selectedKey === todayKey ? "Today's Food Log" : `Food Log — ${selectedMeta?.fullLabel}`}</h3>
            <button onClick={openAdd} className="bg-[#2C3768] hover:opacity-90 text-white text-xs font-black px-3 py-2 rounded-xl transition-all">
              + Add Meal
            </button>
          </div>
          <div className="space-y-2.5 flex-1 max-h-[250px] overflow-y-auto">
            {selectedMeals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <UtensilsIcon className="w-9 h-9 text-gray-300 mb-2" />
                <p className="text-xs font-bold text-gray-400">
                  {selectedKey === todayKey
                    ? 'No meals logged yet. Scan your first plate to get started.'
                    : 'Nothing logged on this day yet.'}
                </p>
              </div>
            ) : (
              selectedMeals.map((meal) => (
                <div key={meal.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 border border-gray-100">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#2C3768]/10 flex items-center justify-center flex-shrink-0">
                    <PotIcon className="w-5 h-5 text-[#2C3768]/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-black block truncate">{meal.name}</span>
                    <span className="text-[10px] font-bold text-gray-400">{meal.date}{meal.grams ? ` · ${meal.grams} g` : ''}</span>
                  </div>
                  <span className="text-xs font-black whitespace-nowrap">{meal.calories} Kcal</span>
                  <button
                    onClick={() => openEdit(meal)}
                    title="Edit meal"
                    className="text-[#2C3768]/40 hover:text-[#2C3768] text-xs font-black px-1.5 py-1 transition-all"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMeal(meal.id)}
                    title="Delete meal"
                    className="text-[#E92A43]/40 hover:text-[#E92A43] text-xs font-black px-1.5 py-1 transition-all"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setView('scan')}
        className="w-full bg-[#E92A43] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#E92A43]/10 mt-6 lg:mt-8 hover:opacity-95 transition-all text-center"
      >
        <CameraIcon className="w-5 h-5 inline-block -mt-0.5" /> Scan New Meal Platter
      </button>

      {modalOpen && (
        <MealModal
          key={editingMeal?.id || 'new-meal'}
          open
          meal={editingMeal}
          onClose={() => {
            setModalOpen(false);
            setEditingMeal(null);
          }}
        />
      )}
    </div>
  );
}