import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Trash2, RefreshCw, Calculator } from "lucide-react";

const STARTER_FOODS = [
  { id: "apple_raw", name: "Táo (sống, không vỏ)", kcal100: 52, protein100: 0.3, carbs100: 14, fat100: 0.2 },
  { id: "rice_white_cooked", name: "Cơm trắng (chín)", kcal100: 130, protein100: 2.4, carbs100: 28.2, fat100: 0.3 },
  { id: "chicken_breast", name: "Ức gà (chín, không da)", kcal100: 165, protein100: 31, carbs100: 0, fat100: 3.6 },
  { id: "egg_whole", name: "Trứng gà (nguyên quả, chín)", kcal100: 155, protein100: 13, carbs100: 1.1, fat100: 11 },
  { id: "salmon", name: "Cá hồi (chín)", kcal100: 208, protein100: 20, carbs100: 0, fat100: 13 },
  { id: "banana", name: "Chuối", kcal100: 89, protein100: 1.1, carbs100: 23, fat100: 0.3 },
  { id: "milk_3_25", name: "Sữa bò 3.25% béo", kcal100: 60, protein100: 3.2, carbs100: 4.7, fat100: 3.3 },
  { id: "oats_dry", name: "Yến mạch (khô)", kcal100: 389, protein100: 16.9, carbs100: 66.3, fat100: 6.9 },
  { id: "olive_oil", name: "Dầu ô liu", kcal100: 884, protein100: 0, carbs100: 0, fat100: 100 },
  { id: "tofu_firm", name: "Đậu phụ (firm)", kcal100: 144, protein100: 17.3, carbs100: 3.3, fat100: 8.7 },
];

const LS_KEY = "ct_entries_v1";
const LS_FOODS = "ct_foods_v1";
const LS_TARGET = "ct_target_v1";

function gramsToScaled(valuePer100g, grams) {
  return (valuePer100g * grams) / 100;
}
function round1(n) { return Math.round(n * 10) / 10; }
function round0(n) { return Math.round(n); }
function kcalFromMacros(p, c, f, a = 0) { return p * 4 + c * 4 + f * 9 + a * 7; }

function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial; }
    catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(state)); } catch { } }, [key, state]);
  return [state, setState];
}

