import { Injectable, computed, signal, inject } from '@angular/core';
import { AppSettings, Client, Expense, Feedback, OtherIncome, PaymentPart, PaymentStatus, PaymentTarget, Ratios, User } from './models';
import { SupabaseService } from './supabase.service';

interface RawState {
  clients: Client[];
  paymentTargets: PaymentTarget[];
  paymentParts: PaymentPart[];
  expenses: Expense[];
  feedbacks: Feedback[];
  users: User[];
  settings: AppSettings;
  otherIncome: OtherIncome[];
}

@Injectable({ providedIn: 'root' })
export class AppDataService {
  private readonly supabase = inject(SupabaseService);
  private readonly state = signal<RawState>({
    clients: [],
    paymentTargets: [],
    paymentParts: [],
    expenses: [],
    feedbacks: [],
    users: [],
    settings: this.getDefaultSettings(),
    otherIncome: [],
  });

  readonly clients = computed(() => this.state().clients);
  readonly paymentTargets = computed(() => this.state().paymentTargets);
  readonly paymentParts = computed(() => this.state().paymentParts);
  readonly expenses = computed(() => this.state().expenses);
  readonly feedbacks = computed(() => this.state().feedbacks);
  readonly users = computed(() => this.state().users);
  readonly settings = computed(() => this.state().settings);
  readonly otherIncome = computed(() => this.state().otherIncome);

  private initialized = false;

  constructor() {
    // Charger les données depuis Supabase au démarrage
    this.loadFromSupabase().catch(console.error);

    // Écouter les changements en temps réel (optionnel)
    this.setupRealtimeSubscriptions();
  }

  private async loadFromSupabase() {
    try {
      const [clients, paymentTargets, paymentParts, expenses, feedbacks, settings, otherIncome] = await Promise.all([
        this.supabase.getClients().catch(() => []).then(this.mapClients),
        this.supabase.getPaymentTargets().catch(() => []).then(this.mapPaymentTargets),
        this.supabase.getPaymentParts().catch(() => []).then(this.mapPaymentParts),
        this.supabase.getExpenses().catch(() => []).then(this.mapExpenses),
        this.supabase.getFeedbacks().catch(() => []).then(this.mapFeedbacks),
        this.supabase.getSettings().catch(() => null).then(this.mapSettings),
        this.supabase.getOtherIncome().catch(() => []).then(this.mapOtherIncome),
      ]);

      // Si toutes les données sont vides, charger des données de démo
      const hasData = clients.length > 0 || paymentTargets.length > 0 || paymentParts.length > 0 || expenses.length > 0;
      
      if (!hasData) {
        console.log('Aucune donnée dans Supabase. Chargement des données de démo...');
        const demoData = this.getDemoData();
        this.state.set({
          ...demoData,
          settings: settings || this.getDefaultSettings(),
        });
      } else {
        this.state.set({
          clients,
          paymentTargets,
          paymentParts,
          expenses,
          feedbacks,
          users: [],
          settings: settings || this.getDefaultSettings(),
          otherIncome,
        });
      }

      this.initialized = true;
    } catch (error) {
      console.error('Erreur lors du chargement depuis Supabase:', error);
      // Fallback sur les données de démo en cas d'erreur
      console.log('Chargement des données de démo en fallback...');
      const demoData = this.getDemoData();
      this.state.set({
        ...demoData,
        settings: this.getDefaultSettings(),
      });
    }
  }

