import { useEffect, useMemo, useState } from 'react';
import { computeStreak, useBoundStore } from '../store/useBoundStore';
import MealModal from './MealModal';
import { UserIcon, CheckCircleIcon, XIcon, FlameIcon, UtensilsIcon, PotIcon, PencilIcon, TrashIcon, RepeatIcon, CameraIcon } from './icons';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const GOAL_PRESETS = [1600, 1800, 2000, 2200, 2400, 2800, 3200];

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

function bestStreak(meals) {
  const days = [...new Set((meals || []).map((m) => m.dateKey).filter(Boolean))].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const day of days) {
    const diff = prev ? (new Date(day) - new Date(prev)) / 86400000 : 0;
    run = diff === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
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
  const calorieGoal = useBoundStore((state) => state.calorieGoal);
  const setGoal = useBoundStore((state) => state.setGoal);
  const templates = useBoundStore((state) => state.templates);
  const addTemplate = useBoundStore((state) => state.addTemplate);
  const deleteTemplate = useBoundStore((state) => state.deleteTemplate);
  const logTemplate = useBoundStore((state) => state.logTemplate);
  const repeatMeal = useBoundStore((state) => state.repeatMeal);

  const dayOptions = useMemo(() => buildDayOptions(), []);
  const todayKey = dayOptions[dayOptions.length - 1].dateKey;
  const [selectedKey, setSelectedKey] = useState(todayKey);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState(calorieGoal);
  const [comboNaming, setComboNaming] = useState(false);
  const [comboName, setComboName] = useState('');
  const [combosOpen, setCombosOpen] = useState(false);

  const mealsByKey = useMemo(() => {
    const map = new Map();
    for (const meal of loggedMeals) {
      const list = map.get(meal.dateKey);
      if (list) list.push(meal);
      else map.set(meal.dateKey, [meal]);
    }
    return map;
  }, [loggedMeals]);

  const selectedMeals = useMemo(
    () => (mealsByKey.get(selectedKey) || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [mealsByKey, selectedKey]
  );
  const selectedCalories = useMemo(() => selectedMeals.reduce((acc, meal) => acc + meal.calories, 0), [selectedMeals]);
  const streak = useMemo(() => computeStreak(loggedMeals), [loggedMeals]);

  const recentMeals = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffKey = dateKey(cutoff);
    const counts = new Map();
    const samples = new Map();
    for (const meal of loggedMeals) {
      if (meal.dateKey < cutoffKey) continue;
      counts.set(meal.name, (counts.get(meal.name) || 0) + 1);
      if (!samples.has(meal.name)) samples.set(meal.name, meal);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => samples.get(name))
      .filter(Boolean);
  }, [loggedMeals]);

  const weekStats = useMemo(() => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const weekKey = dateKey(weekStart);
    const weekMeals = loggedMeals.filter((m) => m.dateKey >= weekKey);
    const totalCalories = weekMeals.reduce((acc, m) => acc + m.calories, 0);
    const dishCounts = new Map();
    for (const m of weekMeals) {
      if (!m.name) continue;
      dishCounts.set(m.name, (dishCounts.get(m.name) || 0) + 1);
    }
    const topDish = [...dishCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    return {
      avgCalories: Math.round(totalCalories / 7),
      totalCalories,
      mealCount: weekMeals.length,
      topDish,
    };
  }, [loggedMeals]);

  const bestRun = useMemo(() => bestStreak(loggedMeals), [loggedMeals]);

  useEffect(() => {
    if (!lastCommittedMeal) return undefined;
    const timer = setTimeout(dismissLastCommitted, 5000);
    return () => clearTimeout(timer);
  }, [lastCommittedMeal, dismissLastCommitted]);

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

  const openGoalModal = () => {
    setGoalDraft(calorieGoal);
    setGoalModalOpen(true);
  };

  const saveGoal = () => {
    setGoal(goalDraft);
    setGoalModalOpen(false);
  };

  const beginComboName = () => {
    setComboName(selectedMeta.fullLabel);
    setComboNaming(true);
  };

  const saveCombo = () => {
    addTemplate(comboName, selectedMeals);
    setComboNaming(false);
    setComboName('');
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
          <button onClick={openGoalModal} className="bg-[#00F090]/15 border border-[#00F090]/40 hover:bg-[#00F090]/30 px-4 py-2 rounded-xl text-xs font-bold transition-all">
            Set Goal
          </button>
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
              const hasMeals = mealsByKey.has(day.dateKey);
              return (
                <button
                  key={day.dateKey}
                  onClick={() => setSelectedKey(day.dateKey)}
                  className={
                    active
                      ? 'border-2 border-[#00F090] px-3 sm:px-4 min-h-11 flex items-center justify-center rounded-2xl font-black text-xs text-center shadow-sm bg-white flex-shrink-0'
                      : 'text-xs font-black text-gray-400 flex-shrink-0 px-2 min-h-11 flex items-center justify-center hover:text-[#2C3768] transition-all'
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
              <div className="bg-[#2C3768] h-full rounded-full" style={{ width: `${Math.min(100, (selectedCalories / calorieGoal) * 100)}%` }} />
            </div>
            <p className="text-[11px] font-bold text-gray-400 mt-2">
              {Math.round((selectedCalories / calorieGoal) * 100)}% of your {calorieGoal.toLocaleString()} Kcal goal {selectedKey === todayKey ? '' : `(was ${selectedMeta?.fullLabel})`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 lg:w-56 xl:w-64">
          <button onClick={openGoalModal} className="bg-[#E7F7AD]/50 hover:bg-[#E7F7AD]/80 border border-[#E7F7AD] rounded-2xl p-4 text-center transition-all animate-softPop" style={{ animationDelay: '60ms' }}>
            <span className="text-[10px] font-bold text-gray-500 block mb-0.5">Goal</span>
            <span className="text-sm lg:text-base font-black">{calorieGoal.toLocaleString()} cal</span>
          </button>
          <div className="bg-[#00F090] rounded-2xl p-4 text-center shadow-xs animate-softPop" style={{ animationDelay: '140ms' }}>
            <span className="text-[10px] font-black text-[#2C3768]/70 block mb-0.5">Logged</span>
            <span className="text-sm lg:text-base font-black">{selectedCalories.toLocaleString()} cal</span>
          </div>
          <div className="bg-[#E7F7AD]/50 border border-[#E7F7AD] rounded-2xl p-4 text-center animate-softPop" style={{ animationDelay: '220ms' }}>
            <span className="text-[10px] font-bold text-gray-500 block mb-0.5">Day Streak</span>
            <span className="text-sm lg:text-base font-black">{streak} {streak === 1 ? 'day' : 'days'} <FlameIcon className="w-4 h-4 inline-block -mt-0.5 text-[#FF7A30]" /></span>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 animate-fadeUp" style={{ animationDelay: '80ms' }}>
          <span className="text-[10px] font-bold text-gray-400 block mb-0.5">7-day avg / day</span>
          <span className="text-sm lg:text-base font-black">{weekStats.avgCalories.toLocaleString()} Kcal</span>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 animate-fadeUp" style={{ animationDelay: '160ms' }}>
          <span className="text-[10px] font-bold text-gray-400 block mb-0.5">Meals last 7 days</span>
          <span className="text-sm lg:text-base font-black">{weekStats.mealCount}</span>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 animate-fadeUp" style={{ animationDelay: '240ms' }}>
          <span className="text-[10px] font-bold text-gray-400 block mb-0.5">Most-logged dish</span>
          <span className="text-sm lg:text-base font-black block truncate">{weekStats.topDish}</span>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 animate-fadeUp" style={{ animationDelay: '320ms' }}>
          <span className="text-[10px] font-bold text-gray-400 block mb-0.5">Best streak</span>
          <span className="text-sm lg:text-base font-black">{bestRun} {bestRun === 1 ? 'day' : 'days'}</span>
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
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-black tracking-tight">{selectedKey === todayKey ? "Today's Food Log" : `Food Log — ${selectedMeta?.fullLabel}`}</h3>
            <div className="flex items-center gap-2">
              {selectedMeals.length > 0 && !comboNaming && (
                <button onClick={beginComboName} className="bg-[#3CE8E3]/20 hover:bg-[#3CE8E3]/40 border border-[#3CE8E3]/40 text-[#2C3768] text-xs font-black px-4 py-2.5 rounded-xl transition-all">
                  Save Day as Combo
                </button>
              )}
              <div className="relative">
                <button onClick={() => setCombosOpen((open) => !open)} className="bg-white text-[#2C3768] text-xs font-black px-4 py-2.5 rounded-xl border border-[#2C3768]/20 hover:bg-gray-50 transition-all">
                  Combos {templates.length > 0 ? `(${templates.length})` : ''}
                </button>
                {combosOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setCombosOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-40 w-72 bg-white border border-gray-100 rounded-2xl shadow-2xl p-3 flex flex-col gap-2 max-h-72 overflow-y-auto">
                      {templates.length === 0 ? (
                        <span className="text-xs font-bold text-gray-400 px-2 py-3 text-center">
                          No combos yet. Log meals on a day, then "Save Day as Combo".
                        </span>
                      ) : (
                        templates.map((template) => (
                          <div key={template.id} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50/60 border border-gray-100">
                            <div className="flex-1 min-w-0">
                              <span className="text-[11px] font-black block truncate">{template.name}</span>
                              <span className="text-[10px] font-bold text-gray-400">
                                {template.meals.length} {template.meals.length === 1 ? 'meal' : 'meals'} · {template.meals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0)} Kcal
                              </span>
                            </div>
                            <button
                              onClick={() => logTemplate(template)}
                              className="bg-[#2C3768] text-white text-[10px] font-black px-3.5 py-2.5 rounded-lg hover:opacity-90 transition-all"
                            >
                              Log
                            </button>
                            <button
                              onClick={() => deleteTemplate(template.id)}
                              aria-label={`Delete ${template.name}`}
                              className="text-[#E92A43]/40 hover:text-[#E92A43] transition-all min-w-11 min-h-11 flex items-center justify-center"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
              <button onClick={openAdd} className="bg-[#2C3768] hover:opacity-90 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all">
                + Add Meal
              </button>
            </div>
          </div>

          {comboNaming && (
            <div className="flex items-center gap-2 mb-3 bg-[#3CE8E3]/10 border border-[#3CE8E3]/30 rounded-2xl px-3 py-2">
              <input
                value={comboName}
                onChange={(e) => setComboName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveCombo()}
                placeholder="Combo name"
                className="flex-1 min-w-0 bg-transparent text-xs font-black outline-none placeholder:text-gray-400"
                autoFocus
              />
              <button onClick={saveCombo} className="bg-[#2C3768] text-white text-[10px] font-black px-3 py-1.5 rounded-lg hover:opacity-90 transition-all">Save</button>
              <button onClick={() => setComboNaming(false)} className="text-[#2C3768]/50 hover:text-[#2C3768] px-1">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {recentMeals.length > 0 && (
            <div className="mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Quick add (recent)</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {recentMeals.map((meal) => (
                  <button
                    key={`${meal.name}-recent`}
                    onClick={() => repeatMeal(meal)}
                    className="shrink-0 flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3.5 py-2.5 text-[10px] font-black hover:border-[#00F090] transition-all shadow-sm"
                  >
                    <span className="max-w-[110px] truncate">{meal.name}</span>
                    <span className="text-gray-400">{meal.calories} Kcal</span>
                    <RepeatIcon className="w-3 h-3 text-[#2C3768]/50" />
                  </button>
                ))}
              </div>
            </div>
          )}

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
                    onClick={() => repeatMeal(meal)}
                    title="Log again"
                    className="min-w-11 min-h-11 flex items-center justify-center text-[#2C3768]/40 hover:text-[#00A86B] rounded-xl transition-all"
                  >
                    <RepeatIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEdit(meal)}
                    title="Edit meal"
                    className="min-w-11 min-h-11 flex items-center justify-center text-[#2C3768]/40 hover:text-[#2C3768] rounded-xl transition-all"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMeal(meal.id)}
                    title="Delete meal"
                    className="min-w-11 min-h-11 flex items-center justify-center text-[#E92A43]/40 hover:text-[#E92A43] rounded-xl transition-all"
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

      {goalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setGoalModalOpen(false)} />
          <div className="relative bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-black tracking-tight">Daily Calorie Goal</h3>
              <button onClick={() => setGoalModalOpen(false)} className="text-[#2C3768]/40 hover:text-[#2C3768]">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[11px] font-bold text-gray-400 mb-4">Your progress bar and goal card update instantly.</p>
            <div className="flex items-center justify-center gap-5 mb-5">
              <button onClick={() => setGoalDraft((value) => Math.max(500, value - 100))} className="w-12 h-12 rounded-xl bg-gray-100 text-lg font-black hover:bg-gray-200 transition-all">−</button>
              <span className="text-4xl font-black tracking-tighter">{goalDraft.toLocaleString()}</span>
              <button onClick={() => setGoalDraft((value) => Math.min(6000, value + 100))} className="w-12 h-12 rounded-xl bg-gray-100 text-lg font-black hover:bg-gray-200 transition-all">+</button>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {GOAL_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setGoalDraft(preset)}
                  className={
                    goalDraft === preset
                      ? 'bg-[#00F090]/30 border border-[#00F090] text-[#2C3768] text-xs font-black px-3 py-1.5 rounded-full'
                      : 'bg-gray-50 hover:bg-gray-100 text-[#2C3768] text-xs font-black px-3 py-1.5 rounded-full border border-gray-100'
                  }
                >
                  {preset.toLocaleString()}
                </button>
              ))}
            </div>
            <button onClick={saveGoal} className="w-full bg-[#2C3768] text-white font-black py-3 rounded-2xl hover:opacity-90 transition-all">
              Save Goal
            </button>
          </div>
        </div>
      )}

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