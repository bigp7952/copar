import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf, DatePipe, CurrencyPipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppDataService } from '../../core/app-data.service';
import { PaymentStatus } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [NgFor, NgIf, DatePipe, CurrencyPipe, PercentPipe, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly data = inject(AppDataService);

  readonly currency = computed(() => this.data.settings().currency);

  readonly monthlyIncome = computed(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const ym = `${year}-${month}`;
    
    const parts = this.data.paymentParts();
    const otherIncome = this.data.otherIncome();
    
    // Calculer les revenus du mois actuel
    const fromPayments = parts
      .filter(p => {
        const dateStr = p.date ?? '';
        // Extraire YYYY-MM de la date (peut être YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
        const dateMatch = dateStr.match(/^(\d{4}-\d{2})/);
        if (!dateMatch) return false;
        return dateMatch[1] === ym;
      })
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      
    const fromOtherIncome = otherIncome
      .filter(i => {
        const dateStr = i.date ?? '';
        const dateMatch = dateStr.match(/^(\d{4}-\d{2})/);
        if (!dateMatch) return false;
        return dateMatch[1] === ym;
      })
      .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    
    const total = fromPayments + fromOtherIncome;
    
    // Si pas de revenus ce mois, additionner TOUS les revenus (tous les mois)
    if (total === 0 && (parts.length > 0 || otherIncome.length > 0)) {
      const allPayments = parts.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      const allOtherIncome = otherIncome.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
      return allPayments + allOtherIncome;
    }
    
    return total;
  });

  readonly monthlyExpenses = computed(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const ym = `${year}-${month}`;
    
    const expenses = this.data.expenses();
    
    // Calculer les dépenses du mois actuel
    const currentMonthExpenses = expenses
      .filter(e => {
        const dateStr = e.date ?? '';
        const dateMatch = dateStr.match(/^(\d{4}-\d{2})/);
        if (!dateMatch) return false;
        return dateMatch[1] === ym;
      })
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    
    // Si pas de dépenses ce mois mais qu'il y a des dépenses ailleurs, afficher toutes les dépenses
    if (currentMonthExpenses === 0 && expenses.length > 0) {
      const allExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      return allExpenses;
    }
    
    return currentMonthExpenses;
  });

  readonly projectedIncome = computed(() => {
    const future = this.data
      .paymentTargets()
      .filter(t => t.status !== 'paid')
      .reduce((acc, t) => acc + t.totalAmount, 0);
    return this.monthlyIncome() + future;
  });

  readonly liveBusinessSave = computed(() => {
    const parts = this.data.paymentParts();
    const otherIncome = this.data.otherIncome();
    const live = parts.reduce((acc, p) => acc + p.splitLive, 0) + otherIncome.reduce((acc, i) => acc + i.splitLive, 0);
    const business = parts.reduce((acc, p) => acc + p.splitBusiness, 0) + otherIncome.reduce((acc, i) => acc + i.splitBusiness, 0);
    const save = parts.reduce((acc, p) => acc + p.splitSave, 0) + otherIncome.reduce((acc, i) => acc + i.splitSave, 0);
    const total = live + business + save || 1;
    return [
      ['Vivre', live / total],
      ['Business', business / total],
      ['Épargne', save / total],
    ] as [string, number][];
  });

  readonly expenseByCategory = computed(() => {
    const map = new Map<string, number>();
    for (const e of this.data.expenses()) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return Array.from(map.entries());
  });

  readonly paymentsStatusCounts = computed(() => {
    const targets = this.data.paymentTargets();
    const counts: Record<PaymentStatus, number> = { pending: 0, partial: 0, paid: 0 };
    for (const t of targets) {
      counts[t.status]++;
    }
    return [
      ['En attente', counts.pending],
      ['Partiels', counts.partial],
      ['Payés', counts.paid],
    ] as [string, number][];
  });

  readonly recentPayments = computed(() => {
    const parts = this.data.paymentParts();
    const targets = this.data.paymentTargets();
    const clients = this.data.clients();
    const otherIncome = this.data.otherIncome();
    
    // Combiner les paiements clients et les autres revenus
    const clientPayments = parts.map(p => {
      const target = targets.find(t => t.id === p.paymentTargetId);
      const client = clients.find(c => c?.id === target?.clientId);
      return {
        ...p,
        clientName: client?.name ?? 'Client inconnu',
        targetTitle: target?.title ?? 'Séance',
        type: 'client' as const,
        date: p.date,
        amount: p.amount,
      };
    });
    
    const otherIncomes = otherIncome.map(i => ({
      id: i.id,
      clientName: i.source,
      targetTitle: 'Autre revenu',
      type: 'other' as const,
      date: i.date,
      amount: i.amount,
    }));
    
    // Combiner et trier par date
    return [...clientPayments, ...otherIncomes]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  });

  readonly otherIncomeList = computed(() => {
    return this.data.otherIncome()
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  });

  // Graphiques et visualisations
  readonly chartData = computed(() => {
    const income = this.monthlyIncome();
    const expenses = this.monthlyExpenses();
    const max = Math.max(income, expenses) || 1;
    return {
      incomePercent: (income / max) * 100,
      expensesPercent: (expenses / max) * 100,
    };
  });

  // Données pour graphiques en courbes (évolution sur 6 derniers mois)
  readonly lineChartData = computed(() => {
    const parts = this.data.paymentParts();
    const otherIncome = this.data.otherIncome();
    const expenses = this.data.expenses();
    
    // Créer un tableau des 6 derniers mois
    const months: Array<{ month: string; income: number; expenses: number }> = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const ym = `${year}-${month}`;
      
      // Calculer revenus du mois
      const monthIncome = parts
        .filter(p => {
          const dateMatch = (p.date ?? '').match(/^(\d{4}-\d{2})/);
          return dateMatch && dateMatch[1] === ym;
        })
        .reduce((acc, p) => acc + (Number(p.amount) || 0), 0) +
        otherIncome
          .filter(i => {
            const dateMatch = (i.date ?? '').match(/^(\d{4}-\d{2})/);
            return dateMatch && dateMatch[1] === ym;
          })
          .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
      
      // Calculer dépenses du mois
      const monthExpenses = expenses
        .filter(e => {
          const dateMatch = (e.date ?? '').match(/^(\d{4}-\d{2})/);
          return dateMatch && dateMatch[1] === ym;
        })
        .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      
      months.push({
        month: `${month}/${year.toString().slice(-2)}`,
        income: monthIncome,
        expenses: monthExpenses,
      });
    }
    
    // Trouver le maximum pour l'échelle
    const maxValue = Math.max(
      ...months.map(m => Math.max(m.income, m.expenses)),
      1
    );
    
    return { months, maxValue };
  });

  readonly suggestions = computed(() => {
    const suggestions: Array<{ type: 'success' | 'warning' | 'info'; icon: 'warning' | 'check-circle' | 'savings' | 'target' | 'document' | 'chart' | 'lightbulb' | 'zap'; title: string; message: string }> = [];
    const income = this.monthlyIncome();
    const expenses = this.monthlyExpenses();
    const balance = income - expenses;
    const liveBusinessSaveData = this.liveBusinessSave();
    const expenseByCategoryData = this.expenseByCategory();
    const paymentsStatusData = this.paymentsStatusCounts();

    // Suggestion sur le solde
    if (balance < 0) {
      suggestions.push({
        type: 'warning',
        icon: 'warning',
        title: 'Solde négatif',
        message: `Tu dépenses ${Math.abs(balance).toLocaleString()} ${this.currency()} de plus que tes revenus. Réduis tes dépenses ou augmente tes revenus.`,
      });
    } else if (balance > income * 0.3 && income > 0) {
      suggestions.push({
        type: 'success',
        icon: 'check-circle',
        title: 'Excellent solde',
        message: `Tu as un solde positif de ${balance.toLocaleString()} ${this.currency()}. Continue comme ça !`,
      });
    }

    // Suggestion sur l'épargne
    const saveRatio = liveBusinessSaveData.find(([name]: [string, number]) => name === 'Épargne')?.[1] || 0;
    if (saveRatio < 0.15) {
      suggestions.push({
        type: 'warning',
        icon: 'savings',
        title: 'Épargne faible',
        message: `Tu épargnes seulement ${(saveRatio * 100).toFixed(0)}% de tes revenus. L'objectif recommandé est de 20%.`,
      });
    } else if (saveRatio >= 0.2) {
      suggestions.push({
        type: 'success',
        icon: 'target',
        title: 'Bonne épargne',
        message: `Tu épargnes ${(saveRatio * 100).toFixed(0)}% de tes revenus. Excellent pour ton avenir !`,
      });
    }

    // Suggestion sur les paiements en attente
    const pendingPayments = paymentsStatusData.find(([status]: [string, number]) => status === 'En attente')?.[1] || 0;
    if (pendingPayments > 0) {
      suggestions.push({
        type: 'info',
        icon: 'document',
        title: 'Paiements en attente',
        message: `Tu as ${pendingPayments} paiement${pendingPayments > 1 ? 's' : ''} en attente. N'oublie pas de suivre tes clients.`,
      });
    }

    // Suggestion sur les dépenses par catégorie
    if (expenseByCategoryData.length > 0) {
      const maxCategory = expenseByCategoryData.reduce((max: [string, number], curr: [string, number]) => (curr[1] > max[1] ? curr : max));
      const totalExpenses = expenseByCategoryData.reduce((sum: number, curr: [string, number]) => sum + curr[1], 0);
      const categoryPercent = (maxCategory[1] / totalExpenses) * 100;
      if (categoryPercent > 50) {
        suggestions.push({
          type: 'info',
          icon: 'chart',
          title: 'Dépense principale',
          message: `La catégorie "${maxCategory[0]}" représente ${categoryPercent.toFixed(0)}% de tes dépenses. Vérifie si c'est justifié.`,
        });
      }
    }

    // Suggestion si pas de revenus
    if (income === 0 && this.data.paymentTargets().length > 0) {
      suggestions.push({
        type: 'info',
        icon: 'lightbulb',
        title: 'Pas de revenus ce mois',
        message: 'Tu as des séances prévues mais aucun revenu ce mois. Pense à enregistrer tes paiements.',
      });
    }

    // Suggestion si ratio dépenses/revenus élevé
    if (income > 0) {
      const expenseRatio = expenses / income;
      if (expenseRatio > 0.8) {
        suggestions.push({
          type: 'warning',
          icon: 'zap',
          title: 'Dépenses élevées',
          message: `Tes dépenses représentent ${(expenseRatio * 100).toFixed(0)}% de tes revenus. Essaie de réduire à 60-70%.`,
        });
      }
    }

    return suggestions.slice(0, 4); // Limiter à 4 suggestions
  });

  // Helpers pour les graphiques
  getCircleOffset(index: number): number {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      const item = this.liveBusinessSave()[i];
      offset += item[1] * 251.2;
    }
    return offset;
  }

  getExpenseCategoryPercent(amount: number): number {
    const total = this.expenseByCategory().reduce((sum, item) => sum + item[1], 0);
    if (total === 0) return 0;
    return (amount / total) * 100;
  }

  getPaymentStatusPercent(count: number): number {
    const total = this.paymentsStatusCounts().reduce((sum, item) => sum + item[1], 0);
    if (total === 0) return 0;
    return (count / total) * 100;
  }

  // Helpers pour les graphiques en courbes
  getIncomePoints(): Array<{ x: number; y: number }> {
    const data = this.lineChartData();
    const points: Array<{ x: number; y: number }> = [];
    const chartWidth = 340;
    const chartHeight = 170;
    const padding = 40;
    
    data.months.forEach((month, index) => {
      const x = padding + (index * (chartWidth / (data.months.length - 1 || 1)));
      const y = padding + chartHeight - ((month.income / data.maxValue) * chartHeight);
      points.push({ x, y });
    });
    
    return points;
  }

  getExpensePoints(): Array<{ x: number; y: number }> {
    const data = this.lineChartData();
    const points: Array<{ x: number; y: number }> = [];
    const chartWidth = 340;
    const chartHeight = 170;
    const padding = 40;
    
    data.months.forEach((month, index) => {
      const x = padding + (index * (chartWidth / (data.months.length - 1 || 1)));
      const y = padding + chartHeight - ((month.expenses / data.maxValue) * chartHeight);
      points.push({ x, y });
    });
    
    return points;
  }

  getIncomeLinePath(): string {
    const points = this.getIncomePoints();
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  }

  getExpenseLinePath(): string {
    const points = this.getExpensePoints();
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  }

  getIncomeAreaPath(): string {
    const points = this.getIncomePoints();
    if (points.length === 0) return '';
    
    const padding = 40;
    const chartHeight = 170;
    const baseY = padding + chartHeight;
    
    let path = `M ${points[0].x} ${baseY}`;
    points.forEach(point => {
      path += ` L ${point.x} ${point.y}`;
    });
    path += ` L ${points[points.length - 1].x} ${baseY} Z`;
    return path;
  }

  getExpenseAreaPath(): string {
    const points = this.getExpensePoints();
    if (points.length === 0) return '';
    
    const padding = 40;
    const chartHeight = 170;
    const baseY = padding + chartHeight;
    
    let path = `M ${points[0].x} ${baseY}`;
    points.forEach(point => {
      path += ` L ${point.x} ${point.y}`;
    });
    path += ` L ${points[points.length - 1].x} ${baseY} Z`;
    return path;
  }

  // Formulaire pour ajouter un revenu
  addingIncome = signal(false);
  incomeDraft: {
    amount: number | null;
    date: string | null;
    source: string;
    note?: string;
  } = this.emptyIncomeDraft();

  startAddIncome() {
    this.incomeDraft = this.emptyIncomeDraft();
    this.addingIncome.set(true);
  }

  cancelIncome() {
    this.addingIncome.set(false);
  }

  async saveIncome() {
    if (!this.incomeDraft.amount || !this.incomeDraft.date || !this.incomeDraft.source.trim()) return;
    try {
      await this.data.addOtherIncome(
        this.incomeDraft.amount,
        this.incomeDraft.date,
        this.incomeDraft.source.trim(),
        this.incomeDraft.note
      );
      this.addingIncome.set(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du revenu:', error);
      alert('Erreur lors de l\'ajout du revenu');
    }
  }

  async deleteIncome(id: string) {
    if (confirm('Supprimer ce revenu ?')) {
      try {
        await this.data.deleteOtherIncome(id);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  }

  private emptyIncomeDraft() {
    const today = new Date().toISOString().slice(0, 10);
    return {
      amount: null,
      date: today,
      source: '',
      note: '',
    };
  }
}

