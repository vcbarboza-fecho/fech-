import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Minus,
  Search, 
  Trash2, 
  Edit2, 
  Edit3,
  ChevronRight, 
  Beer, 
  Utensils, 
  Coffee, 
  X, 
  Check,
  CheckCircle2, 
  Receipt, 
  Users, 
  Package,
  FileText,
  ArrowLeft,
  Save,
  Clock,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  DollarSign,
  MoveHorizontal,
  Wine,
  GlassWater,
  Pizza,
  IceCream,
  Flame,
  Beef,
  Fish,
  Apple,
  Cookie,
  Zap,
  Music,
  Ticket,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
}

interface PayerDetail {
  name: string;
  amount: number;
}

interface TabItem {
  productId: string;
  quantity: number;
  paidQuantity: number;
  timestamp: number;
  price?: number;
  payerName?: string;
  payerDetails?: PayerDetail[];
}

interface TabPayment {
  id: string;
  amount: number;
  method: 'Dinheiro' | 'PIX' | 'Débito' | 'Crédito';
  timestamp: number;
  payerName?: string;
}

interface Tab {
  id: string;
  customerName: string;
  groupTime: string;
  service?: string;
  isAvulso?: boolean;
  items: TabItem[];
  payments?: TabPayment[];
  openedAt: number;
  closedAt?: number;
  status: 'open' | 'closed' | 'deleted';
  paymentMethod?: 'Dinheiro' | 'PIX' | 'Débito' | 'Crédito';
  finalPayerName?: string;
  discountPercentage?: number;
  deletionReason?: string;
  deletedAt?: number;
}

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

interface CompanyInfo {
  name: string;
  cnpj: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

// --- Constants ---

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_food', name: 'Comida', icon: 'Utensils' },
  { id: 'cat_drinks', name: 'Bebida', icon: 'Beer' },
  { id: 'cat_snacks', name: 'Petisco', icon: 'Coffee' },
  { id: 'cat_cocktails', name: 'Drink', icon: 'GlassWater' },
  { id: 'cat_sweets', name: 'Doce', icon: 'Cookie' },
  { id: 'cat_game', name: 'Jogo', icon: 'Ticket' },
  { id: 'cat_other', name: 'Outros', icon: 'Package' },
];

const ICON_MAP: Record<string, React.ElementType> = {
  Beer,
  Wine,
  GlassWater,
  Coffee,
  Utensils,
  Pizza,
  IceCream,
  Flame,
  Beef,
  Fish,
  Apple,
  Cookie,
  Zap,
  Music,
  Ticket,
  Package
};

const getCategoryIcon = (iconName: string) => {
  const IconComponent = ICON_MAP[iconName] || Package;
  return <IconComponent className="w-4 h-4" />;
};

const Logo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <img 
    src="/logo.png" 
    alt="Logo" 
    className={className}
    referrerPolicy="no-referrer"
  />
);

// --- Main Component ---