export default function App() {
  const [foods, setFoods] = useLocalStorage(LS_FOODS, STARTER_FOODS);
  const [entries, setEntries] = useLocalStorage(LS_KEY, []);
  const [target, setTarget] = useLocalStorage(LS_TARGET, { kcal: 2000, protein: 120, carbs: 220, fat: 60 });
  const [query, setQuery] = useState("");
  const [grams, setGrams] = useState(100);
  const [selectedFoodId, setSelectedFoodId] = useState(null);
  const [custom, setCustom] = useState({ name: "", protein100: "", carbs100: "", fat100: "" });

  const filteredFoods = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return foods;
    return foods.filter(f => f.name.toLowerCase().includes(q));
  }, [foods, query]);

  const totals = useMemo(() => {
    return entries.reduce((acc, e) => {
      acc.kcal += e.kcal; acc.p += e.protein; acc.c += e.carbs; acc.f += e.fat; acc.g += e.grams;
      return acc;
    }, { kcal: 0, p: 0, c: 0, f: 0, g: 0 });
  }, [entries]);

  function addEntry(food, grams) {
    const kcal = gramsToScaled(food.kcal100 ?? kcalFromMacros(food.protein100, food.carbs100, food.fat100), grams);
    const protein = gramsToScaled(food.protein100, grams);
    const carbs = gramsToScaled(food.carbs100, grams);
    const fat = gramsToScaled(food.fat100, grams);
    const entry = { id: crypto.randomUUID(), foodId: food.id, name: food.name, grams: round1(grams), kcal: round1(kcal), protein: round1(protein), carbs: round1(carbs), fat: round1(fat), at: Date.now() };
    setEntries(prev => [entry, ...prev]);
    setSelectedFoodId(food.id);
    setGrams(100);
  }

  function removeEntry(id) { setEntries(prev => prev.filter(e => e.id !== id)); }

  function addCustomFood() {
    const p = parseFloat(String(custom.protein100).replace(",", ".")) || 0;
    const c = parseFloat(String(custom.carbs100).replace(",", ".")) || 0;
    const f = parseFloat(String(custom.fat100).replace(",", ".")) || 0;
    if (!custom.name.trim()) return;
    const kcal100 = round1(kcalFromMacros(p, c, f));
    const newFood = { id: `user_${Date.now()}`, name: custom.name.trim(), kcal100, protein100: p, carbs100: c, fat100: f };
    setFoods(prev => [newFood, ...prev]);
    setCustom({ name: "", protein100: "", carbs100: "", fat100: "" });
  }

  function clearAll() { if (confirm("Xóa toàn bộ nhật ký hôm nay?")) setEntries([]); }

  const [tdeeForm, setTdeeForm] = useState({ sex: "male", age: "28", height: "170", weight: "70", activity: 1.55, deficit: 0.15 });

  function computeTDEE() {
    const age = parseFloat(tdeeForm.age), h = parseFloat(tdeeForm.height), w = parseFloat(tdeeForm.weight), act = parseFloat(String(tdeeForm.activity)), s = tdeeForm.sex;
    if (Number.isNaN(age) || Number.isNaN(h) || Number.isNaN(w) || Number.isNaN(act)) return null;
    const bmr = s === "male" ? 10 * w + 6.25 * h - 5 * age + 5 : 10 * w + 6.25 * h - 5 * age - 161;
    const tdee = bmr * act; const goal = tdee * (1 - parseFloat(String(tdeeForm.deficit)));
    return { bmr, tdee, goal };
  }

  const tdee = computeTDEE();

  return (
    <div className="min-h-screen bg-pink-50 text-gray-900">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-pink-600">
            CalorieTracker
          </motion.div>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <button onClick={clearAll} className="px-3 py-1.5 rounded-2xl bg-pink-200 hover:bg-pink-300 text-pink-900 flex items-center gap-2 transition-all duration-200">
              <Trash2 size={16} /> Xóa log
            </button>
            <a href="https://fdc.nal.usda.gov/" target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-2xl bg-gray-100 hover:bg-gray-200 border flex items-center gap-2 transition-all duration-200">
              <Calculator size={16} /> USDA DB
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 grid md:grid-cols-3 gap-6">
        {/* LEFT: Search & add */}
        <section className="md:col-span-2 space-y-6">
          {/* Search & list */}
          <div className="p-4 bg-white rounded-3xl shadow-lg">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" size={18} />
                <input
                  className="w-full pl-9 pr-3 py-2 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all duration-200"
                  placeholder="Tìm món ăn (VD: Cơm, Ức gà, Chuối...)"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
              <input type="number" min={1} className="w-28 px-3 py-2 rounded-2xl border" value={grams} onChange={e => setGrams(parseFloat(e.target.value) || 0)} />
              <span className="text-sm">gram</span>
            </div>

            <div className="mt-3 max-h-80 overflow-auto divide-y">
              {filteredFoods.map(f => (
                <button
                  key={f.id}
                  onClick={() => addEntry(f, grams)}
                  className={`w-full text-left py-2 px-2 hover:bg-pink-50 rounded-2xl transition-colors duration-200 flex items-center justify-between ${selectedFoodId === f.id ? "bg-pink-50" : ""}`}
                >
                  <div>
                    <div className="font-medium text-pink-600">{f.name}</div>
                    <div className="text-xs text-gray-500">{f.kcal100} kcal / 100g • P {f.protein100}g • C {f.carbs100}g • F {f.fat100}g</div>
                  </div>
                  <Plus size={18} className="text-pink-400" />
                </button>
              ))}
              {filteredFoods.length === 0 && <div className="text-sm text-gray-500 p-2">Không thấy món phù hợp. Bạn có thể thêm món riêng bên dưới.</div>}
            </div>

            {/* Custom food */}
            <div className="mt-4 p-3 rounded-2xl bg-pink-50 border border-pink-100">
              <div className="font-medium mb-2 text-pink-600">Thêm món của bạn (giá trị trên 100g)</div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <input className="px-3 py-2 rounded-2xl border" placeholder="Tên món" value={custom.name} onChange={e => setCustom({ ...custom, name: e.target.value })} />
                <input className="px-3 py-2 rounded-2xl border" placeholder="Protein/100g" value={custom.protein100} onChange={e => setCustom({ ...custom, protein100: e.target.value })} />
                <input className="px-3 py-2 rounded-2xl border" placeholder="Carb/100g" value={custom.carbs100} onChange={e => setCustom({ ...custom, carbs100: e.target.value })} />
                <input className="px-3 py-2 rounded-2xl border" placeholder="Fat/100g" value={custom.fat100} onChange={e => setCustom({ ...custom, fat100: e.target.value })} />
                <button onClick={addCustomFood} className="px-3 py-2 rounded-2xl bg-emerald-200 hover:bg-emerald-300 text-emerald-900 transition-all duration-200">Lưu món</button>
              </div>
              <div className="text-xs text-gray-500 mt-2">Năng lượng ước tính theo quy tắc 4/4/9 (P/C/F). Nếu bạn có nhãn dinh dưỡng/USDA, hãy nhập số liệu theo 100g.</div>
            </div>
          </div>

          {/* Log entries */}
          <div className="p-4 bg-white rounded-3xl shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-pink-600">Nhật ký hôm nay</div>
              <div className="text-sm text-gray-500">Tổng: {round0(totals.kcal)} kcal • {round1(totals.p)}P / {round1(totals.c)}C / {round1(totals.f)}F</div>
            </div>
            <div className="divide-y">
              {entries.length === 0 && <div className="text-sm text-gray-500">Chưa có mục nào. Hãy thêm món ở trên nhé.</div>}
              {entries.map(e => (
                <div key={e.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-pink-600">{e.name} <span className="text-xs text-gray-500">({e.grams} g)</span></div>
                    <div className="text-xs text-gray-500">{e.kcal} kcal • P {e.protein}g • C {e.carbs}g • F {e.fat}g</div>
                  </div>
                  <button onClick={() => removeEntry(e.id)} className="p-2 rounded-lg hover:bg-pink-50 transition-colors duration-200"><Trash2 size={18} className="text-pink-400" /></button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT: Targets & TDEE */}
        <aside className="space-y-6">
          <div className="p-4 bg-white rounded-3xl shadow-lg">
            <div className="font-semibold mb-2 text-pink-600">Mục tiêu hằng ngày</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {["kcal", "protein", "carbs", "fat"].map(key => (
                <label key={key} className="flex flex-col gap-1">
                  <span className="capitalize">{key === "kcal" ? "Calories (kcal)" : key}</span>
                  <input type="number" className="px-3 py-2 rounded-2xl border" value={target[key]} onChange={e => setTarget({ ...target, [key]: parseFloat(e.target.value) || 0 })} />
                </label>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <Bar label="Calories" value={totals.kcal} max={target.kcal} suffix={` / ${round0(target.kcal)} kcal`} />
              <Bar label="Protein" value={totals.p} max={target.protein} suffix={` / ${round0(target.protein)} g`} />
              <Bar label="Carb" value={totals.c} max={target.carbs} suffix={` / ${round0(target.carbs)} g`} />
              <Bar label="Fat" value={totals.f} max={target.fat} suffix={` / ${round0(target.fat)} g`} />
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl shadow">
            <div className="font-semibold mb-2 flex items-center gap-2"><Calculator size={18} />Ước tính TDEE</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <select className="px-3 py-2 rounded-xl border" value={tdeeForm.sex} onChange={(e) => setTdeeForm({ ...tdeeForm, sex: e.target.value })}>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
              <input className="px-3 py-2 rounded-xl border" placeholder="Tuổi" value={tdeeForm.age} onChange={(e) => setTdeeForm({ ...tdeeForm, age: e.target.value })} />
              <input className="px-3 py-2 rounded-xl border" placeholder="Chiều cao (cm)" value={tdeeForm.height} onChange={(e) => setTdeeForm({ ...tdeeForm, height: e.target.value })} />
              <input className="px-3 py-2 rounded-xl border" placeholder="Cân nặng (kg)" value={tdeeForm.weight} onChange={(e) => setTdeeForm({ ...tdeeForm, weight: e.target.value })} />
              <select className="px-3 py-2 rounded-xl border col-span-2" value={tdeeForm.activity} onChange={(e) => setTdeeForm({ ...tdeeForm, activity: parseFloat(e.target.value) })}>
                <option value={1.2}>Ít vận động (x1.2)</option>
                <option value={1.375}>Nhẹ (x1.375)</option>
                <option value={1.55}>Vừa (x1.55)</option>
                <option value={1.725}>Nhiều (x1.725)</option>
                <option value={1.9}>Rất nhiều (x1.9)</option>
              </select>
              <label className="col-span-2 flex items-center gap-2">
                <span>Thâm hụt mục tiêu</span>
                <input type="number" step={0.01} className="px-3 py-2 rounded-xl border w-24" value={tdeeForm.deficit}
                  onChange={(e) => setTdeeForm({ ...tdeeForm, deficit: parseFloat(e.target.value) })} />
                <span className="text-sm text-gray-500">(0.10 = 10%)</span>
              </label>
            </div>
            {tdee && (
              <div className="mt-3 text-sm">
                <div>BMR ước tính: <b>{round0(tdee.bmr)} kcal</b></div>
                <div>TDEE ước tính: <b>{round0(tdee.tdee)} kcal</b></div>
                <div>Mục tiêu giảm cân (áp dụng thâm hụt): <b>{round0(tdee.goal)} kcal/ngày</b></div>
                <button
                  onClick={() => setTarget({ ...target, kcal: round0(tdee.goal) })}
                  className="mt-2 px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                >Đặt làm mục tiêu Calories</button>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-3">* Công thức Mifflin–St Jeor cho BMR; nhân hệ số hoạt động cho TDEE.
              Đây là ước tính cho kế hoạch dài hạn, không thay thế tư vấn y tế.</div>
          </div>

          <div className="p-4 bg-white rounded-2xl shadow text-xs text-gray-600">
            <div className="font-semibold mb-1">Ghi chú độ chính xác</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Tính theo gram: mọi mục đều scale chính xác từ dữ liệu/100g.</li>
              <li>Nếu nhãn thực phẩm khác với dữ liệu mẫu, hãy thêm món riêng theo nhãn để khớp thực tế.</li>
              <li>Độ ẩm, cách nấu có thể làm thay đổi khối lượng và năng lượng/100g.</li>
            </ul>
          </div>
        </aside>
      </main>

      <footer className="max-w-5xl mx-auto px-4 pb-10 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <RefreshCw size={14} /> <span>Lưu tự động vào trình duyệt. Bạn có thể xóa/log lại bất kỳ lúc nào.</span>
        </div>
      </footer>
    </div>
  );
}

function Bar({ label, value, max, suffix }) {
  const pct = Math.min(100, (value / (max || 1)) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1"><span>{label}</span><span>{round0(value)}{suffix}</span></div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          className="h-full bg-emerald-500"
        />
      </div>
    </div>
  );
}
