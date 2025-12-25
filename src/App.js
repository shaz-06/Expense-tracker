import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  PieChart, 
  List, 
  DollarSign, 
  Calendar, 
  Tag, 
  X,
  TrendingUp as GraphIcon,
  PieChart as PieChartIcon,
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  Settings,
  AlertTriangle,
  RotateCcw,
  Target,
  Wallet,
  Sun,
  Moon,
  Download,
  Flag,
  TrendingUp
} from 'lucide-react';

// --- CONSTANTS ---
const CATEGORIES = ['Food', 'Groceries','Transport', 'Housing', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Salary', 'Gift', 'Investment', 'Other'];

const CATEGORY_COLORS = {
  'Food': '#6366f1', 
  'Groceries':'#6366f2',
  'Transport': '#8b5cf6', 
  'Housing': '#ec4899', 
  'Utilities': '#f59e0b', 
  'Entertainment': '#10b981', 
  'Health': '#ef4444', 
  'Shopping': '#06b6d4', 
  'Salary': '#22c55e',
  'Gift': '#eab308',
  'Investment': '#84cc16',
  'Other': '#64748b', 
};

const App = () => {
  // --- STATE ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [view, setView] = useState('list');
  const [reportType, setReportType] = useState('expense'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState(50000);
  const [filterRange, setFilterRange] = useState('all');
  
  // Savings Goal State
  const [savingsGoal, setSavingsGoal] = useState({ title: 'New Car', target: 100000 });
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Modal & UI States
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showPieModal, setShowPieModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const graphContainerRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    type: 'expense', 
    date: new Date().toISOString().split('T')[0],
  });

  // --- CALCULATIONS ---
  const totalIncome = useMemo(() => 
    expenses.filter(e => e.type === 'income').reduce((acc, curr) => acc + curr.amount, 0), 
  [expenses]);

  const totalExpense = useMemo(() => 
    expenses.filter(e => e.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0), 
  [expenses]);

  // Net Spending for the first card
  const totalBalance = useMemo(() => totalExpense - totalIncome, [totalExpense, totalIncome]);
  
  // Net Savings logic for the Goal card
  const netSavings = useMemo(() => Math.max(0, totalIncome - totalExpense), [totalIncome, totalExpense]);
  const goalPercent = Math.min(100, savingsGoal.target > 0 ? (netSavings / savingsGoal.target) * 100 : 0);

  const budgetRemaining = Math.max(0, monthlyBudget - totalExpense);
  const budgetPercent = Math.min(100, monthlyBudget > 0 ? (totalExpense / monthlyBudget) * 100 : 0);

  const categoryData = useMemo(() => {
    const data = {};
    expenses.filter(e => e.type === reportType).forEach(exp => {
      data[exp.category] = (data[exp.category] || 0) + exp.amount;
    });
    return Object.entries(data).sort((a, b) => b[1] - a[1]);
  }, [expenses, reportType]);

  const filteredExpenses = useMemo(() => {
    let result = expenses.filter(e => 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filterRange !== 'all') {
      const now = new Date();
      const days = filterRange === '7d' ? 7 : 30;
      const cutoff = new Date(now.setDate(now.getDate() - days));
      result = result.filter(e => new Date(e.date) >= cutoff);
    }
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, searchQuery, filterRange]);

  const groupedExpenses = useMemo(() => {
    return filteredExpenses.reduce((groups, expense) => {
      const date = expense.date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(expense);
      return groups;
    }, {});
  }, [filteredExpenses]);

  const graphPoints = useMemo(() => {
    if (expenses.length === 0) return [];
    const sorted = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
    const grouped = sorted.reduce((acc, exp) => {
      const val = exp.type === 'income' ? -exp.amount : exp.amount;
      acc[exp.date] = (acc[exp.date] || 0) + val;
      return acc;
    }, {});
    const dates = Object.keys(grouped).sort();
    let cumulative = 0;
    return dates.map(date => {
      cumulative += grouped[date];
      return { date, value: cumulative };
    });
  }, [expenses]);

  // --- ACTIONS ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;
    const newEntry = { ...formData, id: Date.now(), amount: parseFloat(formData.amount) };
    setExpenses([newEntry, ...expenses]);
    setFormData({ ...formData, title: '', amount: '' });
  };

  const deleteExpense = (id) => setExpenses(expenses.filter(exp => exp.id !== id));
  
  const exportData = () => {
    const dataStr = JSON.stringify(expenses, null, 2);
    const el = document.createElement('textarea');
    el.value = dataStr;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  const getSmoothPath = (points, width, height) => {
    if (points.length < 2) return "";
    const vals = points.map(p => p.value);
    const minVal = Math.min(0, ...vals);
    const maxVal = Math.max(...vals) || 1;
    const range = Math.max(1, maxVal - minVal);
    const padding = 40;
    const effW = width - padding * 2;
    const effH = height - padding * 2;
    const coords = points.map((p, i) => ({
      x: padding + (i / (points.length - 1)) * effW,
      y: height - padding - ((p.value - minVal) / range) * effH
    }));
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const cpX = (coords[i].x + coords[i+1].x) / 2;
      d += ` C ${cpX} ${coords[i].y}, ${cpX} ${coords[i+1].y}, ${coords[i+1].x} ${coords[i+1].y}`;
    }
    return d;
  };

  const handleMouseMove = (e) => {
    if (!graphPoints.length || !graphContainerRef.current) return;
    const rect = graphContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = 40;
    const effW = rect.width - padding * 2;
    let idx = Math.round(((x - padding) / effW) * (graphPoints.length - 1));
    idx = Math.max(0, Math.min(graphPoints.length - 1, idx));
    setHoveredPoint({ ...graphPoints[idx], index: idx });
  };

  const renderPieSlices = () => {
    let cumulativePercent = 0;
    const divisor = reportType === 'income' ? totalIncome : totalExpense;
    if (categoryData.length === 1 && divisor > 0) {
        return <circle cx="0" cy="0" r="1" fill={CATEGORY_COLORS[categoryData[0][0]] || '#94a3b8'} />;
    }
    const getCoordinatesForPercent = (percent) => {
      const x = Math.cos(2 * Math.PI * percent);
      const y = Math.sin(2 * Math.PI * percent);
      return [x, y];
    };
    return categoryData.map(([category, amount]) => {
      const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
      const percent = divisor > 0 ? amount / divisor : 0;
      cumulativePercent += percent;
      const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
      const largeArcFlag = percent > 0.5 ? 1 : 0;
      const pathData = [`M ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `L 0 0`].join(' ');
      return (
        <path 
          key={category} d={pathData} fill={CATEGORY_COLORS[category] || '#94a3b8'} 
          onMouseEnter={() => setHoveredSlice({ category, amount, percent })}
          onMouseLeave={() => setHoveredSlice(null)}
          className={`transition-all duration-300 cursor-pointer ${hoveredSlice?.category === category ? 'opacity-100 scale-105 origin-center transform' : 'opacity-90'}`}
        />
      );
    });
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} pb-12`}>
      <nav className={`p-4 shadow-lg sticky top-0 z-20 transition-colors ${isDarkMode ? 'bg-slate-900/80 backdrop-blur-md' : 'bg-indigo-600 text-white'}`}>
        <div className="max-w-5xl mx-auto flex justify-between items-center text-white">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Wallet className="w-6 h-6" />
            <span>SpendWise</span>
          </div>
          <div className="flex bg-indigo-900/30 rounded-xl p-1 backdrop-blur-sm">
            <button onClick={() => setView('list')} className={`px-4 py-1.5 rounded-lg flex items-center gap-2 transition-all ${view === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-100 hover:text-white'}`}>Tracker</button>
            <button onClick={() => setView('report')} className={`px-4 py-1.5 rounded-lg flex items-center gap-2 transition-all ${view === 'report' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-100 hover:text-white'}`}>Reports</button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 pt-8 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Net Balance Card */}
          <div onClick={() => setShowGraphModal(true)} className={`p-6 rounded-3xl border cursor-pointer transition-all hover:ring-2 hover:ring-indigo-500 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Net Balance</p>
            <h2 className={`text-2xl font-black ${totalBalance < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              ₹{Math.abs(totalBalance).toLocaleString('en-IN')}
            </h2>
            <div className="mt-4">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${totalBalance < 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {totalBalance < 0 ? 'Surplus' : 'Deficit'}
              </span>
            </div>
          </div>

          {/* GOAL CARD (Your selected area) */}
          <div 
            onClick={() => setShowGoalModal(true)} 
            className={`p-6 rounded-3xl border cursor-pointer group transition-all hover:scale-[1.02] hover:shadow-indigo-500/10 hover:ring-2 hover:ring-indigo-500 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}
          >
            <div className="flex justify-between items-start mb-1">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Goal: {savingsGoal.title}</p>
              <Settings className="w-3 h-3 text-indigo-400 group-hover:rotate-45 transition-transform" />
            </div>
            <div className="inline-block border-2 border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-900/10 px-4 py-1.5 rounded-2xl shadow-[0_0_15px_rgba(99,102,241,0.1)] mb-2">
                <h2 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">₹{netSavings.toLocaleString('en-IN')}</h2>
            </div>
            <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full transition-all duration-1000 ease-out" style={{ width: `${goalPercent}%` }}></div>
            </div>
            <div className="flex justify-between mt-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase">{Math.round(goalPercent)}% Complete</p>
                <p className="text-[10px] text-slate-400">Target: ₹{savingsGoal.target.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Budget Progress Card */}
          <div className={`p-6 rounded-3xl border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Budget Used</p>
            <h2 className="text-2xl font-black">₹{totalExpense.toLocaleString('en-IN')}</h2>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-1000 ${budgetPercent > 90 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${budgetPercent}%` }}></div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">₹{budgetRemaining.toLocaleString('en-IN')} Remaining</p>
          </div>

          {/* Settings Card */}
          <div className={`p-6 rounded-3xl border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex justify-between items-center mb-2">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Quick Actions</p>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 transition-colors">
                {isDarkMode ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-indigo-600" />}
              </button>
            </div>
            <div className="space-y-1.5">
              <button onClick={exportData} className="w-full text-left flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase hover:underline"><Download className="w-3 h-3" /> Export History</button>
              <button onClick={() => setShowConfirmModal(true)} className="w-full text-left flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase hover:underline"><RotateCcw className="w-3 h-3" /> Clear Records</button>
            </div>
          </div>
        </div>

        {view === 'list' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <div className={`p-8 rounded-[40px] shadow-sm border sticky top-28 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <PlusCircle className="w-6 h-6" /> New Entry
                </h3>
                <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl mb-6">
                  <button onClick={() => setFormData({...formData, type: 'expense'})} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${formData.type === 'expense' ? 'bg-white text-rose-600 shadow-sm dark:bg-slate-700 dark:text-rose-400' : 'text-slate-400'}`}>Debit</button>
                  <button onClick={() => setFormData({...formData, type: 'income'})} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${formData.type === 'income' ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400' : 'text-slate-400'}`}>Credit</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input type="text" placeholder="Title..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={`w-full px-5 py-4 border rounded-2xl focus:outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-50 text-slate-900 font-medium'}`} required />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Amount ₹" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className={`w-full px-5 py-4 border rounded-2xl focus:outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-indigo-400' : 'bg-slate-50 border-slate-50 text-indigo-600 font-bold'}`} required />
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={`w-full px-5 py-4 border rounded-2xl focus:outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-50 text-slate-900 font-medium'}`}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className={`w-full px-5 py-4 border rounded-2xl focus:outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-50 text-slate-900 font-medium'}`} />
                  <button type="submit" className={`w-full py-4 text-white font-black text-lg rounded-2xl shadow-xl transition-all active:scale-95 ${formData.type === 'expense' ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-emerald-600 shadow-emerald-500/20'}`}>Save Record</button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search history..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`w-full pl-11 pr-4 py-3.5 border rounded-2xl text-sm font-medium focus:outline-none shadow-sm transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-100'}`} />
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {['all', '7d', '30d'].map(r => (
                    <button key={r} onClick={() => setFilterRange(r)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filterRange === r ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-400'}`}>{r}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {Object.keys(groupedExpenses).length === 0 ? (
                  <div className={`p-16 text-center rounded-[40px] border-2 border-dashed transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 font-black">No transactions recorded.</p>
                  </div>
                ) : (
                  Object.keys(groupedExpenses).sort((a,b) => new Date(b) - new Date(a)).map(date => (
                    <div key={date}>
                      <div className="flex items-center gap-4 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>{date}</span>
                        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                      </div>
                      <div className="space-y-3">
                        {groupedExpenses[date].map(e => (
                          <div key={e.id} className={`p-4 rounded-3xl border transition-all group flex items-center justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-indigo-500' : 'bg-white border-slate-50 hover:border-indigo-100 shadow-sm'}`}>
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${e.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'}`}>₹</div>
                              <div>
                                <h4 className="font-black text-sm leading-tight">{e.title}</h4>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{e.category}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`text-lg font-black ${e.type === 'income' ? 'text-emerald-500' : 'text-slate-800 dark:text-white'}`}>
                                {e.type === 'income' ? '+' : '-'}₹{e.amount.toLocaleString('en-IN')}
                              </span>
                              <button onClick={() => deleteExpense(e.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all p-1"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Reports View */
          <div className={`p-10 rounded-[40px] border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-3xl font-black tracking-tighter">Category Analytics</h3>
              <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl">
                <button onClick={() => setReportType('expense')} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${reportType === 'expense' ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-400'}`}>Spending</button>
                <button onClick={() => setReportType('income')} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${reportType === 'income' ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-400'}`}>Income</button>
              </div>
            </div>
            {categoryData.length === 0 ? <p className="text-slate-400 py-20 text-center font-bold">Add some transactions to see your reports!</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="relative aspect-square max-w-sm mx-auto">
                  <svg viewBox="-1 -1 2 2" className="w-full h-full -rotate-90">{renderPieSlices()}</svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`text-center p-6 rounded-full shadow-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                      <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">{hoveredSlice ? hoveredSlice.category : 'Total'}</p>
                      <p className="text-xl font-black">₹{(hoveredSlice ? hoveredSlice.amount : (reportType === 'income' ? totalIncome : totalExpense)).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  {categoryData.map(([cat, amt]) => (
                    <div key={cat}>
                      <div className="flex justify-between items-center mb-2 font-black text-[10px] text-slate-500 uppercase tracking-widest">
                        <span>{cat}</span>
                        <span className="text-slate-900 dark:text-white">₹{amt.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${reportType === 'income' ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${(amt / (reportType === 'income' ? totalIncome : totalExpense)) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* SAVINGS GOAL SETTINGS MODAL */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md p-8 rounded-[40px] shadow-2xl transition-colors ${isDarkMode ? 'bg-slate-900' : 'bg-white text-slate-900'}`}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black">Edit Savings Goal</h3>
                <button onClick={() => setShowGoalModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Goal Title</label>
                <input type="text" value={savingsGoal.title} onChange={e => setSavingsGoal({...savingsGoal, title: e.target.value})} className={`w-full px-5 py-4 rounded-2xl border focus:outline-none transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-50 text-slate-900'}`} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Target Amount (₹)</label>
                <input type="number" value={savingsGoal.target} onChange={e => setSavingsGoal({...savingsGoal, target: parseFloat(e.target.value) || 0})} className={`w-full px-5 py-4 rounded-2xl border focus:outline-none font-bold transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-indigo-400' : 'bg-slate-50 border-slate-50 text-indigo-600'}`} />
              </div>
              <button onClick={() => setShowGoalModal(false)} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* TREND GRAPH MODAL */}
      {showGraphModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-3xl p-8 rounded-[40px] shadow-2xl transition-colors ${isDarkMode ? 'bg-slate-900' : 'bg-white text-slate-900'}`}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Financial Flow</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Historical Trend Analysis</p>
              </div>
              <button onClick={() => setShowGraphModal(false)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl transition-all"><X /></button>
            </div>
            {graphPoints.length < 2 ? <div className="h-64 flex items-center justify-center text-slate-400 font-bold border-2 border-dashed rounded-3xl">Please record at least 2 distinct dates.</div> : (
              <div className="relative h-80 w-full bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 cursor-crosshair" onMouseMove={handleMouseMove} onMouseLeave={() => setHoveredPoint(null)} ref={graphContainerRef}>
                   <svg className="w-full h-full overflow-visible" viewBox="0 0 700 320">
                      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2"/><stop offset="100%" stopColor="#4f46e5" stopOpacity="0"/></linearGradient></defs>
                      <path d={`${getSmoothPath(graphPoints, 700, 320)} L 660 320 L 40 320 Z`} fill="url(#g)" />
                      <path d={getSmoothPath(graphPoints, 700, 320)} fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
                      {hoveredPoint && (
                        <g>
                          <line x1={40 + (hoveredPoint.index / (graphPoints.length - 1)) * 620} y1="0" x2={40 + (hoveredPoint.index / (graphPoints.length - 1)) * 620} y2="320" stroke="#4f46e5" strokeDasharray="6" />
                          <circle cx={40 + (hoveredPoint.index / (graphPoints.length - 1)) * 620} cy={320 - 40 - ((hoveredPoint.value - Math.min(0, ...graphPoints.map(p => p.value))) / (Math.max(1, Math.max(...graphPoints.map(p => p.value)) - Math.min(0, ...graphPoints.map(p => p.value))))) * 240} r="8" fill="#4f46e5" stroke="white" strokeWidth="3" />
                          <foreignObject x={Math.min(540, Math.max(0, (40 + (hoveredPoint.index / (graphPoints.length - 1)) * 620) - 80))} y="10" width="160" height="70">
                            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-center">
                              <p className="text-[10px] font-black opacity-50 uppercase">{hoveredPoint.date}</p>
                              <p className="text-lg font-black">₹{hoveredPoint.value.toLocaleString('en-IN')}</p>
                            </div>
                          </foreignObject>
                        </g>
                      )}
                   </svg>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-rose-900/40 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md p-8 rounded-[40px] shadow-2xl text-center ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
            <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
            <h3 className="text-2xl font-black mb-2">Clear Records?</h3>
            <p className="text-slate-500 mb-8 font-medium">This will permanently delete all history. This cannot be undone.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowConfirmModal(false)} className="py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black">Cancel</button>
              <button onClick={() => { setExpenses([]); setShowConfirmModal(false); }} className="py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-200">Yes, Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;