function HistoryView({ tabs, products, calculateTotal, calculateTabPaidAmount, calculateTabNetTotal, calculateTabGameFeeTotal, calculateTabDiscountAmount, onViewTab, onUpdateTab, categories }: { 
  tabs: Tab[]; 
  products: Product[];
  calculateTotal: (tab: Tab) => number; 
  calculateTabPaidAmount: (tab: Tab) => number;
  calculateTabNetTotal: (tab: Tab) => number;
  calculateTabGameFeeTotal: (tab: Tab) => number;
  calculateTabDiscountAmount: (tab: Tab) => number;
  onViewTab: (tab: Tab) => void;
  onUpdateTab: (tab: Tab) => void;
  categories: Category[];
}) {
  const [filter, setFilter] = useState('');
  const [viewMode, setViewMode] = useState<'individual' | 'daily'>('individual');
  const [isFinalReportOpen, setIsFinalReportOpen] = useState(false);
  const [selectedDayForReport, setSelectedDayForReport] = useState<Tab[] | null>(null);

  const filteredTabs = useMemo(() => {
    return tabs
      .filter(t => 
        t.customerName.toLowerCase().includes(filter.toLowerCase()) || 
        t.groupTime.includes(filter)
      )
      .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
  }, [tabs, filter]);

  const dailyHistory = useMemo(() => {
    const groups: Record<string, { date: string, total: number, totalDiscounts: number, count: number, tabs: Tab[] }> = {};
    tabs.forEach(tab => {
      const timestamp = tab.closedAt || tab.deletedAt;
      if (!timestamp) return;
      const dateKey = new Date(timestamp).toLocaleDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = { date: dateKey, total: 0, totalDiscounts: 0, count: 0, tabs: [] };
      }
      
      if (tab.status === 'closed') {
        const netTotal = calculateTabNetTotal(tab);
        const discountAmount = calculateTabDiscountAmount(tab);
        
        groups[dateKey].total += netTotal;
        groups[dateKey].totalDiscounts += discountAmount;
        groups[dateKey].count += 1;
      }
      
      groups[dateKey].tabs.push(tab);
    });
    return Object.values(groups).sort((a, b) => {
      const timeA = a.tabs[0].closedAt || a.tabs[0].deletedAt || 0;
      const timeB = b.tabs[0].closedAt || b.tabs[0].deletedAt || 0;
      return timeB - timeA;
    });
  }, [tabs, calculateTotal]);

  return (
    <motion.div 
      key="history-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex p-1 bg-black/5 rounded-2xl w-fit">
        <button 
          onClick={() => setViewMode('individual')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'individual' ? 'bg-white text-black shadow-sm' : 'text-black/40 hover:text-black'}`}
        >
          Comandas
        </button>
        <button 
          onClick={() => setViewMode('daily')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'daily' ? 'bg-white text-black shadow-sm' : 'text-black/40 hover:text-black'}`}
        >
          Resumo Diário
        </button>
      </div>

      {viewMode === 'individual' ? (
        <>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
            <input 
              type="text" 
              placeholder="Filtrar por nome ou horário do grupo..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-white border border-black/5 rounded-2xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
            />
          </div>

          <div className="space-y-4">
            {filteredTabs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-black/40">
                <Clock className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">Nenhum resultado encontrado</p>
                <p className="text-sm">Tente outro termo de busca</p>
              </div>
            ) : (
              filteredTabs.map(tab => (
                <div 
                  key={tab.id} 
                  onClick={() => onViewTab(tab)}
                  className={`bg-white p-4 md:p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-all cursor-pointer group ${tab.status === 'deleted' ? 'border-red-100 bg-red-50/30 grayscale-[0.5]' : 'border-black/5 hover:border-black/20'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${tab.status === 'deleted' ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white'}`}>
                      {tab.status === 'deleted' ? <Trash2 className="w-5 h-5 md:w-6 md:h-6" /> : <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm md:text-base">{tab.customerName}</h3>
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest bg-black/5 px-2 py-0.5 rounded-full text-black/40">
                          {tab.isAvulso ? 'Cliente Avulso' : tab.groupTime}
                        </span>
                        {tab.service && tab.service !== 'Cliente Avulso' && (
                          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
                            {tab.service}
                          </span>
                        )}
                        {tab.status === 'deleted' && (
                          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest bg-red-500 text-white px-2 py-0.5 rounded-full">
                            Excluída
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] md:text-xs text-black/40">
                        {tab.status === 'deleted' 
                          ? `Excluída em ${new Date(tab.deletedAt!).toLocaleDateString()} às ${new Date(tab.deletedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : `Fechada em ${new Date(tab.closedAt!).toLocaleDateString()} às ${new Date(tab.closedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        }
                      </p>
                      {tab.status === 'deleted' && tab.deletionReason && (
                        <p className="text-[10px] text-red-500 italic mt-1 font-medium">
                          Motivo: {tab.deletionReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 flex sm:flex-col justify-between items-center sm:items-end">
                    <div className="flex flex-wrap gap-1 justify-end mb-1">
                      {Array.from(new Set([
                        ...(tab.payments || []).map(p => p.method),
                        ...(tab.paymentMethod ? [tab.paymentMethod] : [])
                      ])).map(method => (
                        <span key={method} className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${tab.status === 'deleted' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                          {method}
                        </span>
                      ))}
                    </div>
                    <p className={`text-lg md:text-xl font-bold ${tab.status === 'deleted' ? 'text-black/40 line-through' : ''}`}>R$ {calculateTabNetTotal(tab).toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {dailyHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-black/40">
              <Clock className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhum histórico diário</p>
            </div>
          ) : (
            dailyHistory.map(day => (
              <div key={day.date} className="bg-white p-6 rounded-2xl border border-black/5 flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="font-bold text-lg">{day.date}</h3>
                  <p className="text-sm text-black/40">{day.count} comandas finalizadas</p>
                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs font-bold text-emerald-600">Receita: R$ {day.total.toFixed(2)}</p>
                    <p className="text-xs font-bold text-red-500">Descontos: R$ {day.totalDiscounts.toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedDayForReport(day.tabs);
                      setIsFinalReportOpen(true);
                    }}
                    className="mt-3 text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Receipt className="w-3 h-3" />
                    Ver Relatório Final Consolidado
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-xs text-black/40 uppercase font-bold tracking-wider">Total do Dia</p>
                  <p className="text-2xl font-bold">R$ {day.total.toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isFinalReportOpen && selectedDayForReport && (
        <FinalReportModal 
          tabs={selectedDayForReport}
          products={products}
          onClose={() => setIsFinalReportOpen(false)}
          onUpdateTab={onUpdateTab}
        />
      )}
    </motion.div>
  );
}

function FinalReportModal({ tabs, products, onClose, onUpdateTab }: { 
  tabs: Tab[]; 
  products: Product[]; 
  onClose: () => void;
  onUpdateTab: (tab: Tab) => void;
}) {
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  
  const allReportItems = useMemo(() => {
    const items: { tab: Tab, item: TabItem, index: number }[] = [];
    tabs.forEach(tab => {
      tab.items.forEach((item, idx) => {
        items.push({ tab, item, index: idx });
      });
    });
    return items.sort((a, b) => {
      const serviceA = a.tab.service || 'Futebol Sintético';
      const serviceB = b.tab.service || 'Futebol Sintético';
      if (serviceA !== serviceB) return serviceA.localeCompare(serviceB);
      return a.tab.groupTime.localeCompare(b.tab.groupTime);
    });
  }, [tabs]);

  const filteredItems = useMemo(() => {
    return allReportItems.filter(i => {
      const hourMatch = !selectedHour || i.tab.groupTime === selectedHour;
      const serviceMatch = !selectedService || (i.tab.service || 'Futebol Sintético') === selectedService;
      return hourMatch && serviceMatch;
    });
  }, [allReportItems, selectedHour, selectedService]);

  const hours = useMemo(() => {
    const uniqueHours = new Set<string>();
    allReportItems.forEach(i => uniqueHours.add(i.tab.groupTime));
    return Array.from(uniqueHours).sort();
  }, [allReportItems]);

  const services = useMemo(() => {
    const uniqueServices = new Set<string>();
    allReportItems.forEach(i => uniqueServices.add(i.tab.service || 'Futebol Sintético'));
    return Array.from(uniqueServices).sort();
  }, [allReportItems]);

  const consolidatedSummary = useMemo(() => {
    const summary: Record<string, { service: string, total: number, hours: Record<string, { hour: string, total: number, count: number }> }> = {};
    
    allReportItems.forEach(({ tab, item }) => {
      const service = tab.service || 'Futebol Sintético';
      const hour = tab.groupTime || 'Avulso';
      
      if (!summary[service]) {
        summary[service] = { service, total: 0, hours: {} };
      }
      
      if (!summary[service].hours[hour]) {
        summary[service].hours[hour] = { hour, total: 0, count: 0 };
      }
      
      const product = products.find(p => p.id === item.productId);
      const itemPrice = item.price !== undefined && item.price !== null ? item.price : (product?.price || 0);
      const itemTotal = itemPrice * item.quantity;
      
      summary[service].total += itemTotal;
      summary[service].hours[hour].total += itemTotal;
      summary[service].hours[hour].count += item.quantity;
    });
    
    return Object.values(summary).sort((a, b) => a.service.localeCompare(b.service));
  }, [allReportItems, products]);

  const [editingItem, setEditingItem] = useState<{ tabId: string, itemIdx: number, details: PayerDetail[], totalAmount: number } | null>(null);

  const handleSavePayerDetails = () => {
    if (!editingItem) return;
    
    const currentSum = editingItem.details.reduce((sum, d) => sum + d.amount, 0);
    if (Math.abs(currentSum - editingItem.totalAmount) > 0.01) {
      alert(`O valor total dos pagadores (R$ ${currentSum.toFixed(2)}) deve ser igual ao valor total do item (R$ ${editingItem.totalAmount.toFixed(2)})`);
      return;
    }

    const tab = tabs.find(t => t.id === editingItem.tabId);
    if (tab) {
      const newItems = [...tab.items];
      const details = editingItem.details.filter(d => d.name.trim() !== '');
      const payerName = details.map(d => d.name).join(', ');
      newItems[editingItem.itemIdx] = { 
        ...newItems[editingItem.itemIdx], 
        payerName,
        payerDetails: details 
      };
      onUpdateTab({ ...tab, items: newItems });
    }
    setEditingItem(null);
  };

  return (
    <Modal title="Relatório Final Consolidado" onClose={onClose}>
      <div className="space-y-6">
        {/* Resumo Consolidado */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-black/40">Resumo Consolidado por Serviço e Horário</h3>
          
          {consolidatedSummary.map(serviceGroup => (
            <div key={serviceGroup.service} className="bg-black/5 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-black/5 pb-2">
                <h4 className="font-bold text-sm uppercase tracking-wider text-emerald-600">{serviceGroup.service}</h4>
                <p className="font-bold text-sm">Total: R$ {serviceGroup.total.toFixed(2)}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.values(serviceGroup.hours) as { hour: string, total: number, count: number }[])
                  .sort((a, b) => a.hour.localeCompare(b.hour))
                  .map(item => (
                  <div 
                    key={`${serviceGroup.service}-${item.hour}`}
                    onClick={() => {
                      setSelectedService(serviceGroup.service);
                      setSelectedHour(item.hour === 'Avulso' ? null : item.hour);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedService === serviceGroup.service && (selectedHour === item.hour || (item.hour === 'Avulso' && !selectedHour))
                        ? 'bg-black text-white border-black shadow-md'
                        : 'bg-white border-black/5 hover:border-black/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-mono font-bold">
                        {item.hour}
                      </span>
                      <span className="text-[10px] opacity-60">{item.count} {item.count === 1 ? 'Item' : 'Itens'}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="font-bold">R$ {item.total.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black/40">Detalhamento de Pagamentos</h3>
            <p className="text-sm text-black/40">Selecione um serviço ou horário acima para filtrar, ou use os botões abaixo.</p>
            
            <div className="space-y-3">
              {/* Filtros por Serviço */}
              {services.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedService(null)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${!selectedService ? 'bg-black text-white' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
                  >
                    Todos Serviços
                  </button>
                  {services.map(service => (
                    <button
                      key={service}
                      onClick={() => setSelectedService(service)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${selectedService === service ? 'bg-black text-white' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              )}

              {/* Filtros por Horário */}
              {hours.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedHour(null)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${!selectedHour ? 'bg-black text-white' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
                  >
                    Todos Horários
                  </button>
                  {hours.map(hour => (
                    <button
                      key={hour}
                      onClick={() => setSelectedHour(hour)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${selectedHour === hour ? 'bg-black text-white' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {filteredItems.length === 0 ? (
            <p className="text-center py-10 text-black/20">Nenhum registro encontrado.</p>
          ) : (
            filteredItems.map(({ tab, item, index }) => {
              const product = products.find(p => p.id === item.productId);
              const itemPrice = item.price !== undefined && item.price !== null ? item.price : (product?.price || 0);
              return (
                <div key={`${tab.id}-${index}`} className="p-4 bg-black/5 rounded-2xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-black/10 px-2 py-0.5 rounded-full text-black/60">
                          {tab.isAvulso ? 'Cliente Avulso' : `Grupo: ${tab.groupTime}`}
                        </span>
                        {tab.service && tab.service !== 'Cliente Avulso' && (
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
                            {tab.service}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-sm mt-1">{tab.customerName} - <span className="text-black/40 font-normal">{product?.name}</span></p>
                    </div>
                    <p className="font-mono font-bold text-sm">R$ {(itemPrice * item.quantity).toFixed(2)}</p>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-black/5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-black/60 italic">
                          {item.payerDetails && item.payerDetails.length > 0 
                            ? `Pago por: ${item.payerDetails.map(d => d.name).join(', ')}` 
                            : item.payerName ? `Pago por: ${item.payerName}` : 'Nome do pagador não definido'}
                        </p>
                        <button 
                          onClick={() => {
                            const itemTotal = itemPrice * item.quantity;
                            const initialDetails = item.payerDetails || (item.payerName ? [{ name: item.payerName, amount: itemTotal }] : []);
                            if (initialDetails.length === 0) {
                              initialDetails.push({ name: '', amount: itemTotal });
                            }
                            setEditingItem({ tabId: tab.id, itemIdx: index, details: initialDetails, totalAmount: itemTotal });
                          }}
                          className="text-black/40 hover:text-black transition-all"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {editingItem && (
        <Modal title="Identificar Pagadores" onClose={() => setEditingItem(null)}>
          <div className="space-y-4">
            <div className="bg-black/5 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-black/40">
                <span>Total do Item</span>
                <span>R$ {editingItem.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span>Soma dos Pagadores</span>
                <span className={Math.abs(editingItem.details.reduce((sum, d) => sum + d.amount, 0) - editingItem.totalAmount) > 0.01 ? 'text-red-500' : 'text-emerald-600'}>
                  R$ {editingItem.details.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                </span>
              </div>
              {Math.abs(editingItem.details.reduce((sum, d) => sum + d.amount, 0) - editingItem.totalAmount) > 0.01 && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
                  <AlertCircle className="w-3 h-3" />
                  A soma deve ser exatamente R$ {editingItem.totalAmount.toFixed(2)}
                </div>
              )}
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              {editingItem.details.map((detail, idx) => (
                <div key={idx} className="flex gap-2 items-end bg-black/5 p-3 rounded-xl">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Nome</label>
                    <input 
                      type="text"
                      value={detail.name}
                      onChange={(e) => {
                        const newDetails = [...editingItem.details];
                        newDetails[idx].name = e.target.value;
                        setEditingItem({ ...editingItem, details: newDetails });
                      }}
                      placeholder="Ex: João"
                      className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Valor</label>
                    <input 
                      type="number"
                      value={detail.amount}
                      onChange={(e) => {
                        const newDetails = [...editingItem.details];
                        newDetails[idx].amount = parseFloat(e.target.value) || 0;
                        setEditingItem({ ...editingItem, details: newDetails });
                      }}
                      className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const newDetails = editingItem.details.filter((_, i) => i !== idx);
                      setEditingItem({ ...editingItem, details: newDetails });
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => {
                const currentSum = editingItem.details.reduce((sum, d) => sum + d.amount, 0);
                const remaining = Math.max(0, editingItem.totalAmount - currentSum);
                const newDetails = [...editingItem.details, { name: '', amount: remaining }];
                setEditingItem({ ...editingItem, details: newDetails });
              }}
              className="w-full py-2 border-2 border-dashed border-black/10 rounded-xl text-xs font-bold text-black/40 hover:border-black/20 hover:text-black transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-3 h-3" /> Adicionar Pagador
            </button>

            <div className="flex gap-2 pt-4 border-t border-black/5">
              <button 
                onClick={() => setEditingItem(null)}
                className="flex-1 py-3 rounded-xl font-bold text-black/40 hover:bg-black/5 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSavePayerDetails}
                disabled={Math.abs(editingItem.details.reduce((sum, d) => sum + d.amount, 0) - editingItem.totalAmount) > 0.01}
                className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-black/80 disabled:bg-black/20 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/10"
              >
                Salvar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}

function GameFeeView({ tabs, products, onUpdateTab }: { 
  tabs: Tab[]; 
  products: Product[]; 
  onUpdateTab: (tab: Tab) => void;
}) {
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingItem, setEditingItem] = useState<{ tabId: string, itemIdx: number, details: PayerDetail[], totalAmount: number } | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  
  const gameFeeProduct = products.find(p => p.name.toLowerCase().includes('taxa de jogo') || p.id === 'prod_game_fee');
  
  const allGroupedFees = useMemo(() => {
    const groups: Record<string, { date: string, time: string, items: { tab: Tab, item: TabItem, index: number }[], total: number }> = {};
    
    tabs.forEach(tab => {
      if (tab.status !== 'closed') return;
      const date = new Date(tab.closedAt!).toISOString().split('T')[0];
      if (date !== filterDate) return;
      
      tab.items.forEach((item, idx) => {
        if (item.productId === gameFeeProduct?.id || item.productId === 'prod_game_fee') {
          const key = `${date}_${tab.groupTime}`;
          if (!groups[key]) {
            groups[key] = { date, time: tab.groupTime, items: [], total: 0 };
          }
          groups[key].items.push({ tab, item, index: idx });
          groups[key].total += (item.price || gameFeeProduct?.price || 0) * item.quantity;
        }
      });
    });
    
    return Object.values(groups).sort((a, b) => a.time.localeCompare(b.time));
  }, [tabs, gameFeeProduct, filterDate]);

  const filteredGroupedFees = useMemo(() => {
    if (!selectedHour) return allGroupedFees;
    return allGroupedFees.filter(g => g.time === selectedHour);
  }, [allGroupedFees, selectedHour]);

  const hours = useMemo(() => {
    return allGroupedFees.map(g => g.time);
  }, [allGroupedFees]);

  const handleSavePayerDetails = () => {
    if (!editingItem) return;

    const currentSum = editingItem.details.reduce((sum, d) => sum + d.amount, 0);
    if (Math.abs(currentSum - editingItem.totalAmount) > 0.01) {
      alert(`O valor total dos pagadores (R$ ${currentSum.toFixed(2)}) deve ser igual ao valor total do item (R$ ${editingItem.totalAmount.toFixed(2)})`);
      return;
    }

    const tab = tabs.find(t => t.id === editingItem.tabId);
    if (tab) {
      const newItems = [...tab.items];
      const details = editingItem.details.filter(d => d.name.trim() !== '');
      const payerName = details.map(d => d.name).join(', ');
      newItems[editingItem.itemIdx] = { 
        ...newItems[editingItem.itemIdx], 
        payerName,
        payerDetails: details 
      };
      onUpdateTab({ ...tab, items: newItems });
    }
    setEditingItem(null);
  };

  const totalDay = allGroupedFees.reduce((sum, g) => sum + g.total, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Relatório de Taxas de Jogo</h2>
          <p className="text-black/40">Acompanhamento de pagamentos por horário e dia.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex gap-2">
            <button 
              onClick={() => setIsSummaryOpen(true)}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-black/80 transition-all shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Resumo por Horário
            </button>
          </div>
          <div className="flex-1 md:flex-none">
            <p className="text-[10px] uppercase font-bold tracking-widest text-black/40 mb-1">Data</p>
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setSelectedHour(null);
              }}
              className="w-full bg-black/5 border-none rounded-xl px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-black transition-all"
            />
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 mb-1">Soma Total do Dia</p>
            <p className="text-2xl font-bold text-emerald-600">R$ {totalDay.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Filtros por Horário */}
      {hours.length > 0 && (
        <div className="flex flex-wrap gap-2 bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
          <p className="w-full text-[10px] uppercase font-bold tracking-widest text-black/40 mb-2">Filtrar por Horário:</p>
          <button
            onClick={() => setSelectedHour(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!selectedHour ? 'bg-black text-white' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
          >
            Todos
          </button>
          {hours.map(hour => (
            <button
              key={hour}
              onClick={() => setSelectedHour(hour)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedHour === hour ? 'bg-black text-white' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
            >
              {hour}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {filteredGroupedFees.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-black/5 text-center space-y-4">
            <Receipt className="w-12 h-12 mx-auto text-black/10" />
            <p className="text-black/40 font-medium">Nenhuma taxa registrada para este dia.</p>
          </div>
        ) : (
          filteredGroupedFees.map(group => (
            <div key={`${group.date}-${group.time}`} className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
              <div className="p-4 bg-black/5 border-b border-black/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold">
                    {group.time}
                  </div>
                  <h3 className="font-bold">Horário: {group.time}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-black/40">Soma do Horário</p>
                  <p className="text-lg font-bold">R$ {group.total.toFixed(2)}</p>
                </div>
              </div>
              <div className="divide-y divide-black/5">
                {group.items.map(({ tab, item, index }) => (
                   <div key={`${tab.id}-${index}`} className="p-4 flex justify-between items-center hover:bg-black/[0.02] transition-all">
                     <div className="flex-1">
                       <p className="font-bold text-sm">{tab.customerName}</p>
                       <div className="flex items-center gap-2">
                         <p className="text-xs text-black/40 italic">
                           {item.payerDetails && item.payerDetails.length > 0 
                             ? `Pagos por: ${item.payerDetails.map(d => d.name).join(', ')}` 
                             : item.payerName ? `Pagos por: ${item.payerName}` : 'Pagadores não identificados'}
                         </p>
                         <button 
                           onClick={() => {
                              const itemTotal = (item.price || gameFeeProduct?.price || 0) * item.quantity;
                              const initialDetails = item.payerDetails || (item.payerName ? [{ name: item.payerName, amount: itemTotal }] : []);
                             if (initialDetails.length === 0) {
                                initialDetails.push({ name: '', amount: itemTotal });
                             }
                              setEditingItem({ tabId: tab.id, itemIdx: index, details: initialDetails, totalAmount: itemTotal });
                           }}
                           className="text-black/20 hover:text-black transition-all"
                         >
                           <Edit2 className="w-3 h-3" />
                         </button>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="text-[10px] text-black/40 font-bold">{item.quantity}x R$ {(item.price || gameFeeProduct?.price || 0).toFixed(2)}</p>
                       <p className="font-mono font-bold">R$ {((item.price || gameFeeProduct?.price || 0) * item.quantity).toFixed(2)}</p>
                     </div>
                   </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {editingItem && (
        <Modal title="Identificar Pagadores" onClose={() => setEditingItem(null)}>
          <div className="space-y-4">
            <div className="bg-black/5 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-black/40">
                <span>Total do Item</span>
                <span>R$ {editingItem.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span>Soma dos Pagadores</span>
                <span className={Math.abs(editingItem.details.reduce((sum, d) => sum + d.amount, 0) - editingItem.totalAmount) > 0.01 ? 'text-red-500' : 'text-emerald-600'}>
                  R$ {editingItem.details.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                </span>
              </div>
              {Math.abs(editingItem.details.reduce((sum, d) => sum + d.amount, 0) - editingItem.totalAmount) > 0.01 && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
                  <AlertCircle className="w-3 h-3" />
                  A soma deve ser exatamente R$ {editingItem.totalAmount.toFixed(2)}
                </div>
              )}
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              {editingItem.details.map((detail, idx) => (
                <div key={idx} className="flex gap-2 items-end bg-black/5 p-3 rounded-xl">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Nome</label>
                    <input 
                      type="text"
                      value={detail.name}
                      onChange={(e) => {
                        const newDetails = [...editingItem.details];
                        newDetails[idx].name = e.target.value;
                        setEditingItem({ ...editingItem, details: newDetails });
                      }}
                      placeholder="Ex: João"
                      className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Valor</label>
                    <input 
                      type="number"
                      value={detail.amount}
                      onChange={(e) => {
                        const newDetails = [...editingItem.details];
                        newDetails[idx].amount = parseFloat(e.target.value) || 0;
                        setEditingItem({ ...editingItem, details: newDetails });
                      }}
                      className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const newDetails = editingItem.details.filter((_, i) => i !== idx);
                      setEditingItem({ ...editingItem, details: newDetails });
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => {
                const currentSum = editingItem.details.reduce((sum, d) => sum + d.amount, 0);
                const remaining = Math.max(0, editingItem.totalAmount - currentSum);
                const newDetails = [...editingItem.details, { name: '', amount: remaining }];
                setEditingItem({ ...editingItem, details: newDetails });
              }}
              className="w-full py-2 border-2 border-dashed border-black/10 rounded-xl text-xs font-bold text-black/40 hover:border-black/20 hover:text-black transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-3 h-3" /> Adicionar Pagador
            </button>

            <div className="flex gap-2 pt-4 border-t border-black/5">
              <button 
                onClick={() => setEditingItem(null)}
                className="flex-1 py-3 rounded-xl font-bold text-black/40 hover:bg-black/5 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSavePayerDetails}
                disabled={Math.abs(editingItem.details.reduce((sum, d) => sum + d.amount, 0) - editingItem.totalAmount) > 0.01}
                className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-black/80 disabled:bg-black/20 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/10"
              >
                Salvar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {isSummaryOpen && (
        <GameFeeSummaryModal 
          groupedFees={allGroupedFees} 
          onClose={() => setIsSummaryOpen(false)} 
          initialHour={selectedHour}
        />
      )}
    </motion.div>
  );
}

function GameFeeSummaryModal({ groupedFees, onClose, initialHour = null }: { groupedFees: any[], onClose: () => void, initialHour?: string | null }) {
  const [selectedHour, setSelectedHour] = useState<string | null>(initialHour);

  const hours = useMemo(() => {
    return Array.from(new Set(groupedFees.map(g => g.time))).sort();
  }, [groupedFees]);

  const filteredGroups = useMemo(() => {
    if (!selectedHour) return groupedFees;
    return groupedFees.filter(g => g.time === selectedHour);
  }, [groupedFees, selectedHour]);

  return (
    <Modal title="Resumo Consolidado por Horário" onClose={onClose}>
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Filtros por Horário */}
        <div className="flex flex-wrap gap-2 mb-4 sticky top-0 bg-white z-10 py-2 border-b border-black/5">
          <button
            onClick={() => setSelectedHour(null)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${!selectedHour ? 'bg-black text-white' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
          >
            Todos
          </button>
          {hours.map(hour => (
            <button
              key={hour}
              onClick={() => setSelectedHour(hour)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${selectedHour === hour ? 'bg-black text-white' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
            >
              {hour}
            </button>
          ))}
        </div>

        {filteredGroups.map(group => (
          <div key={group.time} className="bg-black/5 p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center border-b border-black/10 pb-2">
              <h4 className="font-bold text-lg flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {group.time}
              </h4>
              <p className="font-mono font-bold text-emerald-600">Total: R$ {group.total.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold tracking-widest text-black/40">Pagadores e Valores:</p>
              <div className="bg-white/50 p-3 rounded-xl border border-black/5 divide-y divide-black/5">
                {group.items.map((itemObj: any, idx: number) => {
                  const details = itemObj.item.payerDetails || (itemObj.item.payerName ? [{ name: itemObj.item.payerName, amount: (itemObj.item.price || 0) * itemObj.item.quantity }] : [{ name: itemObj.tab.customerName, amount: (itemObj.item.price || 0) * itemObj.item.quantity }]);
                  return details.map((detail: any, dIdx: number) => (
                    <div key={`${idx}-${dIdx}`} className="py-1.5 flex justify-between items-center text-sm">
                      <span className="font-bold">{detail.name}</span>
                      <span className="font-mono font-bold text-black/60">R$ {detail.amount.toFixed(2)}</span>
                    </div>
                  ));
                })}
              </div>
            </div>
          </div>
        ))}
        {filteredGroups.length === 0 && (
          <p className="text-center text-black/40 py-8">Nenhum dado para exibir.</p>
        )}
      </div>
      <div className="mt-6">
        <button 
          onClick={onClose}
          className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-black/80 transition-all"
        >
          Fechar Relatório
        </button>
      </div>
    </Modal>
  );
}

function UserManagementView({ token, currentUser, companyInfo, onUpdateCompanyInfo, onResetDatabase }: { 
  token: string, 
  currentUser: User,
  companyInfo: CompanyInfo | null,
  onUpdateCompanyInfo: (info: CompanyInfo) => void,
  onResetDatabase: () => void
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [editingCompanyData, setEditingCompanyData] = useState<CompanyInfo | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) { console.error(e); }
  };

  const updateCompanyInfo = async (info: CompanyInfo) => {
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(info)
      });
      if (res.ok) {
        onUpdateCompanyInfo(info);
        setIsEditingCompany(false);
        setEditingCompanyData(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao atualizar dados da empresa.');
      }
    } catch (e) {
      alert('Erro de conexão ao atualizar dados da empresa.');
    }
  };

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro && editingCompanyData) {
          setEditingCompanyData({
            ...editingCompanyData,
            cep: cep,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || ''
          });
        }
      } catch (e) {
        console.error('Erro ao buscar CEP:', e);
      }
    }
  };

  useEffect(() => { 
    fetchUsers(); 
  }, []);

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, password, role })
      });
      if (res.ok) {
        setIsAdding(false);
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao adicionar usuário');
      }
    } catch (e) { setError('Erro de conexão'); }
  };

  const handleDeleteUser = async (id: string) => {
    console.log('[ADMIN] Attempting to delete user:', id);
    if (id === currentUser.id) {
      alert('Você não pode excluir a si mesmo.');
      return;
    }
    
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json().catch(() => ({ error: 'Erro de resposta do servidor' }));
      
      if (res.ok) {
        console.log('[ADMIN] User deleted successfully:', id);
        alert('Usuário removido com sucesso!');
        setConfirmDeleteUserId(null);
        await fetchUsers();
      } else {
        console.error('[ADMIN] Failed to delete user:', data);
        alert(`Erro: ${data.error || 'Não foi possível excluir o usuário'}`);
      }
    } catch (e) { 
      console.error('[ADMIN] Network error during user deletion:', e);
      alert('Erro de conexão ao tentar excluir usuário.');
    }
  };

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold">Gerenciar Usuários</h3>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-black text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-black/80 transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Usuário
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/5 border-b border-black/5">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">E-mail</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Cargo</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-black/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{u.email}</span>
                      {u.id === currentUser.id && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">Você</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-black text-white' : 'bg-black/5 text-black/40'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.id !== currentUser.id && (
                      <button 
                        onClick={() => setConfirmDeleteUserId(u.id)}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-all"
                        title="Excluir Usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AnimatePresence>
        {confirmDeleteUserId && (
          <ConfirmModal 
            title="Excluir Usuário"
            message="Tem certeza que deseja excluir este usuário permanentemente? Esta ação não pode ser desfeita."
            onConfirm={() => handleDeleteUser(confirmDeleteUserId)}
            onCancel={() => setConfirmDeleteUserId(null)}
          />
        )}
      </AnimatePresence>

      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Dados da Empresa</h3>
          {!isEditingCompany && (
            <button 
              onClick={() => {
                setEditingCompanyData(companyInfo || {
                  name: '', cnpj: '', cep: '', street: '', number: '', neighborhood: '', city: '', state: ''
                });
                setIsEditingCompany(true);
              }}
              className="bg-black text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-black/80 transition-all"
            >
              <Edit2 className="w-4 h-4" /> {companyInfo ? 'Editar Dados' : 'Cadastrar Empresa'}
            </button>
          )}
        </div>

        {companyInfo && !isEditingCompany ? (
          <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-black/40 mb-1">Nome Fantasia</p>
                <p className="font-bold">{companyInfo.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-black/40 mb-1">CNPJ</p>
                <p className="font-mono">{companyInfo.cnpj}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-black/40 mb-1">CEP</p>
                <p className="font-mono">{companyInfo.cep}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-black/40 mb-1">Logradouro (Rua)</p>
                <p className="text-sm">{companyInfo.street}, {companyInfo.number}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-black/40 mb-1">Bairro</p>
                <p className="text-sm">{companyInfo.neighborhood}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-black/40 mb-1">Cidade / Estado</p>
                <p className="text-sm">{companyInfo.city} - {companyInfo.state}</p>
              </div>
            </div>
          </div>
        ) : !isEditingCompany && (
          <div className="bg-black/5 p-8 rounded-2xl text-center border border-dashed border-black/10">
            <p className="text-black/40 italic">Nenhuma empresa cadastrada.</p>
          </div>
        )}

        {isEditingCompany && editingCompanyData && (
          <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
            <form onSubmit={(e) => {
              e.preventDefault();
              updateCompanyInfo(editingCompanyData);
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Nome da Empresa</label>
                  <input 
                    name="name" 
                    value={editingCompanyData.name} 
                    onChange={(e) => setEditingCompanyData({ ...editingCompanyData, name: e.target.value })}
                    required 
                    className="w-full bg-black/5 rounded-xl px-4 py-3 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">CNPJ</label>
                  <input 
                    name="cnpj" 
                    value={editingCompanyData.cnpj} 
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 14) val = val.slice(0, 14);
                      
                      let masked = val;
                      if (val.length <= 2) {
                        masked = val;
                      } else if (val.length <= 5) {
                        masked = val.replace(/^(\d{2})(\d{0,3})/, '$1.$2');
                      } else if (val.length <= 8) {
                        masked = val.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
                      } else if (val.length <= 12) {
                        masked = val.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
                      } else {
                        masked = val.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
                      }
                      setEditingCompanyData({ ...editingCompanyData, cnpj: masked });
                    }}
                    required 
                    placeholder="00.000.000/0000-00"
                    className="w-full bg-black/5 rounded-xl px-4 py-3 outline-none font-mono" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">CEP</label>
                  <input 
                    name="cep" 
                    value={editingCompanyData.cep} 
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 8) val = val.slice(0, 8);
                      let masked = val;
                      if (val.length > 5) masked = val.replace(/^(\d{5})(\d{0,3}).*/, '$1-$2');
                      
                      setEditingCompanyData({ ...editingCompanyData, cep: masked });
                      if (val.length === 8) handleCepLookup(masked);
                    }}
                    required 
                    placeholder="00000-000"
                    className="w-full bg-black/5 rounded-xl px-4 py-3 outline-none font-mono" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Rua / Logradouro</label>
                  <input 
                    name="street" 
                    value={editingCompanyData.street} 
                    onChange={(e) => setEditingCompanyData({ ...editingCompanyData, street: e.target.value })}
                    required 
                    className="w-full bg-black/5 rounded-xl px-4 py-3 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Número</label>
                  <input 
                    name="number" 
                    value={editingCompanyData.number} 
                    onChange={(e) => setEditingCompanyData({ ...editingCompanyData, number: e.target.value })}
                    required 
                    className="w-full bg-black/5 rounded-xl px-4 py-3 outline-none" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Bairro</label>
                  <input 
                    name="neighborhood" 
                    value={editingCompanyData.neighborhood} 
                    onChange={(e) => setEditingCompanyData({ ...editingCompanyData, neighborhood: e.target.value })}
                    required 
                    className="w-full bg-black/5 rounded-xl px-4 py-3 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Cidade</label>
                  <input 
                    name="city" 
                    value={editingCompanyData.city} 
                    onChange={(e) => setEditingCompanyData({ ...editingCompanyData, city: e.target.value })}
                    required 
                    className="w-full bg-black/5 rounded-xl px-4 py-3 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Estado (UF)</label>
                  <input 
                    name="state" 
                    value={editingCompanyData.state} 
                    onChange={(e) => setEditingCompanyData({ ...editingCompanyData, state: e.target.value.toUpperCase() })}
                    required 
                    maxLength={2} 
                    className="w-full bg-black/5 rounded-xl px-4 py-3 outline-none uppercase" 
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-black text-white py-3 rounded-xl font-bold">Salvar Dados</button>
                <button type="button" onClick={() => {
                  setIsEditingCompany(false);
                  setEditingCompanyData(null);
                }} className="px-6 bg-black/5 py-3 rounded-xl font-bold">Cancelar</button>
              </div>
            </form>
          </div>
        )}
      </section>

      {isAdding && (
        <Modal title="Adicionar Usuário" onClose={() => setIsAdding(false)}>
          <form onSubmit={handleAddUser} className="space-y-4">
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">E-mail</label>
              <input name="email" type="email" required className="w-full bg-black/5 rounded-xl px-4 py-3 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Senha</label>
              <input name="password" type="password" required className="w-full bg-black/5 rounded-xl px-4 py-3 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Cargo</label>
              <select name="role" className="w-full bg-black/5 rounded-xl px-4 py-3 outline-none">
                <option value="user">Usuário Comum</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-bold">Criar Usuário</button>
          </form>
        </Modal>
      )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function AuthView({ onLogin }: { onLogin: (token: string, user: User) => void }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset' | 'verify'>('login');
  const [isInitialized, setIsInitialized] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [publicCompanyInfo, setPublicCompanyInfo] = useState<{ name: string, street: string, number: string, city: string, state: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/status')
      .then(res => res.json())
      .then(data => {
        setIsInitialized(data.initialized);
        if (!data.initialized) {
          setMode('signup');
        }
      })
      .catch(() => {});

    fetch('/api/public/company')
      .then(res => res.json())
      .then(data => setPublicCompanyInfo(data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      let url = '/api/auth/login';
      let body: any = { email, password };

      if (mode === 'signup') url = '/api/auth/signup';
      if (mode === 'verify') {
        url = '/api/auth/verify-email';
        body = { email, token };
      }
      if (mode === 'forgot') {
        url = '/api/auth/reset-password-request';
        body = { email };
      }
      if (mode === 'reset') {
        url = '/api/auth/reset-password';
        body = { email, token, newPassword: password };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        if (mode === 'login') {
          onLogin(data.token, data.user);
        } else if (mode === 'signup') {
          let msg = data.message;
          if (data.debugToken) {
            msg += ` (Simulação: use o token ${data.debugToken})`;
          }
          setMessage(msg);
          if (data.autoLogin) {
            setMode('login');
          } else {
            setMode('verify');
          }
        } else if (mode === 'verify') {
          setMessage(data.message);
          setMode('login');
        } else {
          let msg = data.message;
          if (data.debugToken) {
            msg += ` (Simulação: use o token ${data.debugToken})`;
          }
          setMessage(msg);
          if (mode === 'forgot') setMode('reset');
          else setMode('login');
        }
      } else {
        if (data.unverified) {
          setMode('verify');
        }
        setError(data.error || 'Ocorreu um erro');
      }
    } catch (e) {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-32 h-32 mx-auto mb-6 flex items-center justify-center overflow-hidden rounded-3xl bg-white shadow-sm"
          >
            <Logo className="w-full h-full object-cover" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black tracking-tighter text-black mb-2"
          >
            Fechô
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-black/30 font-bold tracking-[0.2em] uppercase text-[10px]"
          >
            {mode === 'login' ? 'Gestão de Comandas' : 
             mode === 'signup' ? 'Cadastro Administrativo' : 
             mode === 'forgot' ? 'Recuperação de Acesso' : 
             mode === 'verify' ? 'Validação de E-mail' : 'Nova Senha'}
          </motion.p>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-black/5 space-y-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100">{error}</div>}
            {message && <div className="bg-green-50 text-green-600 p-4 rounded-2xl text-sm font-medium border border-green-100">{message}</div>}
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-2 ml-1">E-mail</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-black/[0.03] border-2 border-transparent rounded-2xl px-5 py-4 focus:border-black focus:bg-white outline-none transition-all font-medium"
                  required
                />
              </div>

              {(mode === 'reset' || mode === 'verify') && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-2 ml-1">
                    {mode === 'verify' ? 'Código de Validação' : 'Token de Recuperação'}
                  </label>
                  <input 
                    type="text" 
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full bg-black/[0.03] border-2 border-transparent rounded-2xl px-5 py-4 focus:border-black focus:bg-white outline-none transition-all font-medium"
                    required
                  />
                </div>
              )}

              {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-2 ml-1">
                    {mode === 'reset' ? 'Nova Senha' : 'Senha'}
                  </label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/[0.03] border-2 border-transparent rounded-2xl px-5 py-4 focus:border-black focus:bg-white outline-none transition-all font-medium"
                    required
                  />
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black/90 active:scale-[0.98] transition-all shadow-xl shadow-black/10 disabled:opacity-50"
            >
              {loading ? 'Processando...' : 
               mode === 'login' ? 'Entrar' : 
               mode === 'signup' ? 'Criar Conta' : 
               mode === 'forgot' ? 'Enviar Link' : 
               mode === 'verify' ? 'Validar Conta' : 'Alterar Senha'}
            </button>
          </form>

          <div className="text-center pt-2">
            {mode === 'login' ? (
              <div className="space-y-4">
                <button onClick={() => setMode('forgot')} className="text-[11px] font-bold text-black/40 hover:text-black transition-colors uppercase tracking-wider">Esqueceu a senha?</button>
                {!isInitialized && (
                  <div className="pt-6 border-t border-black/5">
                    <p className="text-[11px] text-black/30 uppercase tracking-wider mb-2">Primeiro acesso?</p>
                    <button onClick={() => setMode('signup')} className="text-xs font-black text-black hover:underline uppercase tracking-widest">Criar conta admin</button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setMode('login')} className="text-xs font-black text-black hover:underline uppercase tracking-widest">Voltar para o login</button>
            )}
          </div>

          {publicCompanyInfo && (
            <div className="pt-8 border-t border-black/5 text-center">
              <p className="text-[10px] font-black text-black/60 uppercase tracking-[0.2em] mb-1">{publicCompanyInfo.name}</p>
              <p className="text-[9px] text-black/30 font-medium uppercase tracking-wider">
                {publicCompanyInfo.city} • {publicCompanyInfo.state}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
function TabDetailsModal({ tab, products, onClose, calculateTotal, calculateTabPaidAmount, calculateTabGameFeeTotal, calculateTabDiscountAmount, calculateTabNetTotal, calculateTabFinalBalance, onDeleteTab }: { 
  tab: Tab; 
  products: Product[]; 
  onClose: () => void; 
  calculateTotal: (tab: Tab) => number;
  calculateTabPaidAmount: (tab: Tab) => number;
  calculateTabGameFeeTotal: (tab: Tab) => number;
  calculateTabDiscountAmount: (tab: Tab) => number;
  calculateTabNetTotal: (tab: Tab) => number;
  calculateTabFinalBalance: (tab: Tab) => number;
  onDeleteTab?: () => void;
}) {
  const subtotal = calculateTotal(tab);
  const paidAmount = calculateTabPaidAmount(tab);
  const discountAmount = calculateTabDiscountAmount(tab);
  const netTotal = calculateTabNetTotal(tab);
  const finalBalance = calculateTabFinalBalance(tab);

  return (
    <Modal title="Detalhes da Comanda" onClose={onClose}>
      <div className="space-y-6">
        <div className="border-b border-black/5 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-black/40 uppercase font-bold tracking-wider mb-1">Cliente</p>
              <h4 className="text-xl font-bold">{tab.customerName}</h4>
              {tab.status === 'deleted' && (
                <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Comanda Excluída</p>
                  <p className="text-xs text-red-500 italic">Motivo: {tab.deletionReason}</p>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-black/40 uppercase font-bold tracking-wider mb-1">Pagamento</p>
              <div className="flex flex-wrap gap-1 justify-end">
                {Array.from(new Set([
                  ...(tab.payments || []).map(p => p.method),
                  ...(tab.paymentMethod ? [tab.paymentMethod] : [])
                ])).length > 0 ? (
                  Array.from(new Set([
                    ...(tab.payments || []).map(p => p.method),
                    ...(tab.paymentMethod ? [tab.paymentMethod] : [])
                  ])).map(method => (
                    <span key={method} className="bg-black text-white px-2 py-1 rounded-lg text-[10px] font-bold">{method}</span>
                  ))
                ) : (
                  <span className="bg-black/5 text-black/40 px-2 py-1 rounded-lg text-[10px] font-bold">N/A</span>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-black/40 mt-2">
            {tab.status === 'deleted' 
              ? `Excluída em ${new Date(tab.deletedAt!).toLocaleDateString()} às ${new Date(tab.deletedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : `Fechada em ${new Date(tab.closedAt!).toLocaleDateString()} às ${new Date(tab.closedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            }
          </p>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {tab.items.map((item, idx) => {
            const product = products.find(p => p.id === item.productId);
            const price = item.price !== undefined && item.price !== null ? item.price : (product?.price || 0);
            return (
              <div key={`${item.productId}-${idx}`} className="flex justify-between items-start text-sm">
                <div className="flex-1">
                  <p className="font-bold">{product?.name}</p>
                  <p className="text-xs text-black/40">{(item.quantity || 0)}x R$ {(price || 0).toFixed(2)}</p>
                  {item.payerName && (
                    <p className="text-[10px] text-emerald-600 italic font-medium">
                      Pagos por: {item.payerName}
                    </p>
                  )}
                </div>
                <p className="font-mono font-bold">R$ {((price || 0) * (item.quantity || 0)).toFixed(2)}</p>
              </div>
            );
          })}
        </div>

        {(tab.payments || []).length > 0 && (
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Detalhamento dos Pagamentos</p>
            <div className="space-y-1.5">
              {(tab.payments || []).map(p => (
                <div key={p.id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700">{p.method}</span>
                    <span className="text-black/40">{new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {p.payerName && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                        Pagador: {p.payerName}
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-emerald-700">R$ {p.amount.toFixed(2)}</span>
                </div>
              ))}
              {tab.paymentMethod && (
                <div className="flex justify-between items-center text-xs pt-1 border-t border-emerald-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700">{tab.paymentMethod} (Saldo Final)</span>
                    <span className="text-black/40">{new Date(tab.closedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                      Pagador: {tab.finalPayerName || tab.customerName}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700">
                    R$ {finalBalance.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-black/5">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center text-sm opacity-60">
              <p>Subtotal</p>
              <p>R$ {subtotal.toFixed(2)}</p>
            </div>
            {(tab.discountPercentage || 0) > 0 && (
              <div className="flex justify-between items-center text-sm text-red-500">
                <p>Desconto ({tab.discountPercentage}% sobre o saldo devedor)</p>
                <p>- R$ {discountAmount.toFixed(2)}</p>
              </div>
            )}
          </div>
          <div className="flex justify-between items-end">
            <p className="text-xs text-black/40 uppercase font-bold tracking-wider">Total Recebido</p>
            <p className="text-3xl font-bold tracking-tighter">R$ {netTotal.toFixed(2)}</p>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button 
              onClick={onClose}
              className="flex-1 bg-black text-white py-3.5 rounded-2xl font-bold hover:bg-black/80 transition-all shadow-lg shadow-black/10"
            >
              Fechar
            </button>
            {tab.status !== 'deleted' && onDeleteTab && (
              <button 
                onClick={() => {
                  onClose();
                  onDeleteTab();
                }}
                className="flex-1 bg-red-50 text-red-600 py-3.5 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2 border border-red-100"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function CheckoutModal({ tab, products, onClose, onConfirm, calculateTotal, calculateTabPaidAmount, calculateTabGameFeeTotal, calculateTabDiscountAmount, calculateTabNetTotal, calculateTabFinalBalance, discountPercentage = 0 }: { 
  tab: Tab; 
  products: Product[]; 
  onClose: () => void; 
  onConfirm: (method: Tab['paymentMethod'], finalPayerName: string) => void;
  calculateTotal: (tab: Tab) => number;
  calculateTabPaidAmount: (tab: Tab) => number;
  calculateTabGameFeeTotal: (tab: Tab) => number;
  calculateTabDiscountAmount: (tab: Tab) => number;
  calculateTabNetTotal: (tab: Tab) => number;
  calculateTabFinalBalance: (tab: Tab) => number;
  discountPercentage?: number;
}) {
  const [paymentMethod, setPaymentMethod] = useState<Tab['paymentMethod']>('Dinheiro');
  const [finalPayerName, setFinalPayerName] = useState(tab.customerName);
  
  const subtotal = calculateTotal(tab);
  const paidAmount = calculateTabPaidAmount(tab);
  const discountAmount = calculateTabDiscountAmount({ ...tab, discountPercentage });
  const finalBalance = calculateTabFinalBalance({ ...tab, discountPercentage });

  const hasUnidentifiedGameFee = tab.items.some(item => {
    const isGameFee = item.productId === 'prod_game_fee' || 
                      products.find(p => p.id === item.productId)?.name.toLowerCase().includes('taxa de jogo');
    return isGameFee && 
           (!item.payerName || item.payerName.trim() === '') && 
           (!item.payerDetails || item.payerDetails.length === 0);
  });

  return (
    <Modal title="Extrato da Comanda" onClose={onClose}>
      <div className="space-y-6">
        {hasUnidentifiedGameFee && (
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">Atenção: Identificação Pendente</p>
              <p className="text-xs text-red-600">Existem itens de Taxa de Jogo sem pagador identificado. Identifique-os antes de fechar a conta.</p>
            </div>
          </div>
        )}
        <div className="border-b border-black/5 pb-4">
          <p className="text-xs text-black/40 uppercase font-bold tracking-wider mb-1">Cliente</p>
          <h4 className="text-xl font-bold">{tab.customerName}</h4>
        </div>

        <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
          {tab.items.map((item, idx) => {
            const product = products.find(p => p.id === item.productId);
            const price = item.price !== undefined && item.price !== null ? item.price : (product?.price || 0);
            return (
              <div key={`${item.productId}-${idx}`} className="flex justify-between items-start text-sm">
                <div className="flex-1">
                  <p className="font-bold">{product?.name}</p>
                  <p className="text-xs text-black/40">
                    {(item.quantity || 0)}x R$ {(price || 0).toFixed(2)}
                    {(item.paidQuantity || 0) > 0 && <span className="ml-2 text-emerald-600 font-bold">({item.paidQuantity} pagos)</span>}
                  </p>
                  {item.payerName && (
                    <p className="text-[10px] text-emerald-600 italic font-medium">
                      Pagos por: {item.payerName}
                    </p>
                  )}
                </div>
                <p className="font-mono font-bold">R$ {((price || 0) * (item.quantity || 0)).toFixed(2)}</p>
              </div>
            );
          })}
        </div>

        {(tab.payments || []).length > 0 && (
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Pagamentos Parciais Já Realizados</p>
            <div className="space-y-1">
              {(tab.payments || []).map(p => (
                <div key={p.id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-bold">{p.method}</span>
                    {p.payerName && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                        {p.payerName}
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-emerald-700">R$ {p.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs text-black/40 uppercase font-bold tracking-wider">Forma de Pagamento do Saldo</p>
          <div className="grid grid-cols-2 gap-2">
            {(['Dinheiro', 'PIX', 'Débito', 'Crédito'] as const).map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-2 px-4 rounded-xl text-sm font-bold transition-all border ${paymentMethod === method ? 'bg-black text-white border-black' : 'bg-black/5 border-transparent hover:bg-black/10'}`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-black/40 uppercase font-bold tracking-wider">Nome do Pagador (Saldo Final)</p>
          <input
            type="text"
            value={finalPayerName}
            onChange={(e) => setFinalPayerName(e.target.value)}
            placeholder="Nome de quem está pagando"
            className="w-full bg-black/5 border-transparent focus:bg-white focus:border-black rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none"
          />
        </div>

        <div className="pt-4 border-t border-black/5 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm opacity-60">
              <p>Subtotal</p>
              <p>R$ {subtotal.toFixed(2)}</p>
            </div>
            {discountPercentage > 0 && (
              <div className="flex justify-between items-center text-sm text-red-500">
                <p>Desconto ({discountPercentage}% sobre o saldo devedor)</p>
                <p>- R$ {discountAmount.toFixed(2)}</p>
              </div>
            )}
            {paidAmount > 0 && (
              <div className="flex justify-between items-center text-sm text-emerald-600">
                <p>Total Já Pago</p>
                <p>- R$ {paidAmount.toFixed(2)}</p>
              </div>
            )}
            <div className="flex justify-between items-end pt-2 border-t border-black/5">
              <div>
                <p className="text-xs text-black/40 uppercase font-bold tracking-wider mb-1">Saldo Final a Pagar</p>
                <p className="text-3xl font-bold tracking-tighter">R$ {finalBalance.toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl font-bold text-black/40 hover:bg-black/5 transition-all"
                >
                  Voltar
                </button>
                <button 
                  onClick={() => {
                    if (hasUnidentifiedGameFee) {
                      alert("Por favor, identifique os pagadores de todas as taxas de jogo no Relatório de Taxas de Jogo antes de fechar a conta.");
                      return;
                    }
                    onConfirm(paymentMethod, finalPayerName);
                  }}
                  className={`bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-black/80 transition-all shadow-lg shadow-black/20 ${hasUnidentifiedGameFee ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Confirmar e Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('fecho_token'));
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // App State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeView, setActiveView] = useState<'tabs' | 'products' | 'history' | 'categories' | 'cashier' | 'game-fees' | 'users'>('tabs');
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [tabsSearch, setTabsSearch] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmDeleteTabId, setConfirmDeleteTabId] = useState<string | null>(null);
  const [isOpeningTab, setIsOpeningTab] = useState(false);
  const [checkoutTab, setCheckoutTab] = useState<Tab | null>(null);
  const [checkoutDiscount, setCheckoutDiscount] = useState(0);
  const [viewingTab, setViewingTab] = useState<Tab | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cashierFilterDate, setCashierFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const fetchData = async () => {
    if (!token) return;
    try {
      const [cats, prods, tbs, comp] = await Promise.all([
        fetch('/api/categories', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/tabs', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/company', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
      ]);
      setCategories(cats.length ? cats : DEFAULT_CATEGORIES);
      setProducts(prods);
      setTabs(tbs);
      setCompanyInfo(comp);
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  // Load data
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setIsAuthLoading(false);
        return;
      }

      try {
        // In a real app, you'd have a /api/auth/me endpoint
        // For now, we'll just parse the token or assume it's valid if we can fetch data
        const res = await fetch('/api/categories', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const savedUser = localStorage.getItem('fecho_user');
          if (savedUser) setUser(JSON.parse(savedUser));
          
          // Fetch initial data
          await fetchData();
        } else {
          handleLogout();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  const handleLogin = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('fecho_token', newToken);
    localStorage.setItem('fecho_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('fecho_token');
    localStorage.removeItem('fecho_user');
  };

  // Save data to API
  const syncCategories = async (newCats: Category[]) => {
    setCategories(newCats);
    for (const cat of newCats) {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cat)
      });
    }
  };

  const syncProducts = async (newProds: Product[]) => {
    setProducts(newProds);
    // In a real app, you'd have a bulk update or individual updates
    // For simplicity, we'll just send the one that changed if we had that info
    // But here we'll just assume the handlers call the API
  };

  const syncTabs = async (tab: Tab) => {
    console.log('[SYNC] Syncing tab to server:', tab.customerName, tab.id);
    try {
      const res = await fetch('/api/tabs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tab)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('[SYNC] Failed to sync tab:', data);
      } else {
        console.log('[SYNC] Tab synced successfully');
      }
    } catch (e) {
      console.error('[SYNC] Network error during tab sync:', e);
    }
  };

  // Handlers
  const addProduct = async (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: window.crypto.randomUUID() };
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        setProducts([...products, newProduct]);
        setIsAddingProduct(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao adicionar produto. Verifique se a categoria existe.');
      }
    } catch (e) {
      alert('Erro de conexão ao adicionar produto.');
    }
  };

  const updateProduct = async (product: Product) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(product)
      });
      if (res.ok) {
        setProducts(products.map(p => p.id === product.id ? product : p));
        setEditingProduct(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao atualizar produto.');
      }
    } catch (e) {
      alert('Erro de conexão ao atualizar produto.');
    }
  };

  const deleteProduct = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Produto',
      message: 'Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setProducts(products.filter(p => p.id !== id));
          } else {
            const data = await res.json();
            alert(data.error || 'Erro ao excluir produto.');
          }
        } catch (e) {
          alert('Erro de conexão ao excluir produto.');
        }
      }
    });
  };

  const addCategory = async (name: string, icon: string) => {
    const newCategory = { id: window.crypto.randomUUID(), name, icon };
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCategory)
      });
      if (res.ok) {
        setCategories([...categories, newCategory]);
        setIsAddingCategory(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao adicionar categoria.');
      }
    } catch (e) {
      alert('Erro de conexão ao adicionar categoria.');
    }
  };

  const updateCategory = async (category: Category) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(category)
      });
      if (res.ok) {
        setCategories(categories.map(c => c.id === category.id ? category : c));
        setEditingCategory(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao atualizar categoria.');
      }
    } catch (e) {
      alert('Erro de conexão ao atualizar categoria.');
    }
  };

  const deleteCategory = (id: string) => {
    const productsInCategory = products.filter(p => p.categoryId === id);
    if (productsInCategory.length > 0) {
      alert(`Não é possível excluir a categoria. Ela contém ${productsInCategory.length} produtos. Mova ou exclua-os primeiro.`);
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Categoria',
      message: 'Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setCategories(categories.filter(c => c.id !== id));
          } else {
            const data = await res.json();
            alert(data.error || 'Erro ao excluir categoria.');
          }
        } catch (e) {
          alert('Erro de conexão ao excluir categoria.');
        }
      }
    });
  };

  const openTab = async (customerName: string, groupTime: string, service?: string, isAvulso: boolean = false) => {
    console.log('Abrindo nova comanda para:', customerName);
    const newTab: Tab = {
      id: window.crypto.randomUUID(),
      customerName,
      groupTime: isAvulso ? 'Avulso' : groupTime,
      service,
      isAvulso,
      items: [],
      openedAt: Date.now(),
      status: 'open',
    };
    
    try {
      const res = await fetch('/api/tabs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTab)
      });
      
      if (res.ok) {
        console.log('Comanda aberta com sucesso no servidor');
        setTabs([...tabs, newTab]);
        setIsOpeningTab(false);
        setSelectedTabId(newTab.id);
      } else {
        const data = await res.json();
        console.error('Erro ao abrir comanda:', data);
        alert(data.error || 'Erro ao abrir comanda no servidor.');
      }
    } catch (e) {
      console.error('Erro de rede ao abrir comanda:', e);
      alert('Erro de conexão ao tentar abrir comanda.');
    }
  };

  const deleteTab = async (tabId: string, reason: string) => {
    if (!reason.trim()) {
      alert('O motivo da exclusão é obrigatório.');
      return;
    }

    console.log('[TABS] Attempting to soft delete tab:', tabId, 'Reason:', reason);
    
    try {
      const res = await fetch(`/api/tabs/${tabId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        console.log('[TABS] Tab soft deleted successfully:', tabId);
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, status: 'deleted' as const, deletionReason: reason, deletedAt: Date.now() } : t));
        setSelectedTabId(null);
        setConfirmDeleteTabId(null);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('[TABS] Failed to delete tab:', err);
        alert(err.error || 'Erro ao excluir comanda.');
      }
    } catch (e) {
      console.error('[TABS] Network error during tab deletion:', e);
      alert('Erro de conexão ao excluir comanda.');
    }
  };

  const updateItemPrice = async (tabId: string, productId: string, oldPrice: number | undefined | null, newPrice: number) => {
    console.log('[TABS] Updating item price:', { tabId, productId, oldPrice, newPrice });
    
    let tabToSync: Tab | null = null;
    
    setTabs(prevTabs => {
      const currentTab = prevTabs.find(t => t.id === tabId);
      if (!currentTab) return prevTabs;

      const itemIndex = currentTab.items.findIndex(i => 
        i.productId === productId && 
        (i.price === oldPrice || (i.price === null && oldPrice === undefined) || (i.price === undefined && oldPrice === null))
      );
      
      if (itemIndex === -1) {
        console.warn('[TABS] Item not found for price update:', { productId, oldPrice });
        return prevTabs;
      }

      const newItems = [...currentTab.items];
      const oldItem = newItems[itemIndex];
      const qty = oldItem.quantity;
      
      newItems.splice(itemIndex, 1);

      const existingIndex = newItems.findIndex(i => i.productId === productId && i.price === newPrice);
      if (existingIndex > -1) {
        newItems[existingIndex] = { ...newItems[existingIndex], quantity: newItems[existingIndex].quantity + qty };
      } else {
        newItems.push({ productId, quantity: qty, timestamp: Date.now(), price: newPrice });
      }

      tabToSync = { ...currentTab, items: newItems };
      return prevTabs.map(t => t.id === tabId ? tabToSync! : t);
    });

    if (tabToSync) syncTabs(tabToSync);
  };

  const addItemToTab = async (tabId: string, productId: string, customPrice?: number | null, quantity: number = 1) => {
    console.log('[TABS] Adding item to tab:', { tabId, productId, customPrice, quantity });
    
    let tabToSync: Tab | null = null;

    setTabs(prevTabs => {
      const currentTab = prevTabs.find(t => t.id === tabId);
      if (!currentTab) return prevTabs;

      const existingItemIndex = currentTab.items.findIndex(i => 
        i.productId === productId && 
        (i.price === customPrice || (i.price === null && customPrice === undefined) || (i.price === undefined && customPrice === null))
      );

      let newItems;
      if (existingItemIndex > -1) {
        newItems = [...currentTab.items];
        newItems[existingItemIndex] = { 
          ...newItems[existingItemIndex], 
          quantity: newItems[existingItemIndex].quantity + quantity 
        };
      } else {
        newItems = [...currentTab.items, { productId, quantity, timestamp: Date.now(), price: customPrice ?? undefined }];
      }

      tabToSync = { ...currentTab, items: newItems };
      return prevTabs.map(t => t.id === tabId ? tabToSync! : t);
    });

    if (tabToSync) syncTabs(tabToSync);
  };

  const removeItemFromTab = async (tabId: string, productId: string, price?: number | null) => {
    let tabToSync: Tab | null = null;

    setTabs(prevTabs => {
      const currentTab = prevTabs.find(t => t.id === tabId);
      if (!currentTab) return prevTabs;

      const itemIndex = currentTab.items.findIndex(i => 
        i.productId === productId && 
        (i.price === price || (i.price === null && price === undefined) || (i.price === undefined && price === null))
      );

      if (itemIndex === -1) return prevTabs;

      const newItems = [...currentTab.items];
      if (newItems[itemIndex].quantity > 1) {
        newItems[itemIndex] = { ...newItems[itemIndex], quantity: newItems[itemIndex].quantity - 1 };
      } else {
        newItems.splice(itemIndex, 1);
      }

      tabToSync = { ...currentTab, items: newItems };
      return prevTabs.map(t => t.id === tabId ? tabToSync! : t);
    });

    if (tabToSync) syncTabs(tabToSync);
  };

  const deleteItemFromTab = (tabId: string, productId: string, price?: number | null) => {
    const product = products.find(p => p.id === productId);
    setConfirmModal({
      isOpen: true,
      title: 'Remover Item',
      message: `Tem certeza que deseja remover "${product?.name || 'este item'}" desta comanda?`,
      onConfirm: () => {
        let tabToSync: Tab | null = null;
        setTabs(prevTabs => {
          const currentTab = prevTabs.find(t => t.id === tabId);
          if (!currentTab) return prevTabs;

          const newItems = currentTab.items.filter(i => 
            !(i.productId === productId && (i.price === price || (i.price === null && price === undefined) || (i.price === undefined && price === null)))
          );

          tabToSync = { ...currentTab, items: newItems };
          return prevTabs.map(t => t.id === tabId ? tabToSync! : t);
        });

        if (tabToSync) syncTabs(tabToSync);
      }
    });
  };

  const updateTab = async (updatedTab: Tab) => {
    console.log('[TABS] Updating tab:', updatedTab.customerName);
    setTabs(prev => prev.map(t => t.id === updatedTab.id ? updatedTab : t));
    syncTabs(updatedTab);
  };

  const updateTabInfo = async (tabId: string, customerName: string, groupTime: string, items?: TabItem[], service?: string, isAvulso?: boolean) => {
    const updatedTabs = tabs.map(t => {
      if (t.id === tabId) {
        const updatedTab = { 
          ...t, 
          customerName, 
          groupTime: isAvulso ? 'Avulso' : groupTime, 
          items: items || t.items,
          service: service !== undefined ? service : t.service,
          isAvulso: isAvulso !== undefined ? isAvulso : t.isAvulso
        };
        syncTabs(updatedTab);
        return updatedTab;
      }
      return t;
    });
    setTabs(updatedTabs);
  };

  const addPartialPayment = async (tabId: string, amount: number, method: 'Dinheiro' | 'PIX' | 'Débito' | 'Crédito', paidItems: { productId: string; quantity: number; price?: number }[], payerName?: string) => {
    console.log('[TABS] Adding partial payment:', { tabId, amount, method, paidItems, payerName });
    
    try {
      const res = await fetch(`/api/tabs/${tabId}/payments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount, method, timestamp: Date.now(), payerName })
      });

      if (res.ok) {
        setTabs(prevTabs => {
          return prevTabs.map(t => {
            if (t.id === tabId) {
              const newItems = t.items.map(item => {
                const paidItem = paidItems.find(pi => pi.productId === item.productId && pi.price === item.price);
                if (paidItem) {
                  return { ...item, paidQuantity: (item.paidQuantity || 0) + paidItem.quantity };
                }
                return item;
              });
              
              const newPayment: TabPayment = {
                id: window.crypto.randomUUID(),
                amount,
                method,
                timestamp: Date.now(),
                payerName
              };
              
              const updatedTab = { 
                ...t, 
                items: newItems, 
                payments: [...(t.payments || []), newPayment] 
              };
              
              syncTabs(updatedTab);
              return updatedTab;
            }
            return t;
          });
        });
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao registrar pagamento parcial.');
      }
    } catch (e) {
      alert('Erro de conexão ao registrar pagamento parcial.');
    }
  };

  const resetDatabase = async () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
    try {
      const response = await fetch('/api/admin/reset-db', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchData();
        alert('Banco de dados reiniciado com sucesso!');
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao reiniciar banco de dados');
      }
    } catch (error) {
      console.error('Error resetting database:', error);
      alert('Erro ao conectar com o servidor');
    }
  };

  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [priceModalData, setPriceModalData] = useState<{ productId: string, name: string } | null>(null);

  const transferItem = async (sourceTabId: string, destTabId: string, productId: string, quantity: number, price?: number) => {
    let sourceTabToSync: Tab | null = null;
    let destTabToSync: Tab | null = null;

    setTabs(prevTabs => {
      const newTabs = [...prevTabs];
      const sourceTabIndex = newTabs.findIndex(t => t.id === sourceTabId);
      const destTabIndex = newTabs.findIndex(t => t.id === destTabId);

      if (sourceTabIndex !== -1 && destTabIndex !== -1) {
        const sourceTab = { ...newTabs[sourceTabIndex], items: [...newTabs[sourceTabIndex].items] };
        const destTab = { ...newTabs[destTabIndex], items: [...newTabs[destTabIndex].items] };
        
        const itemIndex = sourceTab.items.findIndex(i => i.productId === productId && i.price === price);
        if (itemIndex !== -1) {
          const item = { ...sourceTab.items[itemIndex] };
          const transferQty = Math.min(quantity, item.quantity);
          item.quantity -= transferQty;
          
          if (item.quantity <= 0) {
            sourceTab.items.splice(itemIndex, 1);
          } else {
            sourceTab.items[itemIndex] = item;
          }

          const destItemIndex = destTab.items.findIndex(i => i.productId === productId && i.price === price);
          if (destItemIndex !== -1) {
            const destItem = { ...destTab.items[destItemIndex] };
            destItem.quantity += transferQty;
            destTab.items[destItemIndex] = destItem;
          } else {
            destTab.items.push({ productId, quantity: transferQty, timestamp: Date.now(), price });
          }

          newTabs[sourceTabIndex] = sourceTab;
          newTabs[destTabIndex] = destTab;
          sourceTabToSync = sourceTab;
          destTabToSync = destTab;
        }
      }
      return newTabs;
    });

    // Wait for state to settle slightly or just use the local references
    if (sourceTabToSync && destTabToSync) {
      await Promise.all([
        syncTabs(sourceTabToSync),
        syncTabs(destTabToSync)
      ]);
    }
  };

  const closeTab = async (tabId: string, paymentMethod: Tab['paymentMethod'], finalPayerName: string, discountPercentage: number = 0) => {
    const updatedTab = tabs.find(t => t.id === tabId);
    if (updatedTab) {
      const closedTab = { 
        ...updatedTab, 
        status: 'closed' as const, 
        closedAt: Date.now(), 
        paymentMethod,
        finalPayerName,
        discountPercentage 
      };
      const res = await fetch('/api/tabs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(closedTab)
      });
      if (res.ok) {
        setTabs(tabs.map(t => t.id === tabId ? closedTab : t));
        setSelectedTabId(null);
      }
    }
  };

  // Derived state
  const activeTabs = useMemo(() => tabs.filter(t => t.status === 'open'), [tabs]);
  const closedTabs = useMemo(() => {
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    return tabs.filter(t => (t.status === 'closed' || t.status === 'deleted') && (t.closedAt || t.deletedAt || 0) > ninetyDaysAgo);
  }, [tabs]);
  const filteredCashierTabs = useMemo(() => {
    return closedTabs.filter(t => {
      const date = new Date(t.closedAt || t.deletedAt || 0).toISOString().split('T')[0];
      return date === cashierFilterDate;
    });
  }, [closedTabs, cashierFilterDate]);
  const selectedTab = useMemo(() => tabs.find(t => t.id === selectedTabId), [tabs, selectedTabId]);

  const isGameFeeItem = (item: TabItem) => {
    if (item.productId === 'prod_game_fee') return true;
    const product = products.find(p => p.id === item.productId);
    return product?.name.toLowerCase().includes('taxa de jogo') || false;
  };

  const calculateTabTotal = (tab: Tab) => {
    return (tab.items || []).reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      const price = item.price !== undefined && item.price !== null ? item.price : (product?.price || 0);
      return total + (price || 0) * (item.quantity || 0);
    }, 0);
  };

  const calculateTabGameFeeTotal = (tab: Tab) => {
    return (tab.items || []).reduce((sum, item) => {
      if (isGameFeeItem(item)) {
        const product = products.find(p => p.id === item.productId);
        const price = item.price !== undefined && item.price !== null ? item.price : (product?.price || 0);
        return sum + (price || 0) * (item.quantity || 0);
      }
      return sum;
    }, 0);
  };

  const calculateTabPaidAmount = (tab: Tab) => {
    return (tab.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  const calculateTabPaidGameFeeTotal = (tab: Tab) => {
    return (tab.items || []).reduce((sum, item) => {
      if (isGameFeeItem(item)) {
        const product = products.find(p => p.id === item.productId);
        const price = item.price !== undefined && item.price !== null ? item.price : (product?.price || 0);
        return sum + (price || 0) * (item.paidQuantity || 0);
      }
      return sum;
    }, 0);
  };

  const calculateTabDiscountAmount = (tab: Tab) => {
    const subtotal = calculateTabTotal(tab);
    const paid = calculateTabPaidAmount(tab);
    const totalGameFee = calculateTabGameFeeTotal(tab);
    const paidGameFee = calculateTabPaidGameFeeTotal(tab);
    
    const unpaidGameFee = Math.max(0, totalGameFee - paidGameFee);
    const debt = subtotal - paid;
    
    const discount = tab.discountPercentage || 0;
    const discountableDebt = Math.max(0, debt - unpaidGameFee);
    return discountableDebt * (discount / 100);
  };

  const calculateTabNetTotal = (tab: Tab) => {
    const subtotal = calculateTabTotal(tab);
    const discountAmount = calculateTabDiscountAmount(tab);
    return subtotal - discountAmount;
  };

  const calculateTabFinalBalance = (tab: Tab) => {
    const netTotal = calculateTabNetTotal(tab);
    const paid = calculateTabPaidAmount(tab);
    return Math.max(0, netTotal - paid);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto animate-pulse">
            <Logo className="w-full h-full" />
          </div>
          <p className="text-black/40 font-bold animate-pulse">Carregando Fechô...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-black/5 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-lg font-bold tracking-tight flex items-center gap-2 p-4">
          <Logo className="w-8 h-8" />
          Fechô
        </h1>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-black/5 rounded-xl transition-all"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Users className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar / Navigation */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 768) && (
          <motion.nav 
            initial={window.innerWidth < 768 ? { x: -300 } : false}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={`fixed md:relative z-50 w-64 h-full bg-white border-r border-black/5 flex flex-col transition-all ${isSidebarOpen ? 'left-0' : '-left-64 md:left-0'}`}
          >
            <div className="border-bottom border-black/5 hidden md:block">
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 p-6">
                <Logo className="w-10 h-10" />
                Fechô
              </h1>
              {companyInfo && (
                <div className="mt-2">
                  <p className="text-xs font-bold text-black/60 truncate">{companyInfo.name}</p>
                  <p className="text-[10px] text-black/40 truncate">
                    {companyInfo.street}{companyInfo.number ? `, ${companyInfo.number}` : ''}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex-1 p-4 space-y-2 overflow-y-auto">
              <button 
                onClick={() => { setActiveView('tabs'); setSelectedTabId(null); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === 'tabs' ? 'bg-black text-white shadow-md' : 'hover:bg-black/5'}`}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Comandas Ativas</span>
                <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-xs">{activeTabs.length}</span>
              </button>
              
              {user?.role === 'admin' && (
                <>
                  <button 
                    onClick={() => { setActiveView('products'); setSelectedTabId(null); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === 'products' ? 'bg-black text-white shadow-md' : 'hover:bg-black/5'}`}
                  >
                    <Package className="w-5 h-5" />
                    <span className="font-medium">Cardápio e Produtos</span>
                  </button>

                  <button 
                    onClick={() => { setActiveView('categories'); setSelectedTabId(null); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === 'categories' ? 'bg-black text-white shadow-md' : 'hover:bg-black/5'}`}
                  >
                    <Edit2 className="w-5 h-5" />
                    <span className="font-medium">Categorias</span>
                  </button>
                </>
              )}
              
              <button 
                onClick={() => { setActiveView('history'); setSelectedTabId(null); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === 'history' ? 'bg-black text-white shadow-md' : 'hover:bg-black/5'}`}
              >
                <Clock className="w-5 h-5" />
                <span className="font-medium">Histórico</span>
              </button>

              <button 
                onClick={() => { setActiveView('game-fees'); setSelectedTabId(null); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === 'game-fees' ? 'bg-black text-white shadow-md' : 'hover:bg-black/5'}`}
              >
                <Receipt className="w-5 h-5" />
                <span className="font-medium">Relatório de Taxas</span>
              </button>

              <button 
                onClick={() => { setActiveView('cashier'); setSelectedTabId(null); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === 'cashier' ? 'bg-black text-white shadow-md' : 'hover:bg-black/5'}`}
              >
                <DollarSign className="w-5 h-5" />
                <span className="font-medium">Fechamento de Caixa</span>
              </button>

              {user?.role === 'admin' && (
                <button 
                  onClick={() => { setActiveView('users' as any); setSelectedTabId(null); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === ('users' as any) ? 'bg-black text-white shadow-md' : 'hover:bg-black/5'}`}
                >
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Usuários</span>
                </button>
              )}
            </div>

            <div className="p-4 mt-auto border-t border-black/5 space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 bg-black/5 rounded-full flex items-center justify-center font-bold text-xs">
                  {user?.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{user?.email}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setIsChangingPassword(true)} className="text-[10px] font-bold text-black/40 hover:text-black">Trocar Senha</button>
                    <button onClick={handleLogout} className="text-[10px] font-bold text-red-500 hover:underline">Sair</button>
                  </div>
                </div>
              </div>
              <div className="bg-black/5 rounded-2xl p-4">
                <p className="text-xs text-black/40 uppercase font-bold tracking-wider mb-2">Valor Total Aberto</p>
                <p className="text-2xl font-bold">
                  R$ {activeTabs.reduce((sum, t) => sum + calculateTabTotal(t), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 md:h-20 bg-white border-b border-black/5 flex items-center justify-between px-4 md:px-8 shrink-0">
          <h2 className="text-base md:text-lg font-semibold truncate mr-2">
            {selectedTabId ? 'Detalhes da Comanda' : 
             activeView === 'tabs' ? 'Comandas Ativas' : 
             activeView === 'products' ? 'Gerenciamento de Produtos' : 
             activeView === 'categories' ? 'Gerenciamento de Categorias' : 
             activeView === 'cashier' ? 'Fechamento de Caixa' : 
             activeView === ('users' as any) ? 'Gerenciamento de Usuários' :
             'Histórico de Fechamento'}
          </h2>
          
          <div className="flex items-center gap-2 md:gap-4">
            {activeView === 'tabs' && !selectedTabId && (
              <div className="relative w-40 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
                <input 
                  type="text" 
                  placeholder="Buscar comanda..."
                  value={tabsSearch}
                  onChange={(e) => setTabsSearch(e.target.value)}
                  className="w-full bg-black/5 border-none rounded-xl pl-9 pr-4 py-2 focus:ring-2 focus:ring-black outline-none transition-all text-sm"
                />
              </div>
            )}
            {activeView === 'tabs' && !selectedTabId && (
              <button 
                onClick={() => setIsOpeningTab(true)}
                className="bg-black text-white px-3 md:px-6 py-2 md:py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-black/80 transition-all shadow-sm text-sm md:text-base"
              >
                <Plus className="w-4 h-4 md:w-5 h-5" />
                <span className="hidden sm:inline">Abrir Nova Comanda</span>
                <span className="sm:hidden">Abrir</span>
              </button>
            )}
            {activeView === 'products' && (
              <button 
                onClick={() => setIsAddingProduct(true)}
                className="bg-black text-white px-3 md:px-6 py-2 md:py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-black/80 transition-all shadow-sm text-sm md:text-base"
              >
                <Plus className="w-4 h-4 md:w-5 h-5" />
                <span className="hidden sm:inline">Adicionar Produto</span>
                <span className="sm:hidden">Produto</span>
              </button>
            )}
            {activeView === 'categories' && (
              <button 
                onClick={() => setIsAddingCategory(true)}
                className="bg-black text-white px-3 md:px-6 py-2 md:py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-black/80 transition-all shadow-sm text-sm md:text-base"
              >
                <Plus className="w-4 h-4 md:w-5 h-5" />
                <span className="hidden sm:inline">Adicionar Categoria</span>
                <span className="sm:hidden">Categoria</span>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            {selectedTabId && selectedTab ? (
              <TabDetailView 
                tab={selectedTab} 
                products={products}
                categories={categories}
                otherTabs={activeTabs.filter(t => t.id !== selectedTabId)}
                onBack={() => setSelectedTabId(null)}
                onAddItem={(pid, price, qty) => addItemToTab(selectedTabId, pid, price, qty)}
                onRemoveItem={(pid, price) => removeItemFromTab(selectedTabId, pid, price)}
                onDeleteItem={(pid, price) => deleteItemFromTab(selectedTabId, pid, price)}
                onUpdateItemPrice={(pid, oldPrice, newPrice) => updateItemPrice(selectedTabId, pid, oldPrice, newPrice)}
                onDeleteTab={() => setConfirmDeleteTabId(selectedTabId)}
                onTransferItem={(destId, pid, qty, price) => transferItem(selectedTabId, destId, pid, qty, price)}
                onCheckout={(discount) => {
                  setCheckoutDiscount(discount);
                  setCheckoutTab(selectedTab);
                }}
                calculateTotal={() => calculateTabTotal(selectedTab)}
                onUpdateTabInfo={(name, group, items, service, isAvulso) => updateTabInfo(selectedTabId, name, group, items, service, isAvulso)}
                onAddPartialPayment={(amount, method, items, payerName) => addPartialPayment(selectedTabId, amount, method, items, payerName)}
              />
            ) : activeView === 'tabs' ? (
              <motion.div 
                key="tabs-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {activeTabs.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-black/40">
                    <Users className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Nenhuma comanda ativa</p>
                    <p className="text-sm">Clique em "Abrir Nova Comanda" para começar</p>
                  </div>
                ) : (
                  activeTabs
                    .filter(tab => {
                      const searchLower = tabsSearch.toLowerCase();
                      return tab.customerName.toLowerCase().includes(searchLower) || 
                             tab.groupTime.toLowerCase().includes(searchLower);
                    })
                    .map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTabId(tab.id)}
                      className="bg-white p-6 rounded-2xl border border-black/5 hover:border-black/20 text-left transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{tab.customerName}</h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <p className="text-xs text-black/40 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Aberta às {new Date(tab.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs text-black/40 flex items-center gap-1 bg-black/5 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              {tab.isAvulso ? 'Cliente Avulso' : `Grupo: ${tab.groupTime}`}
                            </p>
                            {tab.service && tab.service !== 'Cliente Avulso' && (
                              <p className="text-xs text-black/40 flex items-center gap-1 bg-black/5 px-2 py-0.5 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-black/20" />
                                {tab.service}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="bg-black/5 p-2 rounded-xl group-hover:bg-black group-hover:text-white transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-black/40 uppercase font-bold tracking-wider">Itens</p>
                          <p className="text-xl font-bold">{tab.items.reduce((sum, i) => sum + i.quantity, 0)}</p>
                        </div>
                        <div className="text-right">
                          {(tab.payments || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-end mb-1">
                              {Array.from(new Set((tab.payments || []).map(p => p.method))).map(method => (
                                <span key={method} className="text-[8px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100">
                                  {method}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-black/40 uppercase font-bold tracking-wider">Total</p>
                          <p className="text-2xl font-bold">R$ {calculateTabTotal(tab).toFixed(2)}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </motion.div>
            ) : activeView === 'products' ? (
              <motion.div 
                key="products-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="bg-white rounded-2xl border border-black/5 overflow-x-auto shadow-sm">
                  <table className="w-full text-left min-w-[600px]">
                    <thead>
                      <tr className="border-b border-black/5 bg-black/5">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Produto</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Categoria</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Preço</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {sortedProducts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-black/40">
                            Nenhum produto cadastrado ainda.
                          </td>
                        </tr>
                      ) : (
                        sortedProducts.map(product => {
                          const category = categories.find(c => c.id === product.categoryId);
                          return (
                            <tr key={product.id} className="hover:bg-black/[0.02] transition-all">
                              <td className="px-6 py-4 font-bold">{product.name}</td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 text-xs font-medium">
                                  {getCategoryIcon(category?.icon || 'Package')}
                                  {category?.name || 'Sem categoria'}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-mono font-medium">R$ {product.price.toFixed(2)}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  {user?.role === 'admin' && (
                                    <>
                                      <button 
                                        onClick={() => setEditingProduct(product)}
                                        className="p-2 hover:bg-black/5 rounded-lg transition-all"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => deleteProduct(product.id)}
                                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-all"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : activeView === 'categories' ? (
              <motion.div 
                key="categories-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="bg-white rounded-2xl border border-black/5 overflow-x-auto shadow-sm">
                  <table className="w-full text-left min-w-[500px]">
                    <thead>
                      <tr className="border-b border-black/5 bg-black/5">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Nome da Categoria</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Produtos</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {sortedCategories.map(category => (
                        <tr key={category.id} className="hover:bg-black/[0.02] transition-all">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-black/5 p-2 rounded-lg">
                                {getCategoryIcon(category.icon)}
                              </div>
                              <span className="font-bold">{category.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-black/40">
                              {products.filter(p => p.categoryId === category.id).length} itens
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {user?.role === 'admin' && (
                                <>
                                  <button 
                                    onClick={() => setEditingCategory(category)}
                                    className="p-2 hover:bg-black/5 rounded-lg transition-all"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => deleteCategory(category.id)}
                                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : activeView === 'game-fees' ? (
              <GameFeeView tabs={tabs} products={products} onUpdateTab={syncTabs} />
            ) : activeView === 'cashier' ? (
              <motion.div 
                key="cashier-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Fechamento de Caixa</h2>
                    <p className="text-black/40">Resumo financeiro das comandas finalizadas.</p>
                  </div>
                  <div className="w-full md:w-auto">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-black/40 mb-1">Data do Fechamento</p>
                    <input 
                      type="date" 
                      value={cashierFilterDate}
                      onChange={(e) => setCashierFilterDate(e.target.value)}
                      className="w-full bg-black/5 border-none rounded-xl px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                    <p className="text-xs text-black/40 uppercase font-bold tracking-wider mb-2">Total de Vendas (Líquido)</p>
                    <p className="text-3xl font-bold">R$ {filteredCashierTabs.filter(t => t.status === 'closed').reduce((sum, t) => sum + calculateTabNetTotal(t), 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                    <p className="text-xs text-black/40 uppercase font-bold tracking-wider mb-2">Total de Descontos</p>
                    <p className="text-3xl font-bold text-red-500">R$ {filteredCashierTabs.filter(t => t.status === 'closed').reduce((sum, t) => sum + calculateTabDiscountAmount(t), 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                    <p className="text-xs text-black/40 uppercase font-bold tracking-wider mb-2">Comandas Finalizadas</p>
                    <p className="text-3xl font-bold">{filteredCashierTabs.filter(t => t.status === 'closed').length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                    <p className="text-xs text-black/40 uppercase font-bold tracking-wider mb-2">Comandas Excluídas</p>
                    <p className="text-3xl font-bold text-black/20">{filteredCashierTabs.filter(t => t.status === 'deleted').length}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                  <h3 className="font-bold mb-4">Resumo Geral de Receita (Valores Líquidos)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-black/5 rounded-2xl">
                      <p className="text-xs text-black/40 uppercase font-bold tracking-wider mb-1">Total Taxa de Jogo</p>
                      <p className="text-2xl font-bold">R$ {
                        filteredCashierTabs.filter(t => t.status === 'closed').reduce((sum, t) => sum + calculateTabGameFeeTotal(t), 0).toFixed(2)
                      }</p>
                    </div>
                    <div className="p-4 bg-black/5 rounded-2xl">
                      <p className="text-xs text-black/40 uppercase font-bold tracking-wider mb-1">Total Consumo (Outros Itens)</p>
                      <p className="text-2xl font-bold">R$ {
                        filteredCashierTabs.filter(t => t.status === 'closed').reduce((sum, t) => {
                          const subtotal = calculateTabTotal(t);
                          const gameFeeTotal = calculateTabGameFeeTotal(t);
                          const discountAmount = calculateTabDiscountAmount(t);
                          const consumptionTotal = subtotal - gameFeeTotal;
                          return sum + (consumptionTotal - discountAmount);
                        }, 0).toFixed(2)
                      }</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                      <p className="text-xs text-red-600 uppercase font-bold tracking-wider mb-1">Total Descontos</p>
                      <p className="text-2xl font-bold text-red-600">R$ {
                        filteredCashierTabs.filter(t => t.status === 'closed').reduce((sum, t) => sum + calculateTabDiscountAmount(t), 0).toFixed(2)
                      }</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-black/5 bg-black/5">
                      <h3 className="font-bold">Resumo por Forma de Pagamento</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[300px]">
                        <thead>
                          <tr className="border-b border-black/5">
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Forma</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                          {['Dinheiro', 'PIX', 'Débito', 'Crédito'].map(method => {
                            const closedOnly = filteredCashierTabs.filter(t => t.status === 'closed');
                            
                            // Aggregate all partial payments + final payments for this method
                            const partialTotal = closedOnly.reduce((sum, t) => {
                              return sum + (t.payments || [])
                                .filter(p => p.method === method)
                                .reduce((pSum, p) => pSum + p.amount, 0);
                            }, 0);

                            const finalTotal = closedOnly
                              .filter(t => t.paymentMethod === method)
                              .reduce((sum, t) => sum + calculateTabFinalBalance(t), 0);

                            const total = partialTotal + finalTotal;
                            
                            return (
                              <tr key={method}>
                                <td className="px-6 py-4 font-bold">{method}</td>
                                <td className="px-6 py-4 text-right font-mono font-bold">R$ {total.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-black/5 bg-black/5">
                      <h3 className="font-bold">Resumo por Categoria (Valores Líquidos)</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[300px]">
                        <thead>
                          <tr className="border-b border-black/5">
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Categoria</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                          {sortedCategories.map(cat => {
                            const total = filteredCashierTabs.filter(t => t.status === 'closed').reduce((sum, t) => {
                              const subtotal = calculateTabTotal(t);
                              const gameFeeTotal = calculateTabGameFeeTotal(t);
                              const discountAmount = calculateTabDiscountAmount(t);
                              
                              const nonGameFeeSubtotal = subtotal - gameFeeTotal;
                              const effectiveDiscountFactor = nonGameFeeSubtotal > 0 ? (nonGameFeeSubtotal - discountAmount) / nonGameFeeSubtotal : 1;

                              const catNetTotal = t.items.reduce((itemSum, item) => {
                                const product = products.find(p => p.id === item.productId);
                                if (product?.categoryId === cat.id) {
                                  const price = item.price !== undefined && item.price !== null ? item.price : (product?.price || 0);
                                  const grossValue = price * item.quantity;
                                  
                                  // Discount only applies to non-game-fee items (prod_game_fee)
                                  if (item.productId === 'prod_game_fee') {
                                    return itemSum + grossValue;
                                  } else {
                                    return itemSum + (grossValue * effectiveDiscountFactor);
                                  }
                                }
                                return itemSum;
                              }, 0);

                              return sum + catNetTotal;
                            }, 0);
                            
                            return (
                              <tr key={cat.id}>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    {getCategoryIcon(cat.icon)}
                                    <span className="font-bold">{cat.name}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-bold">R$ {total.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                  <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm mt-6 md:mt-8">
                    <div className="p-6 border-b border-black/5 bg-black/5">
                      <h3 className="font-bold">Resumo por Serviço (Valores Líquidos)</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[300px]">
                        <thead>
                          <tr className="border-b border-black/5">
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Serviço</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                          {['Futebol Sintético', 'Quadra 1', 'Quadra 2', 'Quadra 3', 'Cliente Avulso'].map(service => {
                            const total = filteredCashierTabs.filter(t => t.status === 'closed' && (t.service === service || (!t.service && service === 'Futebol Sintético'))).reduce((sum, t) => {
                              return sum + calculateTabNetTotal(t);
                            }, 0);
                            
                            return (
                              <tr key={service}>
                                <td className="px-6 py-4 font-bold">{service}</td>
                                <td className="px-6 py-4 text-right font-mono font-bold">R$ {total.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm mt-6 md:mt-8">
                    <div className="p-6 border-b border-black/5 bg-black/5">
                      <h3 className="font-bold">Detalhamento por Serviço e Horário (Valores Líquidos)</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[500px]">
                        <thead>
                          <tr className="border-b border-black/5">
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Serviço</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Horário</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Cliente</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40 text-right">Valor Líquido</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                          {filteredCashierTabs
                            .filter(t => t.status === 'closed')
                            .sort((a, b) => {
                              const serviceA = a.service || 'Futebol Sintético';
                              const serviceB = b.service || 'Futebol Sintético';
                              if (serviceA !== serviceB) return serviceA.localeCompare(serviceB);
                              return a.groupTime.localeCompare(b.groupTime);
                            })
                            .map(t => (
                              <tr key={t.id} className="hover:bg-black/[0.02] transition-colors">
                                <td className="px-6 py-4 font-bold text-xs">{t.service || 'Futebol Sintético'}</td>
                                <td className="px-6 py-4 text-xs font-mono">
                                  {t.isAvulso ? <span className="text-black/40 italic">Avulso</span> : t.groupTime}
                                </td>
                                <td className="px-6 py-4 text-xs">{t.customerName}</td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-xs">R$ {calculateTabNetTotal(t).toFixed(2)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm mt-6 md:mt-8">
                    <div className="p-6 border-b border-black/5 bg-black/5 flex justify-between items-center">
                    <h3 className="font-bold">Detalhamento de Recebimentos (Conferência)</h3>
                    <p className="text-xs text-black/40 font-bold uppercase tracking-widest">Total de Transações: {
                      filteredCashierTabs.filter(t => t.status === 'closed').reduce((count, t) => {
                        const partialCount = (t.payments || []).length;
                        const finalCount = t.paymentMethod ? 1 : 0;
                        return count + partialCount + finalCount;
                      }, 0)
                    }</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead>
                        <tr className="border-b border-black/5">
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Pagador</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Comanda</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Forma</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Tipo</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {filteredCashierTabs
                          .filter(t => t.status === 'closed')
                          .flatMap(t => {
                            const payments = (t.payments || []).map(p => ({
                              payer: p.payerName || 'Não Identificado',
                              customer: t.customerName,
                              method: p.method,
                              amount: p.amount,
                              type: 'Parcial',
                              timestamp: p.timestamp
                            }));
                            
                            const finalBalance = calculateTabFinalBalance(t);

                            if (t.paymentMethod && finalBalance > 0.01) {
                              payments.push({
                                payer: t.finalPayerName || t.customerName,
                                customer: t.customerName,
                                method: t.paymentMethod,
                                amount: finalBalance,
                                type: 'Saldo Final',
                                timestamp: t.closedAt || Date.now()
                              });
                            }
                            return payments;
                          })
                          .sort((a, b) => b.timestamp - a.timestamp)
                          .map((p, idx) => (
                            <tr key={idx} className="hover:bg-black/[0.02] transition-colors">
                              <td className="px-6 py-4 font-bold">{p.payer}</td>
                              <td className="px-6 py-4 text-xs text-black/60">{p.customer}</td>
                              <td className="px-6 py-4">
                                <span className="bg-black text-white px-2 py-1 rounded-lg text-[10px] font-bold">{p.method}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${p.type === 'Parcial' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                  {p.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono font-bold">R$ {p.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : activeView === ('users' as any) ? (
              <UserManagementView 
                token={token!} 
                currentUser={user!} 
                companyInfo={companyInfo}
                onUpdateCompanyInfo={(info) => setCompanyInfo(info)}
                onResetDatabase={() => setConfirmModal({
                  isOpen: true,
                  title: 'Reiniciar Banco de Dados?',
                  message: 'Esta ação apagará TODAS as comandas e histórico. Os usuários e dados da empresa serão mantidos. Deseja continuar?',
                  onConfirm: resetDatabase
                })}
              />
            ) : (
              <HistoryView 
                tabs={closedTabs} 
                products={products}
                calculateTotal={calculateTabTotal} 
                calculateTabPaidAmount={calculateTabPaidAmount}
                calculateTabNetTotal={calculateTabNetTotal}
                calculateTabGameFeeTotal={calculateTabGameFeeTotal}
                calculateTabDiscountAmount={calculateTabDiscountAmount}
                onViewTab={(tab) => setViewingTab(tab)}
                onUpdateTab={updateTab}
                categories={categories}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isChangingPassword && (
          <Modal title="Trocar Senha" onClose={() => setIsChangingPassword(false)}>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const currentPassword = formData.get('currentPassword') as string;
              const newPassword = formData.get('newPassword') as string;
              const confirmPassword = formData.get('confirmPassword') as string;
              
              if (newPassword !== confirmPassword) {
                alert('A nova senha e a confirmação não coincidem.');
                return;
              }

              if (newPassword.length < 6) {
                alert('A nova senha deve ter pelo menos 6 caracteres.');
                return;
              }
              
              try {
                const res = await fetch('/api/auth/change-password', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ currentPassword, newPassword })
                });
                
                const data = await res.json();
                if (res.ok) {
                  alert('Senha alterada com sucesso!');
                  setIsChangingPassword(false);
                } else {
                  alert(data.error || 'Erro ao alterar senha');
                }
              } catch (err) {
                alert('Erro de conexão ao tentar alterar a senha.');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Senha Atual</label>
                <input name="currentPassword" type="password" required className="w-full bg-black/5 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Nova Senha</label>
                <input name="newPassword" type="password" required className="w-full bg-black/5 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Confirmar Nova Senha</label>
                <input name="confirmPassword" type="password" required className="w-full bg-black/5 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black transition-all" />
              </div>
              <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-black/80 transition-all shadow-lg shadow-black/10">Salvar Nova Senha</button>
            </form>
          </Modal>
        )}

        {isOpeningTab && (
          <Modal title="Abrir Nova Comanda" onClose={() => setIsOpeningTab(false)}>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const name = formData.get('customerName') as string;
              const service = formData.get('service') as string;
              const isAvulso = service === 'Cliente Avulso' || formData.get('isAvulso') === 'on';
              const time = isAvulso ? 'Avulso' : formData.get('groupTime') as string;
              if (name && (isAvulso || time)) openTab(name, time, service, isAvulso);
            }} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Nome do Cliente</label>
                  <input 
                    autoFocus
                    name="customerName"
                    type="text" 
                    placeholder="ex: João Silva"
                    className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black outline-none transition-all font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Serviço</label>
                  <select 
                    name="service"
                    className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black outline-none transition-all appearance-none font-bold"
                    required
                    onChange={(e) => {
                      const isAvulso = e.target.value === 'Cliente Avulso';
                      const form = e.target.form as HTMLFormElement;
                      const checkbox = form.elements.namedItem('isAvulso') as HTMLInputElement;
                      const timeInput = form.elements.namedItem('groupTime') as HTMLInputElement;
                      
                      if (isAvulso) {
                        if (checkbox) {
                          checkbox.checked = true;
                        }
                        if (timeInput) {
                          timeInput.disabled = true;
                          timeInput.required = false;
                          timeInput.value = '';
                        }
                      } else {
                        if (checkbox) {
                          checkbox.checked = false;
                        }
                        if (timeInput) {
                          timeInput.disabled = false;
                          timeInput.required = true;
                        }
                      }
                    }}
                  >
                    <option value="Futebol Sintético">Futebol Sintético</option>
                    <option value="Quadra 1">Quadra 1</option>
                    <option value="Quadra 2">Quadra 2</option>
                    <option value="Quadra 3">Quadra 3</option>
                    <option value="Cliente Avulso">Cliente Avulso</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2 py-1">
                  <input 
                    type="checkbox" 
                    name="isAvulso" 
                    id="isAvulso" 
                    className="w-5 h-5 rounded border-black/10 text-black focus:ring-black"
                    onChange={(e) => {
                      const form = e.target.form as HTMLFormElement;
                      const timeInput = form.elements.namedItem('groupTime') as HTMLInputElement;
                      const serviceSelect = form.elements.namedItem('service') as HTMLSelectElement;
                      
                      if (timeInput) {
                        timeInput.disabled = e.target.checked;
                        timeInput.required = !e.target.checked;
                        if (e.target.checked) timeInput.value = '';
                      }
                      
                      if (e.target.checked && serviceSelect) {
                        serviceSelect.value = 'Cliente Avulso';
                      }
                    }}
                  />
                  <label htmlFor="isAvulso" className="text-sm font-bold text-black/60 cursor-pointer">Cliente Avulso (Sem Horário de Grupo)</label>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Horário do Grupo</label>
                  <input 
                    name="groupTime"
                    type="time" 
                    className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black outline-none transition-all disabled:opacity-30 font-bold"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-black/80 transition-all">
                Abrir Comanda
              </button>
            </form>
          </Modal>
        )}

        {(isAddingProduct || editingProduct) && (
          <Modal 
            title={editingProduct ? "Editar Produto" : "Adicionar Novo Produto"} 
            onClose={() => { setIsAddingProduct(false); setEditingProduct(null); }}
          >
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const productData = {
                name: formData.get('name') as string,
                price: parseFloat(formData.get('price') as string),
                categoryId: formData.get('categoryId') as string,
              };
              if (editingProduct) {
                updateProduct({ ...productData, id: editingProduct.id });
              } else {
                addProduct(productData);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Nome do Produto</label>
                <input 
                  autoFocus
                  name="name"
                  defaultValue={editingProduct?.name}
                  type="text" 
                  placeholder="ex: Chopp"
                  className="w-full bg-black/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-black outline-none transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Preço (R$)</label>
                  <input 
                    name="price"
                    defaultValue={editingProduct?.price}
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-black/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-black outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Categoria</label>
                  <select 
                    name="categoryId"
                    defaultValue={editingProduct?.categoryId || sortedCategories[0]?.id}
                    className="w-full bg-black/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-black outline-none transition-all appearance-none"
                  >
                    {sortedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-black/80 transition-all">
                {editingProduct ? 'Salvar Alterações' : 'Adicionar Produto'}
              </button>
            </form>
          </Modal>
        )}

        {(isAddingCategory || editingCategory) && (
          <Modal 
            title={editingCategory ? "Editar Categoria" : "Adicionar Nova Categoria"} 
            onClose={() => { setIsAddingCategory(false); setEditingCategory(null); }}
          >
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const name = formData.get('name') as string;
              const icon = formData.get('icon') as string;
              if (editingCategory) {
                updateCategory({ ...editingCategory, name, icon });
              } else {
                addCategory(name, icon);
              }
            }} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Nome da Categoria</label>
                <input 
                  autoFocus
                  name="name"
                  defaultValue={editingCategory?.name}
                  type="text" 
                  placeholder="ex: Coquetéis"
                  className="w-full bg-black/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-black outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-4">Selecione um Ícone</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {Object.keys(ICON_MAP).map(iconName => {
                    const IconComp = ICON_MAP[iconName];
                    return (
                      <label key={iconName} className="relative cursor-pointer group">
                        <input 
                          type="radio" 
                          name="icon" 
                          value={iconName} 
                          defaultChecked={editingCategory ? editingCategory.icon === iconName : iconName === 'Package'}
                          className="peer sr-only"
                        />
                        <div className="w-full aspect-square bg-black/5 rounded-xl flex items-center justify-center peer-checked:bg-black peer-checked:text-white group-hover:bg-black/10 transition-all">
                          <IconComp className="w-5 h-5" />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-black/80 transition-all">
                {editingCategory ? 'Salvar Alterações' : 'Adicionar Categoria'}
              </button>
            </form>
          </Modal>
        )}

        {checkoutTab && (
          <CheckoutModal 
            tab={checkoutTab}
            products={products}
            discountPercentage={checkoutDiscount}
            onClose={() => setCheckoutTab(null)}
            onConfirm={(method, finalPayerName) => {
              closeTab(checkoutTab.id, method, finalPayerName, checkoutDiscount);
              setCheckoutTab(null);
            }}
            calculateTotal={calculateTabTotal}
            calculateTabPaidAmount={calculateTabPaidAmount}
            calculateTabGameFeeTotal={calculateTabGameFeeTotal}
            calculateTabDiscountAmount={calculateTabDiscountAmount}
            calculateTabNetTotal={calculateTabNetTotal}
            calculateTabFinalBalance={calculateTabFinalBalance}
          />
        )}

        {viewingTab && (
          <TabDetailsModal 
            tab={viewingTab}
            products={products}
            onClose={() => setViewingTab(null)}
            calculateTotal={calculateTabTotal}
            calculateTabPaidAmount={calculateTabPaidAmount}
            calculateTabGameFeeTotal={calculateTabGameFeeTotal}
            calculateTabDiscountAmount={calculateTabDiscountAmount}
            calculateTabNetTotal={calculateTabNetTotal}
            calculateTabFinalBalance={calculateTabFinalBalance}
            onDeleteTab={() => setConfirmDeleteTabId(viewingTab.id)}
          />
        )}

        {/* Price Input Modal */}
        {isPriceModalOpen && priceModalData && (
          <Modal title={`Valor: ${priceModalData.name}`} onClose={() => setIsPriceModalOpen(false)}>
            <div className="space-y-4">
              <p className="text-sm text-black/60">Insira o valor para este item nesta comanda:</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-black/40">R$</span>
                <input 
                  type="number" 
                  step="0.01"
                  autoFocus
                  placeholder="0,00"
                  className="w-full bg-black/5 rounded-xl pl-12 pr-4 py-4 text-xl font-bold outline-none focus:ring-2 focus:ring-black transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseFloat((e.target as HTMLInputElement).value);
                      if (!isNaN(val)) {
                        addItemToTab(selectedTabId!, priceModalData.productId, val);
                        setIsPriceModalOpen(false);
                        setPriceModalData(null);
                      }
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                    const val = parseFloat(input.value);
                    if (!isNaN(val)) {
                      addItemToTab(selectedTabId!, priceModalData.productId, val);
                      setIsPriceModalOpen(false);
                      setPriceModalData(null);
                    }
                  }}
                  className="flex-1 bg-black text-white py-4 rounded-xl font-bold hover:bg-black/80 transition-all"
                >
                  Confirmar
                </button>
                <button 
                  onClick={() => setIsPriceModalOpen(false)}
                  className="px-6 bg-black/5 py-4 rounded-xl font-bold hover:bg-black/10 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
      {/* Global Confirmation Modals */}
      <AnimatePresence>
        {confirmDeleteTabId && (
          <DeleteTabModal 
            onConfirm={(reason) => deleteTab(confirmDeleteTabId, reason)}
            onCancel={() => setConfirmDeleteTabId(null)}
          />
        )}
        {confirmModal.isOpen && (
          <ConfirmationModal 
            isOpen={confirmModal.isOpen}
            title={confirmModal.title}
            message={confirmModal.message}
            onConfirm={confirmModal.onConfirm}
            onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfirmationModal({ isOpen, title, message, onConfirm, onClose }: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-6">
        <p className="text-black/60">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold bg-black/5 hover:bg-black/10 transition-all"
          >
            Não, Cancelar
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
          >
            Sim, Excluir
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteTabModal({ onConfirm, onCancel }: { onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');

  return (
    <Modal title="Excluir Comanda" onClose={onCancel}>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="bg-red-500 text-white p-3 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Excluir Comanda</h3>
            <p className="text-sm text-black/40">Esta ação não pode ser desfeita</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-black/40">Motivo da Exclusão (Obrigatório)</label>
          <textarea 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Erro no lançamento, cliente desistiu, etc..."
            className="w-full bg-black/5 border-none rounded-2xl p-4 min-h-[100px] focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button 
            onClick={onCancel}
            className="py-4 rounded-2xl font-bold text-black/40 hover:bg-black/5 transition-all"
          >
            Não, Cancelar
          </button>
          <button 
            onClick={() => {
              if (!reason.trim()) {
                alert('Por favor, informe o motivo da exclusão.');
                return;
              }
              onConfirm(reason);
            }}
            disabled={!reason.trim()}
            className="bg-red-500 text-white py-4 rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sim, Excluir
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="bg-red-500 text-white p-3 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-sm text-black/40">Confirme sua ação abaixo</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed">{message}</p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button 
            onClick={onCancel}
            className="py-4 rounded-2xl font-bold text-black/40 hover:bg-black/5 transition-all"
          >
            Não, Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className="bg-red-500 text-white py-4 rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
          >
            Sim, Excluir
          </button>
        </div>
      </div>
    </Modal>
  );
}

// --- Sub-components ---

function TabDetailView({ tab, products, categories, otherTabs, onBack, onAddItem, onRemoveItem, onDeleteItem, onUpdateItemPrice, onDeleteTab, onTransferItem, onCheckout, calculateTotal, onUpdateTabInfo, onAddPartialPayment }: {
  tab: Tab;
  products: Product[];
  categories: Category[];
  otherTabs: Tab[];
  onBack: () => void;
  onAddItem: (pid: string, price?: number, quantity?: number) => void;
  onRemoveItem: (pid: string, price?: number) => void;
  onDeleteItem: (pid: string, price?: number) => void;
  onUpdateItemPrice: (pid: string, oldPrice: number | undefined, newPrice: number) => void;
  onDeleteTab: () => void;
  onTransferItem: (destTabId: string, productId: string, quantity: number, price?: number) => void;
  onCheckout: (discount: number) => void;
  calculateTotal: () => number;
  onUpdateTabInfo: (name: string, group: string, items?: TabItem[], service?: string, isAvulso?: boolean) => void;
  onAddPartialPayment: (amount: number, method: 'Dinheiro' | 'PIX' | 'Débito' | 'Crédito', items: { productId: string; quantity: number; price?: number }[], payerName?: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState(tab.customerName);
  const [editGroup, setEditGroup] = useState(tab.groupTime);
  const [editService, setEditService] = useState(tab.service || 'Futebol Sintético');
  const [editIsAvulso, setEditIsAvulso] = useState(tab.isAvulso || false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | 'All'>('All');
  const [transferringItem, setTransferringItem] = useState<{ productId: string; maxQuantity: number; price?: number } | null>(null);
  const [transferQuantity, setTransferQuantity] = useState(1);
  const [editingPriceItem, setEditingPriceItem] = useState<{ productId: string; price: number | undefined | null; currentPrice: number } | null>(null);
  const [newPriceValue, setNewPriceValue] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isPartialPaymentModalOpen, setIsPartialPaymentModalOpen] = useState(false);
  const [isEditingPayer, setIsEditingPayer] = useState<{ productId: string, price: number | undefined | null, details: PayerDetail[], totalAmount: number } | null>(null);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategoryId === 'All' || p.categoryId === activeCategoryId;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, search, activeCategoryId]);

  const groupedItems = useMemo(() => {
    // Group items by productId and price
    const groups: Record<string, TabItem & { product?: Product }> = {};
    
    tab.items.forEach(item => {
      const key = `${item.productId}_${item.price ?? 'default'}`;
      if (!groups[key]) {
        const product = products.find(p => p.id === item.productId);
        groups[key] = { ...item, product };
      } else {
        groups[key].quantity += item.quantity;
      }
    });
    
    return Object.values(groups).sort((a, b) => (a.product?.name || '').localeCompare(b.product?.name || ''));
  }, [tab.items, products]);

  return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col lg:flex-row gap-6 md:gap-8 h-full"
      >
        {/* Left: Menu */}
        <div className="w-full lg:w-[400px] flex flex-col gap-4 md:gap-6 order-2 lg:order-1">
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-black/5 space-y-4">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-black/5 rounded-xl transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
                <input 
                  type="text" 
                  placeholder="Buscar produtos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-black/5 border-none rounded-xl pl-11 pr-4 py-2.5 focus:ring-2 focus:ring-black outline-none transition-all text-sm md:text-base"
                />
              </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button 
                onClick={() => setActiveCategoryId('All')}
                className={`px-4 py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeCategoryId === 'All' ? 'bg-black text-white' : 'bg-black/5 hover:bg-black/10'}`}
              >
                Todos
              </button>
              {sortedCategories.map(c => (
                <button 
                  key={c.id}
                  onClick={() => setActiveCategoryId(c.id)}
                  className={`px-4 py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeCategoryId === c.id ? 'bg-black text-white' : 'bg-black/5 hover:bg-black/10'}`}
                >
                  {getCategoryIcon(c.icon)}
                  {c.name}
                </button>
              ))}
            </div>
          </div>
  
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3 overflow-y-auto pr-1">
            {filteredProducts.map(product => {
              const category = categories.find(c => c.id === product.categoryId);
              
              return (
                <button
                  key={product.id}
                  onClick={() => onAddItem(product.id)}
                  className="bg-white p-3 rounded-xl border border-black/5 hover:border-black/20 text-left transition-all group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="bg-black/5 p-1.5 rounded-lg group-hover:bg-black group-hover:text-white transition-all">
                      {getCategoryIcon(category?.icon || 'Package')}
                    </div>
                    <p className="font-mono font-bold text-xs md:text-sm">
                      R$ {product.price.toFixed(2)}
                    </p>
                  </div>
                  <h4 className="font-bold leading-tight text-xs md:text-sm truncate">{product.name}</h4>
                </button>
              );
            })}
          </div>
        </div>
  
        {/* Right: Current Tab Summary */}
        <div className="flex-1 bg-white rounded-2xl border border-black/5 flex flex-col overflow-hidden shadow-sm order-1 lg:order-2 max-h-[600px] lg:max-h-full">
        <div className="p-6 border-b border-black/5 bg-black text-white">
          <div className="flex justify-between items-start mb-1">
            <div className="flex-1 min-w-0">
              {isEditingInfo ? (
                <div className="space-y-2 mb-2">
                  <input 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-white text-black rounded-lg px-3 py-2 text-lg font-bold outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="Nome do Cliente"
                  />
                  <input 
                    value={editGroup} 
                    onChange={e => setEditGroup(e.target.value)}
                    disabled={editIsAvulso}
                    required={!editIsAvulso}
                    className="w-full bg-white text-black rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-30"
                    placeholder="Grupo/Horário"
                  />
                  <select 
                    value={editService}
                    onChange={e => {
                      const val = e.target.value;
                      setEditService(val);
                      if (val === 'Cliente Avulso') {
                        setEditIsAvulso(true);
                        setEditGroup('');
                      } else {
                        setEditIsAvulso(false);
                      }
                    }}
                    className="w-full bg-white text-black rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-white/50 appearance-none"
                  >
                    <option value="Futebol Sintético">Futebol Sintético</option>
                    <option value="Quadra 1">Quadra 1</option>
                    <option value="Quadra 2">Quadra 2</option>
                    <option value="Quadra 3">Quadra 3</option>
                    <option value="Cliente Avulso">Cliente Avulso</option>
                  </select>
                  <div className="flex items-center gap-2 py-1">
                    <input 
                      type="checkbox" 
                      checked={editIsAvulso} 
                      onChange={e => {
                        setEditIsAvulso(e.target.checked);
                        if (e.target.checked) {
                          setEditGroup('');
                          setEditService('Cliente Avulso');
                        }
                      }}
                      id="editIsAvulso"
                      className="w-4 h-4 rounded border-white/20 bg-white text-black focus:ring-white/30"
                    />
                    <label htmlFor="editIsAvulso" className="text-xs font-bold uppercase text-white cursor-pointer">Cliente Avulso (Sem Horário)</label>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        onUpdateTabInfo(editName, editGroup, undefined, editService, editIsAvulso);
                        setIsEditingInfo(false);
                      }}
                      className="text-[10px] bg-white text-black px-2 py-1 rounded font-bold uppercase"
                    >
                      Salvar
                    </button>
                    <button 
                      onClick={() => {
                        setEditName(tab.customerName);
                        setEditGroup(tab.groupTime);
                        setEditService(tab.service || 'Futebol Sintético');
                        setEditIsAvulso(tab.isAvulso || false);
                        setIsEditingInfo(false);
                      }}
                      className="text-[10px] bg-white/10 text-white px-2 py-1 rounded font-bold uppercase"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group relative">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold truncate">{tab.customerName}</h3>
                    <button 
                      onClick={() => setIsEditingInfo(true)}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all flex items-center gap-1"
                      title="Editar nome ou horário"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span className="text-[8px] font-bold uppercase">Editar</span>
                    </button>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                    {tab.isAvulso ? 'Cliente Avulso' : `Grupo: ${tab.groupTime}`}
                    {tab.service && tab.service !== 'Cliente Avulso' && ` • ${tab.service}`}
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">Comanda Ativa</span>
              {(tab.payments || []).length > 0 && (
                <div className="flex flex-wrap gap-1 justify-end">
                  {Array.from(new Set((tab.payments || []).map(p => p.method))).map(method => (
                    <span key={method} className="bg-emerald-500 text-white px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter shadow-sm">
                      {method}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs opacity-60 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Aberta às {new Date(tab.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {(tab.payments || []).length > 0 && (
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Pagamentos Realizados</p>
              <div className="space-y-1.5">
                {(tab.payments || []).map(p => (
                  <div key={p.id} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700">{p.method}</span>
                      <span className="text-black/40">{new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {p.payerName && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                          Pagador: {p.payerName}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-emerald-700">R$ {p.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {groupedItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-black/20 text-center">
              <Receipt className="w-12 h-12 mb-2 opacity-10" />
              <p className="text-sm font-medium">Nenhum item ainda</p>
              <p className="text-xs">Selecione produtos à esquerda para adicionar</p>
            </div>
          ) : (
            groupedItems.map(item => {
              const currentPrice = item.price !== undefined && item.price !== null ? item.price : (item.product?.price || 0);
              const remainingQuantity = item.quantity - (item.paidQuantity || 0);
              
              return (
                <div key={`${item.productId}-${item.price}`} className="flex flex-col gap-1 group bg-black/5 p-3 rounded-xl hover:bg-black/10 transition-all border border-transparent hover:border-black/5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs md:text-sm truncate text-black/80">{item.product?.name || 'Produto Desconhecido'}</h4>
                        {item.paidQuantity > 0 && (
                          <span className="bg-emerald-100 text-emerald-700 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {item.paidQuantity} Pago(s)
                          </span>
                        )}
                        {item.payerName && (
                          <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 font-bold truncate max-w-[80px]">
                            {item.payerDetails && item.payerDetails.length > 0 ? item.payerDetails.map(d => d.name).join(', ') : item.payerName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] md:text-xs font-mono font-bold text-emerald-600">
                          R$ {currentPrice.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => {
                              setEditingPriceItem({ 
                                productId: item.productId, 
                                price: item.price, 
                                currentPrice 
                              });
                              setNewPriceValue(currentPrice.toString());
                            }}
                            className="p-1 hover:bg-black/5 rounded text-black/40 hover:text-black transition-all flex items-center gap-1"
                            title="Editar valor"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span className="text-[8px] font-bold uppercase">Editar</span>
                          </button>
                          <button 
                            onClick={() => {
                              const itemTotal = currentPrice * item.quantity;
                              const initialDetails = item.payerDetails || (item.payerName ? [{ name: item.payerName, amount: itemTotal }] : []);
                              if (initialDetails.length === 0) {
                                initialDetails.push({ name: '', amount: itemTotal });
                              }
                              setIsEditingPayer({ productId: item.productId, price: item.price, details: initialDetails, totalAmount: itemTotal });
                            }}
                            className="p-1 hover:bg-black/5 rounded text-black/40 hover:text-black transition-all flex items-center gap-1"
                            title="Identificar pagador"
                          >
                            <Users className="w-3 h-3" />
                            <span className="text-[8px] font-bold uppercase">Pagador</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
                      <div className="flex items-center bg-black/5 rounded-xl p-0.5 md:p-1">
                        <button 
                          onClick={() => onRemoveItem(item.productId, item.price)}
                          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all"
                          title="Reduzir quantidade"
                        >
                          <Minus className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        </button>
                        <span className="w-6 md:w-8 text-center font-mono font-bold text-xs md:text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => onAddItem(item.productId, item.price)}
                          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all"
                          title="Aumentar quantidade"
                        >
                          <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        </button>
                      </div>
                      <button 
                        onClick={() => onDeleteItem(item.productId, item.price)}
                        className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-red-50 text-red-500 rounded-xl transition-all"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setTransferringItem({ productId: item.productId, maxQuantity: item.quantity, price: item.price });
                          setTransferQuantity(1);
                        }}
                        className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-black/5 text-black/60 rounded-xl transition-all"
                        title="Transferir item"
                      >
                        <MoveHorizontal className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                      <p className="w-14 md:w-16 text-right font-mono font-bold text-xs md:text-sm">
                        R$ {(currentPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {remainingQuantity > 0 && remainingQuantity < item.quantity && (
                    <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">
                      Saldo em aberto: {remainingQuantity} unidade(s)
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        <AnimatePresence>
          {editingPriceItem && (
            <Modal title="Editar Valor" onClose={() => setEditingPriceItem(null)}>
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <div className="bg-black text-white p-3 rounded-2xl">
                    <Edit3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Valor Personalizado</h3>
                    <p className="text-sm text-black/40">Defina um valor diferente do padrão</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1.5 block">Novo Valor Unitário (R$)</label>
                    <input 
                      autoFocus
                      type="number"
                      step="0.01"
                      value={newPriceValue}
                      onChange={e => setNewPriceValue(e.target.value)}
                      className="w-full bg-black/5 border-2 border-transparent focus:border-black rounded-2xl px-4 py-4 text-2xl font-bold outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setEditingPriceItem(null)}
                      className="py-4 rounded-2xl font-bold text-black/40 hover:bg-black/5 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => {
                        const val = parseFloat(newPriceValue);
                        if (!isNaN(val)) {
                          onUpdateItemPrice(editingPriceItem.productId, editingPriceItem.price, val);
                          setEditingPriceItem(null);
                        }
                      }}
                      className="bg-black text-white py-4 rounded-2xl font-bold hover:bg-black/80 transition-all shadow-lg"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            </Modal>
          )}

          {transferringItem && (
            <Modal title="Transferir Item" onClose={() => setTransferringItem(null)}>
              <div className="space-y-6">
                <div className="bg-black/5 p-4 rounded-2xl space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-black/40">Quantidade a transferir</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setTransferQuantity(Math.max(1, transferQuantity - 1))}
                        className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm hover:bg-black hover:text-white transition-all"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-2xl font-bold font-mono w-8 text-center">{transferQuantity}</span>
                      <button 
                        onClick={() => setTransferQuantity(Math.min(transferringItem.maxQuantity, transferQuantity + 1))}
                        className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm hover:bg-black hover:text-white transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => setTransferQuantity(transferringItem.maxQuantity)}
                      className="text-xs font-bold text-black/40 hover:text-black"
                    >
                      Máximo ({transferringItem.maxQuantity})
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-black/40">Selecione o destino</p>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {otherTabs.length === 0 ? (
                      <p className="text-center py-4 text-sm text-black/40 italic">Nenhuma outra comanda aberta para transferência.</p>
                    ) : (
                      otherTabs.map(destTab => (
                        <button
                          key={destTab.id}
                          onClick={() => {
                            onTransferItem(destTab.id, transferringItem.productId, transferQuantity, transferringItem.price);
                            setTransferringItem(null);
                          }}
                          className="w-full flex items-center justify-between p-4 bg-black/5 hover:bg-black hover:text-white rounded-xl transition-all text-left"
                        >
                          <span className="font-bold">{destTab.customerName}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => setTransferringItem(null)}
                  className="w-full py-3 text-sm font-bold text-black/40 hover:text-black transition-all"
                >
                  Cancelar
                </button>
              </div>
            </Modal>
          )}
        </AnimatePresence>

        <div className="p-6 border-t border-black/5 bg-black/[0.02] space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs text-black/40 uppercase font-bold tracking-wider">Subtotal</p>
              <p className="font-bold">R$ {calculateTotal().toFixed(2)}</p>
            </div>

            {(tab.payments || []).length > 0 && (
              <div className="flex justify-between items-center text-emerald-600">
                <p className="text-xs uppercase font-bold tracking-wider">Já Pago (Parcial)</p>
                <p className="font-bold font-mono">- R$ {(tab.payments || []).reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</p>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <p className="text-xs text-black/40 uppercase font-bold tracking-wider">Desconto (%)</p>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercentage || ''}
                  onChange={e => setDiscountPercentage(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-16 bg-white border border-black/10 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-black"
                  placeholder="0"
                />
              </div>
              {discountPercentage > 0 && (
                <div className="text-right">
                  <p className="text-red-500 font-bold text-xs">
                    - R$ {(Math.max(0, (calculateTotal() - (tab.payments || []).reduce((sum, p) => sum + p.amount, 0)) - tab.items.reduce((sum, item) => {
                      if (item.productId === 'prod_game_fee') {
                        const product = products.find(p => p.id === item.productId);
                        const price = item.price !== undefined && item.price !== null ? item.price : (product?.price || 0);
                        return sum + price * item.quantity;
                      }
                      return sum;
                    }, 0)) * (discountPercentage / 100)).toFixed(2)}
                  </p>
                  <p className="text-[8px] text-red-400 font-bold uppercase tracking-widest">Desconto Aplicado (Exceto Taxa de Jogo)</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-black/10 flex justify-between items-end bg-black text-white p-4 -mx-6 -mb-6 mt-4">
              <div>
                <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest mb-1">Saldo Devedor</p>
                <p className="text-4xl font-bold tracking-tighter">
                  R$ {(calculateTotal() - (tab.payments || []).reduce((sum, p) => sum + p.amount, 0) - (Math.max(0, (calculateTotal() - (tab.payments || []).reduce((sum, p) => sum + p.amount, 0)) - tab.items.reduce((sum, item) => {
                    if (item.productId === 'prod_game_fee') {
                      const product = products.find(p => p.id === item.productId);
                      const price = item.price !== undefined && item.price !== null ? item.price : (product?.price || 0);
                      return sum + price * item.quantity;
                    }
                    return sum;
                  }, 0)) * (discountPercentage / 100))).toFixed(2)}
                </p>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-1">
                {tab.items.reduce((sum, i) => sum + i.quantity, 0)} Itens
              </div>
            </div>
          </div>

          {isEditingPayer && (
            <Modal title="Identificar Pagadores" onClose={() => setIsEditingPayer(null)}>
              <div className="space-y-4">
                <div className="bg-black/5 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-black/40">
                    <span>Total do Item</span>
                    <span>R$ {isEditingPayer.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Soma dos Pagadores</span>
                    <span className={Math.abs(isEditingPayer.details.reduce((sum, d) => sum + d.amount, 0) - isEditingPayer.totalAmount) > 0.01 ? 'text-red-500' : 'text-emerald-600'}>
                      R$ {isEditingPayer.details.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                    </span>
                  </div>
                  {Math.abs(isEditingPayer.details.reduce((sum, d) => sum + d.amount, 0) - isEditingPayer.totalAmount) > 0.01 && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
                      <AlertCircle className="w-3 h-3" />
                      A soma deve ser exatamente R$ {isEditingPayer.totalAmount.toFixed(2)}
                    </div>
                  )}
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                  {isEditingPayer.details.map((detail, idx) => (
                    <div key={idx} className="flex gap-2 items-end bg-black/5 p-3 rounded-xl">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Nome</label>
                        <input 
                          type="text"
                          value={detail.name}
                          onChange={(e) => {
                            const newDetails = [...isEditingPayer.details];
                            newDetails[idx].name = e.target.value;
                            setIsEditingPayer({ ...isEditingPayer, details: newDetails });
                          }}
                          placeholder="Ex: João"
                          className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Valor</label>
                        <input 
                          type="number"
                          value={detail.amount}
                          onChange={(e) => {
                            const newDetails = [...isEditingPayer.details];
                            newDetails[idx].amount = parseFloat(e.target.value) || 0;
                            setIsEditingPayer({ ...isEditingPayer, details: newDetails });
                          }}
                          className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const newDetails = isEditingPayer.details.filter((_, i) => i !== idx);
                          setIsEditingPayer({ ...isEditingPayer, details: newDetails });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => {
                    const currentSum = isEditingPayer.details.reduce((sum, d) => sum + d.amount, 0);
                    const remaining = Math.max(0, isEditingPayer.totalAmount - currentSum);
                    const newDetails = [...isEditingPayer.details, { name: '', amount: remaining }];
                    setIsEditingPayer({ ...isEditingPayer, details: newDetails });
                  }}
                  className="w-full py-2 border-2 border-dashed border-black/10 rounded-xl text-xs font-bold text-black/40 hover:border-black/20 hover:text-black transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-3 h-3" /> Adicionar Pagador
                </button>

                <div className="flex gap-2 pt-4 border-t border-black/5">
                  <button 
                    onClick={() => setIsEditingPayer(null)}
                    className="flex-1 py-3 rounded-xl font-bold text-black/40 hover:bg-black/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      const currentSum = isEditingPayer.details.reduce((sum, d) => sum + d.amount, 0);
                      if (Math.abs(currentSum - isEditingPayer.totalAmount) > 0.01) {
                        alert(`O valor total dos pagadores (R$ ${currentSum.toFixed(2)}) deve ser igual ao valor total do item (R$ ${isEditingPayer.totalAmount.toFixed(2)})`);
                        return;
                      }

                      const newItems = [...tab.items];
                      const itemIdx = newItems.findIndex(i => 
                        i.productId === isEditingPayer.productId && 
                        (
                          i.price === isEditingPayer.price || 
                          (i.price === null && isEditingPayer.price === undefined) ||
                          (i.price === undefined && isEditingPayer.price === null) ||
                          (i.price === undefined && products.find(p => p.id === i.productId)?.price === isEditingPayer.price) ||
                          (i.price === null && products.find(p => p.id === i.productId)?.price === isEditingPayer.price)
                        )
                      );
                      if (itemIdx !== -1) {
                        const details = isEditingPayer.details.filter(d => d.name.trim() !== '');
                        const payerName = details.map(d => d.name).join(', ');
                        newItems[itemIdx] = { 
                          ...newItems[itemIdx], 
                          payerName,
                          payerDetails: details 
                        };
                        onUpdateTabInfo(tab.customerName, tab.groupTime, newItems);
                      }
                      setIsEditingPayer(null);
                    }}
                    disabled={Math.abs(isEditingPayer.details.reduce((sum, d) => sum + d.amount, 0) - isEditingPayer.totalAmount) > 0.01}
                    className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-black/80 disabled:bg-black/20 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/10"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </Modal>
          )}

          <div className="flex flex-col gap-2 mt-10">
            <div className="flex gap-2">
              <button 
                onClick={() => setIsPartialPaymentModalOpen(true)}
                className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10"
              >
                <DollarSign className="w-5 h-5" />
                Pagamento Parcial
              </button>
              <button 
                disabled={groupedItems.length === 0}
                onClick={() => onCheckout(discountPercentage)}
                className="flex-[1.5] bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black/80 transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-lg shadow-black/10"
              >
                <CheckCircle2 className="w-5 h-5" />
                Fechar e Pagar
              </button>
            </div>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeleteTab();
              }}
              className="w-full py-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              Excluir Comanda Inteira
            </button>
          </div>
        </div>

        {isPartialPaymentModalOpen && (
          <PartialPaymentModal 
            tab={tab}
            products={products}
            onClose={() => setIsPartialPaymentModalOpen(false)}
            onConfirm={(amount, method, items, payerName) => {
              onAddPartialPayment(amount, method, items, payerName);
              setIsPartialPaymentModalOpen(false);
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

function PartialPaymentModal({ tab, products, onClose, onConfirm }: { 
  tab: Tab; 
  products: Product[]; 
  onClose: () => void; 
  onConfirm: (amount: number, method: 'Dinheiro' | 'PIX' | 'Débito' | 'Crédito', items: { productId: string; quantity: number; price?: number }[], payerName?: string) => void 
}) {
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<'Dinheiro' | 'PIX' | 'Débito' | 'Crédito'>('Dinheiro');
  const [payerName, setPayerName] = useState('');

  const groupedItems = useMemo(() => {
    const groups: Record<string, TabItem & { product?: Product }> = {};
    tab.items.forEach(item => {
      const key = `${item.productId}_${item.price ?? 'default'}`;
      if (!groups[key]) {
        const product = products.find(p => p.id === item.productId);
        groups[key] = { ...item, product };
      } else {
        groups[key].quantity += item.quantity;
        groups[key].paidQuantity += item.paidQuantity;
      }
    });
    return Object.values(groups)
      .filter(item => item.quantity > (item.paidQuantity || 0))
      .sort((a, b) => (a.product?.name || '').localeCompare(b.product?.name || ''));
  }, [tab.items, products]);

  const totalToPay = useMemo(() => {
    return Object.entries(selectedItems).reduce((sum, [key, qty]) => {
      const item = groupedItems.find(i => `${i.productId}_${i.price ?? 'default'}` === key);
      if (!item) return sum;
      const price = item.price !== undefined && item.price !== null ? item.price : (item.product?.price || 0);
      return sum + price * (qty as number);
    }, 0);
  }, [selectedItems, groupedItems]);

  const handleConfirm = () => {
    if (totalToPay <= 0) return;
    
    const itemsToPay = Object.entries(selectedItems)
      .filter(([_, qty]) => (qty as number) > 0)
      .map(([key, qty]) => {
        const item = groupedItems.find(i => `${i.productId}_${i.price ?? 'default'}` === key);
        return {
          productId: item!.productId,
          quantity: qty as number,
          price: item!.price
        };
      });

    onConfirm(totalToPay, paymentMethod, itemsToPay, payerName);
  };

  return (
    <Modal title="Pagamento Parcial" onClose={onClose}>
      <div className="flex flex-col h-[80vh] max-h-[600px]">
        <div className="p-6 border-b border-black/5">
          <p className="text-sm text-black/40 mb-4">Selecione os itens e quantidades que estão sendo pagos agora.</p>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {groupedItems.map(item => {
              const key = `${item.productId}_${item.price ?? 'default'}`;
              const remaining = item.quantity - (item.paidQuantity || 0);
              const selected = selectedItems[key] || 0;
              const price = item.price !== undefined && item.price !== null ? item.price : (item.product?.price || 0);

              return (
                <div key={key} className="flex items-center justify-between p-3 bg-black/5 rounded-2xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.product?.name}</p>
                    <p className="text-[10px] text-black/40">R$ {price.toFixed(2)} cada • {remaining} em aberto</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white rounded-xl p-1 shadow-sm">
                      <button 
                        onClick={() => setSelectedItems(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) - 1) }))}
                        className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-lg transition-all"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-sm">{selected}</span>
                      <button 
                        onClick={() => setSelectedItems(prev => ({ ...prev, [key]: Math.min(remaining, (prev[key] || 0) + 1) }))}
                        className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-lg transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 space-y-6 mt-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Identificação do Pagador</p>
              <input 
                type="text"
                value={payerName}
                onChange={e => setPayerName(e.target.value)}
                placeholder="Nome de quem está pagando"
                className="w-full bg-black/5 border-2 border-transparent focus:border-black rounded-xl px-4 py-3 text-sm outline-none transition-all"
              />
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Forma de Pagamento</p>
              <div className="grid grid-cols-2 gap-2">
                {(['Dinheiro', 'PIX', 'Débito', 'Crédito'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`py-3 rounded-xl text-xs font-bold transition-all border-2 ${paymentMethod === m ? 'border-black bg-black text-white' : 'border-black/5 hover:border-black/20'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-black/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Total Selecionado</p>
              <p className="text-2xl font-bold">R$ {totalToPay.toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-3 font-bold text-black/40 hover:text-black">Cancelar</button>
              <button 
                onClick={handleConfirm}
                disabled={totalToPay <= 0}
                className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-20 shadow-lg shadow-emerald-500/20"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-black/5 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
