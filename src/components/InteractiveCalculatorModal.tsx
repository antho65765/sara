import React, { useState, useEffect } from 'react';
import { X, History, RotateCcw, Calculator as CalcIcon, AlertTriangle, ArrowRightLeft, Ruler, Weight, Thermometer } from 'lucide-react';

interface InteractiveCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalTab = 'calculator' | 'converter';
type ConverterCategory = 'length' | 'mass' | 'temperature';

export const InteractiveCalculatorModal: React.FC<InteractiveCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('calculator');
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isScientific, setIsScientific] = useState(true);
  const [useRadians, setUseRadians] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [resetNext, setResetNext] = useState(false);
  const [mathWarning, setMathWarning] = useState<string | null>(null);

  // Converter state
  const [converterCategory, setConverterCategory] = useState<ConverterCategory>('length');
  const [fromValue, setFromValue] = useState('1');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('km');

  // Converter options
  const units: Record<ConverterCategory, { label: string; factor: number; offset?: number }[]> = {
    length: [
      { label: 'Metros (m)', factor: 1 },
      { label: 'Kilómetros (km)', factor: 1000 },
      { label: 'Centímetros (cm)', factor: 0.01 },
      { label: 'Milímetros (mm)', factor: 0.001 },
      { label: 'Millas (mi)', factor: 1609.34 },
      { label: 'Yardas (yd)', factor: 0.9144 },
      { label: 'Pies (ft)', factor: 0.3048 },
      { label: 'Pulgadas (in)', factor: 0.0254 }
    ],
    mass: [
      { label: 'Gramos (g)', factor: 1 },
      { label: 'Kilogramos (kg)', factor: 1000 },
      { label: 'Miligramos (mg)', factor: 0.001 },
      { label: 'Libras (lb)', factor: 453.592 },
      { label: 'Onzas (oz)', factor: 28.3495 }
    ],
    temperature: [
      { label: 'Celsius (°C)', factor: 1 },
      { label: 'Fahrenheit (°F)', factor: 1 },
      { label: 'Kelvin (K)', factor: 1 }
    ]
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || activeTab !== 'calculator') return;
      if (e.key >= '0' && e.key <= '9') {
        inputDigit(e.key);
      } else if (e.key === '.') {
        inputDecimal();
      } else if (e.key === '+') {
        handleOperator('+');
      } else if (e.key === '-') {
        handleOperator('-');
      } else if (e.key === '*' || e.key === 'x') {
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === '^') {
        handleOperator('^');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculate();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, display, equation, resetNext, useRadians]);

  useEffect(() => {
    // Reset default units when category changes
    if (converterCategory === 'length') {
      setFromUnit('m');
      setToUnit('km');
    } else if (converterCategory === 'mass') {
      setFromUnit('g');
      setToUnit('kg');
    } else if (converterCategory === 'temperature') {
      setFromUnit('°C');
      setToUnit('°F');
    }
  }, [converterCategory]);

  if (!isOpen) return null;

  const triggerWarning = (msg: string) => {
    setMathWarning(msg);
    setTimeout(() => setMathWarning(null), 3500);
  };

  const formatResult = (num: number): string => {
    if (isNaN(num) || !isFinite(num)) {
      triggerWarning('Operación matemática inválida o indefinida');
      return 'Error';
    }
    const res = parseFloat(num.toPrecision(10));
    return String(res);
  };

  const inputDigit = (digit: string) => {
    if (mathWarning) setMathWarning(null);
    if (display === 'Error') {
      setDisplay(digit);
      setResetNext(false);
      return;
    }
    if (resetNext) {
      setDisplay(digit);
      setResetNext(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (mathWarning) setMathWarning(null);
    if (display === 'Error') {
      setDisplay('0.');
      setResetNext(false);
      return;
    }
    if (resetNext) {
      setDisplay('0.');
      setResetNext(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setEquation('');
    setResetNext(false);
    setMathWarning(null);
  };

  const handleBackspace = () => {
    if (display === 'Error' || resetNext) return;
    if (display.length === 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleOperator = (nextOp: string) => {
    if (display === 'Error') return;
    const inputValue = parseFloat(display);

    if (equation && !resetNext) {
      const parts = equation.split(' ');
      const prevVal = parseFloat(parts[0]);
      const op = parts[1];
      let res = prevVal;

      if (op === '+') res = prevVal + inputValue;
      else if (op === '-') res = prevVal - inputValue;
      else if (op === '×') res = prevVal * inputValue;
      else if (op === '÷') {
        if (inputValue === 0) {
          triggerWarning('No es posible dividir entre cero');
          setDisplay('Error');
          setEquation('');
          return;
        }
        res = prevVal / inputValue;
      }
      else if (op === '^') res = Math.pow(prevVal, inputValue);
      else if (op === 'mod') {
        if (inputValue === 0) {
          triggerWarning('Módulo por cero no permitido');
          setDisplay('Error');
          setEquation('');
          return;
        }
        res = prevVal % inputValue;
      }

      const formatted = formatResult(res);
      if (formatted === 'Error') return;
      setDisplay(formatted);
      setEquation(`${formatted} ${nextOp} `);
    } else {
      setEquation(`${inputValue} ${nextOp} `);
    }

    setResetNext(true);
  };

  const calculate = () => {
    if (!equation || display === 'Error') return;
    const inputValue = parseFloat(display);
    const parts = equation.split(' ');
    const prevVal = parseFloat(parts[0]);
    const op = parts[1];
    let res = inputValue;

    if (op === '+') res = prevVal + inputValue;
    else if (op === '-') res = prevVal - inputValue;
    else if (op === '×') res = prevVal * inputValue;
    else if (op === '÷') {
      if (inputValue === 0) {
        triggerWarning('No es posible dividir entre cero');
        setDisplay('Error');
        setEquation('');
        return;
      }
      res = prevVal / inputValue;
    }
    else if (op === '^') res = Math.pow(prevVal, inputValue);
    else if (op === 'mod') {
      if (inputValue === 0) {
        triggerWarning('Módulo por cero no permitido');
        setDisplay('Error');
        setEquation('');
        return;
      }
      res = prevVal % inputValue;
    }

    const formatted = formatResult(res);
    if (formatted === 'Error') return;
    const record = `${equation} ${display} = ${formatted}`;
    setHistory(prev => [record, ...prev.slice(0, 19)]);
    setDisplay(formatted);
    setEquation('');
    setResetNext(true);
  };

  const applyScientific = (func: string) => {
    if (display === 'Error') return;
    const val = parseFloat(display);
    let res = val;
    let desc = '';

    const angleFactor = useRadians ? 1 : Math.PI / 180;
    const invAngleFactor = useRadians ? 1 : 180 / Math.PI;

    switch (func) {
      case 'sin':
        res = Math.sin(val * angleFactor);
        desc = `sin(${val}${useRadians ? 'rad' : '°'})`;
        break;
      case 'cos':
        res = Math.cos(val * angleFactor);
        desc = `cos(${val}${useRadians ? 'rad' : '°'})`;
        break;
      case 'tan':
        if (!useRadians && (Math.abs(val) % 180 === 90)) {
          triggerWarning('Tangente indefinida para 90° o 270°');
          res = NaN;
        } else {
          res = Math.tan(val * angleFactor);
        }
        desc = `tan(${val}${useRadians ? 'rad' : '°'})`;
        break;
      case 'asin':
        if (val < -1 || val > 1) {
          triggerWarning('Dominio de arcsin debe estar entre -1 y 1');
          res = NaN;
        } else {
          res = Math.asin(val) * invAngleFactor;
        }
        desc = `arcsin(${val})`;
        break;
      case 'acos':
        if (val < -1 || val > 1) {
          triggerWarning('Dominio de arccos debe estar entre -1 y 1');
          res = NaN;
        } else {
          res = Math.acos(val) * invAngleFactor;
        }
        desc = `arccos(${val})`;
        break;
      case 'atan':
        res = Math.atan(val) * invAngleFactor;
        desc = `arctan(${val})`;
        break;
      case 'sqrt':
        if (val < 0) {
          triggerWarning('No se puede calcular raíz cuadrada de número negativo');
          res = NaN;
        } else {
          res = Math.sqrt(val);
        }
        desc = `√(${val})`;
        break;
      case 'cbrt':
        res = Math.cbrt(val);
        desc = `∛(${val})`;
        break;
      case 'square':
        res = val * val;
        desc = `(${val})²`;
        break;
      case 'cube':
        res = val * val * val;
        desc = `(${val})³`;
        break;
      case 'log':
        if (val <= 0) {
          triggerWarning('Logaritmo requiere un número mayor que 0');
          res = NaN;
        } else {
          res = Math.log10(val);
        }
        desc = `log₁₀(${val})`;
        break;
      case 'ln':
        if (val <= 0) {
          triggerWarning('Log natural requiere un número mayor que 0');
          res = NaN;
        } else {
          res = Math.log(val);
        }
        desc = `ln(${val})`;
        break;
      case 'exp':
        res = Math.pow(10, val);
        desc = `10^(${val})`;
        break;
      case 'fact':
        if (val < 0 || !Number.isInteger(val) || val > 170) {
          triggerWarning('Factorial requiere entero entre 0 y 170');
          res = NaN;
        } else {
          res = 1;
          for (let i = 2; i <= val; i++) res *= i;
        }
        desc = `${val}!`;
        break;
      case 'abs':
        res = Math.abs(val);
        desc = `|${val}|`;
        break;
      case 'inv':
        if (val === 0) {
          triggerWarning('No es posible dividir 1 entre 0');
          res = NaN;
        } else {
          res = 1 / val;
        }
        desc = `1/(${val})`;
        break;
      case 'pi':
        res = Math.PI;
        desc = 'π';
        break;
      case 'e':
        res = Math.E;
        desc = 'e';
        break;
    }

    const formatted = formatResult(res);
    if (formatted === 'Error') {
      setDisplay('Error');
      return;
    }
    setEquation(desc);
    setDisplay(formatted);
    const record = `${desc} = ${formatted}`;
    setHistory(prev => [record, ...prev.slice(0, 19)]);
    setResetNext(true);
  };

  const toggleSign = () => {
    if (display === '0' || display === 'Error') return;
    setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
  };

  const percentage = () => {
    if (display === 'Error') return;
    const val = parseFloat(display);
    setDisplay(formatResult(val / 100));
  };

  // Unit conversion computation
  const convertUnits = () => {
    const val = parseFloat(fromValue);
    if (isNaN(val)) return '0';

    if (converterCategory === 'temperature') {
      // Temperature conversion logic
      let celsius = val;
      if (fromUnit === '°F') celsius = (val - 32) * (5 / 9);
      if (fromUnit === 'K') celsius = val - 273.15;

      let result = celsius;
      if (toUnit === '°F') result = celsius * (9 / 5) + 32;
      if (toUnit === 'K') result = celsius + 273.15;
      return parseFloat(result.toFixed(4)).toString();
    } else {
      // Length & Mass factor conversion
      const currentUnitsList = units[converterCategory];
      const fromObj = currentUnitsList.find(u => u.label.includes(fromUnit) || u.label.includes(`(${fromUnit})`));
      const toObj = currentUnitsList.find(u => u.label.includes(toUnit) || u.label.includes(`(${toUnit})`));

      if (!fromObj || !toObj) return '0';
      const baseValue = val * fromObj.factor;
      const converted = baseValue / toObj.factor;
      return parseFloat(converted.toPrecision(8)).toString();
    }
  };

  const getUnitSymbol = (label: string) => {
    const match = label.match(/\(([^)]+)\)/);
    return match ? match[1] : label;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header & Tabs */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CalcIcon className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('calculator')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeTab === 'calculator' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
              >
                Calculadora
              </button>
              <button
                onClick={() => setActiveTab('converter')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeTab === 'converter' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
              >
                Conversor
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {activeTab === 'calculator' && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold ${showHistory ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                title="Historial"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Historial</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 relative">
          {activeTab === 'converter' ? (
            /* UNIT CONVERTER TAB */
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setConverterCategory('length')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${converterCategory === 'length' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                >
                  <Ruler className="w-4 h-4" /> Longitud
                </button>
                <button
                  onClick={() => setConverterCategory('mass')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${converterCategory === 'mass' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                >
                  <Weight className="w-4 h-4" /> Masa / Peso
                </button>
                <button
                  onClick={() => setConverterCategory('temperature')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${converterCategory === 'temperature' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                >
                  <Thermometer className="w-4 h-4" /> Temperatura
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                {/* From */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">De:</label>
                  <input
                    type="number"
                    value={fromValue}
                    onChange={(e) => setFromValue(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                  <select
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
                  >
                    {units[converterCategory].map((u, i) => (
                      <option key={i} value={getUnitSymbol(u.label)}>{u.label}</option>
                    ))}
                  </select>
                </div>

                {/* To */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">A:</label>
                  <div className="w-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl px-3 py-2 text-sm font-mono font-bold text-blue-700 dark:text-blue-300 flex items-center h-[38px]">
                    {convertUnits()}
                  </div>
                  <select
                    value={toUnit}
                    onChange={(e) => setToUnit(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
                  >
                    {units[converterCategory].map((u, i) => (
                      <option key={i} value={getUnitSymbol(u.label)}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={() => {
                    const temp = fromUnit;
                    setFromUnit(toUnit);
                    setToUnit(temp);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 transition"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Invertir unidades
                </button>
              </div>
            </div>
          ) : showHistory ? (
            /* HISTORY TAB */
            <div className="h-80 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Historial de cálculos</span>
                {history.length > 0 && (
                  <button
                    onClick={() => setHistory([])}
                    className="text-xs text-red-500 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" /> Limpiar
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center">
                    <History className="w-8 h-8 mb-2 opacity-30" />
                    No hay cálculos recientes
                  </div>
                ) : (
                  history.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        const parts = item.split(' = ');
                        if (parts.length === 2 && parts[1] !== 'Error') {
                          setDisplay(parts[1]);
                          setShowHistory(false);
                        }
                      }}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 cursor-pointer transition-colors flex justify-between items-center group"
                    >
                      <span>{item}</span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100">Usar</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* CALCULATOR TAB */
            <div className="space-y-3">
              {/* Screen & Subtle Warning */}
              <div className="bg-slate-900 text-white rounded-2xl p-3 shadow-inner text-right border border-slate-800 relative overflow-hidden">
                {mathWarning && (
                  <div className="absolute inset-x-0 top-0 bg-amber-500/90 text-slate-950 text-[11px] font-bold py-1 px-3 flex items-center justify-center gap-1.5 animate-fadeIn z-10">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{mathWarning}</span>
                  </div>
                )}
                <div className="text-[11px] text-slate-400 font-mono h-5 overflow-x-hidden whitespace-nowrap flex items-center justify-end">
                  {equation}
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tracking-wider overflow-x-auto whitespace-nowrap py-0.5 text-blue-400">
                  {display}
                </div>
              </div>

              {/* Mode Bar */}
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/70 px-2.5 py-1.5 rounded-xl text-xs">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsScientific(!isScientific)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${isScientific ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    Científica
                  </button>
                  <button
                    onClick={() => setIsScientific(false)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${!isScientific ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    Estándar
                  </button>
                </div>

                {isScientific && (
                  <button
                    onClick={() => setUseRadians(!useRadians)}
                    className="px-2 py-1 rounded-lg font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[11px] hover:bg-indigo-100 transition"
                  >
                    {useRadians ? 'RAD' : 'DEG'}
                  </button>
                )}
              </div>

              {/* Main Compact Layout */}
              <div className={`grid gap-2 ${isScientific ? 'grid-cols-1 md:grid-cols-5' : 'grid-cols-1'}`}>
                
                {/* Scientific Shortcuts Compact Panel */}
                {isScientific && (
                  <div className="md:col-span-2 grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                    <button onClick={() => applyScientific('sqrt')} className="p-1.5 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition shadow-2xs border border-indigo-100 dark:border-indigo-900/40">
                      √x
                    </button>
                    <button onClick={() => applyScientific('cbrt')} className="p-1.5 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition shadow-2xs border border-indigo-100 dark:border-indigo-900/40">
                      ∛x
                    </button>
                    <button onClick={() => applyScientific('log')} className="p-1.5 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition shadow-2xs border border-indigo-100 dark:border-indigo-900/40">
                      log₁₀
                    </button>

                    <button onClick={() => applyScientific('ln')} className="p-1.5 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition shadow-2xs border border-indigo-100 dark:border-indigo-900/40">
                      ln
                    </button>
                    <button onClick={() => applyScientific('square')} className="p-1.5 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition shadow-2xs border border-indigo-100 dark:border-indigo-900/40">
                      x²
                    </button>
                    <button onClick={() => applyScientific('cube')} className="p-1.5 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition shadow-2xs border border-indigo-100 dark:border-indigo-900/40">
                      x³
                    </button>

                    <button onClick={() => applyScientific('sin')} className="p-1.5 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition shadow-2xs border border-slate-200 dark:border-slate-700">sin</button>
                    <button onClick={() => applyScientific('cos')} className="p-1.5 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition shadow-2xs border border-slate-200 dark:border-slate-700">cos</button>
                    <button onClick={() => applyScientific('tan')} className="p-1.5 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition shadow-2xs border border-slate-200 dark:border-slate-700">tan</button>

                    <button onClick={() => applyScientific('asin')} className="p-1.5 text-[10px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition shadow-2xs border border-slate-200 dark:border-slate-700">arcsin</button>
                    <button onClick={() => applyScientific('acos')} className="p-1.5 text-[10px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition shadow-2xs border border-slate-200 dark:border-slate-700">arccos</button>
                    <button onClick={() => applyScientific('atan')} className="p-1.5 text-[10px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition shadow-2xs border border-slate-200 dark:border-slate-700">arctan</button>

                    <button onClick={() => applyScientific('fact')} className="p-1.5 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition shadow-2xs border border-slate-200 dark:border-slate-700">n!</button>
                    <button onClick={() => applyScientific('abs')} className="p-1.5 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition shadow-2xs border border-slate-200 dark:border-slate-700">|x|</button>
                    <button onClick={() => applyScientific('exp')} className="p-1.5 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition shadow-2xs border border-slate-200 dark:border-slate-700">10ˣ</button>

                    <button onClick={() => applyScientific('pi')} className="p-1.5 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition shadow-2xs border border-slate-200 dark:border-slate-700">π</button>
                    <button onClick={() => applyScientific('e')} className="p-1.5 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition shadow-2xs border border-slate-200 dark:border-slate-700">e</button>
                    <button onClick={() => handleOperator('^')} className="p-1.5 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition shadow-2xs border border-slate-200 dark:border-slate-700">xʸ</button>
                  </div>
                )}

                {/* Standard Keypad Compact */}
                <div className={`${isScientific ? 'md:col-span-3' : 'col-span-1'} grid grid-cols-4 gap-2`}>
                  <button onClick={clearAll} className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 transition-colors shadow-2xs text-xs">AC</button>
                  <button onClick={toggleSign} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors shadow-2xs text-xs">+/-</button>
                  <button onClick={percentage} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors shadow-2xs text-xs">%</button>
                  <button onClick={() => handleOperator('÷')} className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100 transition-colors shadow-2xs text-sm">÷</button>

                  <button onClick={() => inputDigit('7')} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-bold hover:bg-slate-100 transition-colors shadow-2xs text-sm">7</button>
                  <button onClick={() => inputDigit('8')} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-bold hover:bg-slate-100 transition-colors shadow-2xs text-sm">8</button>
                  <button onClick={() => inputDigit('9')} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-bold hover:bg-slate-100 transition-colors shadow-2xs text-sm">9</button>
                  <button onClick={() => handleOperator('×')} className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100 transition-colors shadow-2xs text-sm">×</button>

                  <button onClick={() => inputDigit('4')} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-bold hover:bg-slate-100 transition-colors shadow-2xs text-sm">4</button>
                  <button onClick={() => inputDigit('5')} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-bold hover:bg-slate-100 transition-colors shadow-2xs text-sm">5</button>
                  <button onClick={() => inputDigit('6')} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-bold hover:bg-slate-100 transition-colors shadow-2xs text-sm">6</button>
                  <button onClick={() => handleOperator('-')} className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100 transition-colors shadow-2xs text-sm">-</button>

                  <button onClick={() => inputDigit('1')} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-bold hover:bg-slate-100 transition-colors shadow-2xs text-sm">1</button>
                  <button onClick={() => inputDigit('2')} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-bold hover:bg-slate-100 transition-colors shadow-2xs text-sm">2</button>
                  <button onClick={() => inputDigit('3')} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-bold hover:bg-slate-100 transition-colors shadow-2xs text-sm">3</button>
                  <button onClick={() => handleOperator('+')} className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100 transition-colors shadow-2xs text-sm">+</button>

                  <button onClick={() => inputDigit('0')} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-bold hover:bg-slate-100 transition-colors shadow-2xs col-span-2 text-sm">0</button>
                  <button onClick={inputDecimal} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-bold hover:bg-slate-100 transition-colors shadow-2xs text-sm">.</button>
                  <button onClick={calculate} className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-md shadow-blue-500/25 text-sm">=</button>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