  private getDemoData(): RawState {
    // Utiliser la date d'aujourd'hui au format YYYY-MM-DD pour correspondre au format de la base
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const now = new Date().toISOString();
    
    console.log('Chargement des données de démo avec date:', dateStr);
    
    const demoClient: Client = {
      id: 'c1',
      name: 'Pâtisserie Douceur',
      type: 'patisserie',
      phone: '+237 6 XX XX XX',
      defaultFee: 50000,
      createdAt: now,
    };

    const demoTarget: PaymentTarget = {
      id: 'pt1',
      clientId: demoClient.id,
      title: 'Séance shooting catalogue',
      totalAmount: 150000,
      createdAt: now,
      status: 'partial',
      dueDate: now,
    };

    const split = this.splitAmount(60000, this.getDefaultSettings().ratios);
    const demoPart: PaymentPart = {
      id: 'pp1',
      paymentTargetId: demoTarget.id,
      amount: 60000,
      date: dateStr, // Utiliser le format YYYY-MM-DD
      note: 'Acompte',
      ...split,
    };

    const demoExpense: Expense = {
      id: 'e1',
      userId: 'admin',
      amount: 15000,
      category: 'Matériel',
      date: dateStr, // Utiliser le format YYYY-MM-DD
      note: 'Location lumière',
      type: 'business',
    };

    // Ajouter aussi un autre revenu de démo
    const demoOtherIncome: OtherIncome = {
      id: 'oi1',
      amount: 25000,
      date: dateStr,
      source: 'Vente photo',
      note: 'Revenu de démo',
      splitLive: split.splitLive,
      splitBusiness: split.splitBusiness,
      splitSave: split.splitSave,
      createdAt: now,
    };

    return {
      clients: [demoClient],
      paymentTargets: [demoTarget],
      paymentParts: [demoPart],
      expenses: [demoExpense],
      feedbacks: [],
      users: [],
      settings: this.getDefaultSettings(),
      otherIncome: [demoOtherIncome],
    };
  }

