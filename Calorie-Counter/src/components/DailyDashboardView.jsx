import { useBoundStore } from '../store/useBoundStore';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const today = new Date();
const startOfWeek = today.getDate() - today.getDay();
const WEEK_DATES = WEEKDAYS.map((day, i) => {
  const date = new Date(today.getFullYear(), today.getMonth(), startOfWeek + i);
  return { label: `${day} ${date.getDate()}`, active: i === today.getDay() };
});

export default function DailyDashboardView() {
  const setView = useBoundStore((state) => state.setView);
  const user = useBoundStore((state) => state.user);
  const loggedMeals = useBoundStore((state) => state.loggedMeals);

  const displayName = user?.name || 'there';
  const totalLoggedCalories = loggedMeals.reduce((acc, m) => acc + m.calories, 0);

  return (
    <div className="w-full min-h-[85vh] lg:min-h-[75vh] flex flex-col p-5 sm:p-6 lg:p-8 text-[#2C3768]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-[#00F090] overflow-hidden bg-gray-100 flex-shrink-0">
            <span className="w-full h-full flex items-center justify-center bg-gray-200 text-lg font-bold">👤</span>
          </div>
          <div>
            <span className="font-black text-sm lg:text-base tracking-tight block">Hello, {displayName}</span>
            <span className="text-[11px] font-bold text-gray-400 block">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('landing')} className="bg-[#FFF4CA] hover:bg-opacity-80 px-4 py-2 rounded-xl text-xs font-bold transition-all">Log Out</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-1 sm:gap-2 mb-5 overflow-x-auto pb-1">
            {WEEK_DATES.map((day, idx) =>
              day.active ? (
                <div key={idx} className="border-2 border-[#00F090] px-3 sm:px-4 py-2 rounded-2xl font-black text-xs text-center shadow-sm bg-white flex-shrink-0">
                  {day.label}
                </div>
              ) : (
                <span key={idx} className="text-xs font-black text-gray-400 flex-shrink-0 px-2">{day.label}</span>
              )
            )}
          </div>

          <div className="border border-gray-100 rounded-[2.5rem] p-5 sm:p-6 shadow-xs bg-white">
            <span className="text-xs font-black text-gray-400 block mb-1">Today's Calories</span>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-5xl sm:text-6xl font-black tracking-tighter">{totalLoggedCalories}</span>
              <span className="text-xl font-black tracking-tight">Kcal</span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-[#2C3768] h-full rounded-full" style={{ width: `${Math.min(100, (totalLoggedCalories / 2400) * 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 lg:w-56 xl:w-64">
          <div className="bg-[#E7F7AD]/50 border border-[#E7F7AD] rounded-2xl p-4 text-center">
            <span className="text-[10px] font-bold text-gray-500 block mb-0.5">Goal</span>
            <span className="text-sm lg:text-base font-black">2,400 cal</span>
          </div>
          <div className="bg-[#00F090] rounded-2xl p-4 text-center shadow-xs">
            <span className="text-[10px] font-black text-[#2C3768]/70 block mb-0.5">Logged</span>
            <span className="text-sm lg:text-base font-black">{totalLoggedCalories} cal</span>
          </div>
          <div className="bg-[#E7F7AD]/50 border border-[#E7F7AD] rounded-2xl p-4 text-center">
            <span className="text-[10px] font-bold text-gray-500 block mb-0.5">Activity</span>
            <span className="text-sm lg:text-base font-black">Daily Tracker</span>
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
          <h3 className="text-sm font-black tracking-tight mb-3">Today's Food Log</h3>
          <div className="space-y-2.5 flex-1 max-h-[250px] overflow-y-auto">
            {loggedMeals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <span className="text-3xl mb-2">🍽️</span>
                <p className="text-xs font-bold text-gray-400">No meals logged yet. Scan your first plate to get started.</p>
              </div>
            ) : (
              loggedMeals.map((meal) => (
                <div key={meal.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 border border-gray-100">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#2C3768]/10 flex items-center justify-center text-lg flex-shrink-0">
                    🍲
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-black block truncate">{meal.name}</span>
                    <span className="text-[10px] font-bold text-gray-400">{meal.date}</span>
                  </div>
                  <span className="text-xs font-black">{meal.calories} Kcal</span>
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
        📸 Scan New Meal Platter
      </button>
    </div>
  );
}