  private setupRealtimeSubscriptions() {
    // Subscription pour les clients
    this.supabase.client
      .channel('clients-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        this.supabase.getClients().then(data => {
          this.state.update(s => ({ ...s, clients: this.mapClients(data) }));
        });
      })
      .subscribe();

    // Subscription pour les payment_targets
    this.supabase.client
      .channel('payment-targets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_targets' }, () => {
        this.supabase.getPaymentTargets().then(data => {
          this.state.update(s => ({ ...s, paymentTargets: this.mapPaymentTargets(data) }));
        });
      })
      .subscribe();

    // Subscription pour les payment_parts
    this.supabase.client
      .channel('payment-parts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_parts' }, () => {
        this.supabase.getPaymentParts().then(data => {
          this.state.update(s => ({ ...s, paymentParts: this.mapPaymentParts(data) }));
        });
      })
      .subscribe();

    // Subscription pour les expenses
    this.supabase.client
      .channel('expenses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        this.supabase.getExpenses().then(data => {
          this.state.update(s => ({ ...s, expenses: this.mapExpenses(data) }));
        });
      })
      .subscribe();

    // Subscription pour les other_income
    this.supabase.client
      .channel('other-income-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'other_income' }, () => {
        this.supabase.getOtherIncome().then(data => {
          this.state.update(s => ({ ...s, otherIncome: this.mapOtherIncome(data) }));
        });
      })
      .subscribe();
  }

  // Mappers pour convertir les données Supabase vers nos modèles
  private mapClients(data: any[]): Client[] {
    if (!data || !Array.isArray(data)) return [];
    return data.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      email: c.email,
      phone: c.phone,
      defaultFee: c.default_fee,
      notes: c.notes,
      createdAt: c.created_at,
    }));
  }

  private mapPaymentTargets(data: any[]): PaymentTarget[] {
    if (!data || !Array.isArray(data)) return [];
    return data.map(t => ({
      id: t.id,
      clientId: t.client_id,
      title: t.title,
      totalAmount: t.total_amount,
      status: t.status,
      createdAt: t.created_at,
      dueDate: t.due_date,
    }));
  }

  private mapPaymentParts(data: any[]): PaymentPart[] {
    if (!data || !Array.isArray(data)) return [];
    return data.map(p => ({
      id: p.id,
      paymentTargetId: p.payment_target_id,
      amount: p.amount,
      date: p.date,
      note: p.note,
      splitLive: p.split_live,
      splitBusiness: p.split_business,
      splitSave: p.split_save,
    }));
  }

  private mapExpenses(data: any[]): Expense[] {
    if (!data || !Array.isArray(data)) return [];
    return data.map(e => ({
      id: e.id,
      userId: e.user_id,
      amount: e.amount,
      category: e.category,
      date: e.date,
      note: e.note,
      type: e.type,
    }));
  }

  private mapFeedbacks(data: any[]): Feedback[] {
    if (!data || !Array.isArray(data)) return [];
    return data.map(f => ({
      id: f.id,
      clientId: f.client_id,
      rating: f.rating || 0,
      comment: f.comment || '',
      createdAt: f.created_at,
      token: f.token,
    }));
  }

  private mapSettings(data: any): AppSettings | null {
    if (!data) return null;
    return {
      id: data.id,
      currency: data.currency,
      ratios: data.ratios,
      expenseCategories: data.expense_categories || [],
    };
  }

  private mapOtherIncome(data: any[]): OtherIncome[] {
    if (!data || !Array.isArray(data)) return [];
    return data.map(i => ({
      id: i.id,
      amount: i.amount,
      date: i.date,
      source: i.source,
      note: i.note,
      splitLive: i.split_live,
      splitBusiness: i.split_business,
      splitSave: i.split_save,
      createdAt: i.created_at,
    }));
  }

  private getDefaultSettings(): AppSettings {
    return {
      id: 'default',
      currency: 'FCFA',
      ratios: { live: 0.4, business: 0.4, save: 0.2 },
      expenseCategories: ['Nourriture', 'Transport', 'Matériel', 'Loyer', 'Autre'],
    };
  }

  private splitAmount(amount: number, ratios: Ratios) {
    const splitLive = Math.round(amount * ratios.live);
    const splitBusiness = Math.round(amount * ratios.business);
    const splitSave = amount - splitLive - splitBusiness;
    return { splitLive, splitBusiness, splitSave };
  }

  // CRUD Clients
  async upsertClient(client: Partial<Client> & { id?: string }): Promise<Client> {
    const now = new Date().toISOString();
    const full: Client = {
      id: client.id ?? crypto.randomUUID(),
      name: client.name ?? '',
      type: client.type ?? 'autre',
      email: client.email,
      phone: client.phone,
      defaultFee: client.defaultFee,
      notes: client.notes,
      createdAt: client.createdAt ?? now,
    };

    try {
      const supabaseData = {
        id: full.id,
        name: full.name,
        type: full.type,
        email: full.email,
        phone: full.phone,
        default_fee: full.defaultFee,
        notes: full.notes,
      };

      const saved = await this.supabase.upsertClient(supabaseData);
      const mapped = this.mapClients([saved])[0];
      
      this.state.update(s => {
        const clients = [...s.clients];
        const index = clients.findIndex(c => c.id === mapped.id);
        if (index >= 0) {
          clients[index] = mapped;
        } else {
          clients.push(mapped);
        }
        return { ...s, clients };
      });

      return mapped;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du client:', error);
      throw error;
    }
  }

  async deleteClient(id: string): Promise<void> {
    try {
      await this.supabase.deleteClient(id);
      this.state.update(s => ({
        ...s,
        clients: s.clients.filter(c => c.id !== id),
        paymentTargets: s.paymentTargets.filter(pt => pt.clientId !== id),
        paymentParts: s.paymentParts.filter(pp => 
          s.paymentTargets.find(pt => pt.id === pp.paymentTargetId)?.clientId !== id
        ),
        feedbacks: s.feedbacks.filter(f => f.clientId !== id),
      }));
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
      throw error;
    }
  }

  // PaymentTargets & PaymentParts
  async createPaymentTarget(target: Omit<PaymentTarget, 'id' | 'status' | 'createdAt'>): Promise<PaymentTarget> {
    try {
      const supabaseData = {
        client_id: target.clientId,
        title: target.title,
        total_amount: target.totalAmount,
        due_date: target.dueDate,
        status: 'pending',
      };

      const saved = await this.supabase.createPaymentTarget(supabaseData);
      const mapped = this.mapPaymentTargets([saved])[0];

      this.state.update(s => ({
        ...s,
        paymentTargets: [...s.paymentTargets, mapped],
      }));

      return mapped;
    } catch (error) {
      console.error('Erreur lors de la création du payment target:', error);
      throw error;
    }
  }

  async addPaymentPart(targetId: string, amount: number, date: string, note?: string): Promise<PaymentPart> {
    try {
      const current = this.state();
      const target = current.paymentTargets.find(t => t.id === targetId);
      if (!target) {
        throw new Error('PaymentTarget not found');
      }

      const split = this.splitAmount(amount, current.settings.ratios);
      const supabaseData = {
        payment_target_id: targetId,
        amount,
        date,
        note,
        split_live: split.splitLive,
        split_business: split.splitBusiness,
        split_save: split.splitSave,
      };

      const saved = await this.supabase.addPaymentPart(supabaseData);
      const mapped = this.mapPaymentParts([saved])[0];

      // Le statut sera mis à jour automatiquement par le trigger SQL
      // On recharge les payment targets pour avoir le statut à jour
      const updatedTargets = await this.supabase.getPaymentTargets();
      const mappedTargets = this.mapPaymentTargets(updatedTargets);

      this.state.update(s => ({
        ...s,
        paymentParts: [...s.paymentParts, mapped],
        paymentTargets: mappedTargets,
      }));

      return mapped;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du payment part:', error);
      throw error;
    }
  }

  // Expenses
  async upsertExpense(expense: Partial<Expense> & { id?: string }): Promise<Expense> {
    const now = new Date().toISOString();
    const full: Expense = {
      id: expense.id ?? crypto.randomUUID(),
      userId: expense.userId ?? 'admin',
      amount: expense.amount ?? 0,
      category: expense.category ?? 'Autre',
      date: expense.date ?? now,
      note: expense.note,
      type: expense.type ?? 'business',
    };

    try {
      const supabaseData = {
        id: full.id,
        user_id: full.userId,
        amount: full.amount,
        category: full.category,
        date: full.date,
        note: full.note,
        type: full.type,
      };

      const saved = await this.supabase.upsertExpense(supabaseData);
      const mapped = this.mapExpenses([saved])[0];

      this.state.update(s => {
        const expenses = [...s.expenses];
        const index = expenses.findIndex(e => e.id === mapped.id);
        if (index >= 0) {
          expenses[index] = mapped;
        } else {
          expenses.push(mapped);
        }
        return { ...s, expenses };
      });

      return mapped;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la dépense:', error);
      throw error;
    }
  }

  async deleteExpense(id: string): Promise<void> {
    try {
      await this.supabase.deleteExpense(id);
      this.state.update(s => ({
        ...s,
        expenses: s.expenses.filter(e => e.id !== id),
      }));
    } catch (error) {
      console.error('Erreur lors de la suppression de la dépense:', error);
      throw error;
    }
  }

  // Feedback
  async createFeedbackToken(clientId: string): Promise<Feedback> {
    try {
      const token = crypto.randomUUID();
      const supabaseData = {
        client_id: clientId,
        token,
        rating: 0,
        comment: '',
      };

      const saved = await this.supabase.createFeedback(supabaseData);
      const mapped = this.mapFeedbacks([saved])[0];

      this.state.update(s => ({
        ...s,
        feedbacks: [...s.feedbacks, mapped],
      }));

      return mapped;
    } catch (error) {
      console.error('Erreur lors de la création du feedback:', error);
      throw error;
    }
  }

  async submitFeedback(token: string, rating: number, comment: string): Promise<void> {
    try {
      await this.supabase.updateFeedback(token, { rating, comment });
      
      this.state.update(s => {
        const feedbacks = s.feedbacks.map(f =>
          f.token === token
            ? { ...f, rating, comment, createdAt: new Date().toISOString() }
            : f,
        );
        return { ...s, feedbacks };
      });
    } catch (error) {
      console.error('Erreur lors de la soumission du feedback:', error);
      throw error;
    }
  }

  // Settings
  async updateRatios(ratios: Ratios): Promise<void> {
    try {
      const current = this.state().settings;
      const updated = { ...current, ratios };
      await this.supabase.upsertSettings({
        id: updated.id,
        currency: updated.currency,
        ratios: updated.ratios,
        expense_categories: updated.expenseCategories,
      });

      this.state.update(s => ({
        ...s,
        settings: updated,
      }));
    } catch (error) {
      console.error('Erreur lors de la mise à jour des ratios:', error);
      throw error;
    }
  }

  async updateCurrency(currency: string): Promise<void> {
    try {
      const current = this.state().settings;
      const updated = { ...current, currency };
      await this.supabase.upsertSettings({
        id: updated.id,
        currency: updated.currency,
        ratios: updated.ratios,
        expense_categories: updated.expenseCategories,
      });

      this.state.update(s => ({
        ...s,
        settings: updated,
      }));
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la devise:', error);
      throw error;
    }
  }

  async updateExpenseCategories(categories: string[]): Promise<void> {
    try {
      const current = this.state().settings;
      const updated = { ...current, expenseCategories: categories };
      await this.supabase.upsertSettings({
        id: updated.id,
        currency: updated.currency,
        ratios: updated.ratios,
        expense_categories: updated.expenseCategories,
      });

      this.state.update(s => ({
        ...s,
        settings: updated,
      }));
    } catch (error) {
      console.error('Erreur lors de la mise à jour des catégories:', error);
      throw error;
    }
  }

  // Other Income (revenus non liés à des clients)
  async addOtherIncome(amount: number, date: string, source: string, note?: string): Promise<OtherIncome> {
    try {
      const current = this.state();
      const split = this.splitAmount(amount, current.settings.ratios);
      const supabaseData = {
        amount,
        date,
        source,
        note,
        split_live: split.splitLive,
        split_business: split.splitBusiness,
        split_save: split.splitSave,
      };

      const saved = await this.supabase.addOtherIncome(supabaseData);
      const mapped = this.mapOtherIncome([saved])[0];

      this.state.update(s => ({
        ...s,
        otherIncome: [...s.otherIncome, mapped],
      }));

      return mapped;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du revenu:', error);
      throw error;
    }
  }

  async updateOtherIncome(id: string, amount: number, date: string, source: string, note?: string): Promise<OtherIncome> {
    try {
      const current = this.state();
      const split = this.splitAmount(amount, current.settings.ratios);
      const supabaseData = {
        amount,
        date,
        source,
        note,
        split_live: split.splitLive,
        split_business: split.splitBusiness,
        split_save: split.splitSave,
      };

      const saved = await this.supabase.updateOtherIncome(id, supabaseData);
      const mapped = this.mapOtherIncome([saved])[0];

      this.state.update(s => {
        const otherIncome = [...s.otherIncome];
        const index = otherIncome.findIndex(i => i.id === id);
        if (index >= 0) {
          otherIncome[index] = mapped;
        }
        return { ...s, otherIncome };
      });

      return mapped;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du revenu:', error);
      throw error;
    }
  }

  async deleteOtherIncome(id: string): Promise<void> {
    try {
      await this.supabase.deleteOtherIncome(id);
      this.state.update(s => ({
        ...s,
        otherIncome: s.otherIncome.filter(i => i.id !== id),
      }));
    } catch (error) {
      console.error('Erreur lors de la suppression du revenu:', error);
      throw error;
    }
  }
}
