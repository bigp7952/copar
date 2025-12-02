import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppDataService } from '../../core/app-data.service';
import { Expense } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-expenses-page',
  imports: [NgFor, NgIf, CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="space-y-3 sm:space-y-4">
      <!-- Header compact -->
      <div class="flex items-center justify-between gap-2">
        <div class="min-w-0 flex-1">
          <h1 class="text-base sm:text-lg font-semibold text-gray-900">Dépenses</h1>
          <p class="text-xs text-gray-600 mt-0.5 hidden sm:block">Sépare les dépenses business et perso, par catégories.</p>
        </div>
        <button
          (click)="startCreate()"
          class="px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="hidden sm:inline">Nouvelle dépense</span>
          <span class="sm:hidden">Nouveau</span>
        </button>
      </div>

      <!-- Formulaire mobile (modal) -->
      <div
        *ngIf="editing()"
        class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4"
        (click)="cancel()"
      >
        <div
          class="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          (click)="$event.stopPropagation()"
        >
          <div class="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h2 class="text-base font-semibold text-gray-900">
              {{ editedId() ? 'Modifier la dépense' : 'Nouvelle dépense' }}
            </h2>
            <button
              (click)="cancel()"
              class="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form (ngSubmit)="save()" #form="ngForm" class="p-4 space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Montant *</label>
              <input
                type="number"
                [(ngModel)]="draft.amount"
                name="amount"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                [(ngModel)]="draft.date"
                name="date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Catégorie *</label>
              <select
                [(ngModel)]="draft.category"
                name="category"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option *ngFor="let c of categories()" [value]="c">{{ c }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Type *</label>
              <select
                [(ngModel)]="draft.type"
                name="type"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="business">Business</option>
                <option value="personal">Personnel</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Note</label>
              <textarea
                [(ngModel)]="draft.note"
                name="note"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              ></textarea>
            </div>
            <div class="flex gap-2 pt-2">
              <button
                type="button"
                (click)="cancel()"
                class="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                [disabled]="form.invalid"
                class="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <!-- Liste des dépenses -->
        <div class="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          <div class="flex flex-col sm:flex-row gap-2 mb-3">
            <select
              [(ngModel)]="typeFilter"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Tout</option>
              <option value="business">Business</option>
              <option value="personal">Personnel</option>
            </select>
            <select
              [(ngModel)]="categoryFilter"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Catégorie</option>
              <option *ngFor="let c of categories()" [value]="c">{{ c }}</option>
            </select>
          </div>
          
          <!-- Liste mobile (cards) -->
          <div class="lg:hidden space-y-2">
            <div
              *ngFor="let e of filteredExpenses()"
              (click)="edit(e)"
              [class.bg-primary-50]="e.id === editedId()"
              class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors active:scale-[0.98]"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      {{ e.category }}
                    </span>
                    <span
                      [class.bg-blue-100]="e.type === 'business'"
                      [class.text-blue-700]="e.type === 'business'"
                      [class.bg-orange-100]="e.type === 'personal'"
                      [class.text-orange-700]="e.type === 'personal'"
                      class="px-2 py-0.5 rounded text-xs font-medium"
                    >
                      {{ e.type === 'business' ? 'Business' : 'Perso' }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-600 mt-0.5">{{ e.note || 'Sans note' }}</p>
                </div>
                <div class="text-right ml-2 flex-shrink-0">
                  <p class="text-sm font-bold text-gray-900">
                    {{ e.amount | currency: currency() : 'symbol-narrow' : '1.0-0' }}
                  </p>
                  <p class="text-xs text-gray-600">{{ e.date | date : 'shortDate' }}</p>
                </div>
              </div>
              <div class="flex justify-end">
                <button
                  (click)="delete(e); $event.stopPropagation()"
                  class="px-2 py-1 text-danger-600 hover:bg-danger-50 rounded text-xs font-medium transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
            <div *ngIf="filteredExpenses().length === 0" class="py-6 text-center text-gray-500 text-xs">
              Aucune dépense trouvée
            </div>
          </div>

          <!-- Tableau desktop -->
          <div class="hidden lg:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-2 px-3 text-xs font-semibold text-gray-600">Date</th>
                  <th class="text-left py-2 px-3 text-xs font-semibold text-gray-600">Catégorie</th>
                  <th class="text-left py-2 px-3 text-xs font-semibold text-gray-600">Type</th>
                  <th class="text-left py-2 px-3 text-xs font-semibold text-gray-600">Note</th>
                  <th class="text-right py-2 px-3 text-xs font-semibold text-gray-600">Montant</th>
                  <th class="text-right py-2 px-3 text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let e of filteredExpenses()"
                  (click)="edit(e)"
                  [class.bg-primary-50]="e.id === editedId()"
                  class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td class="py-2 px-3 text-gray-900">{{ e.date | date : 'shortDate' }}</td>
                  <td class="py-2 px-3">
                    <span class="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      {{ e.category }}
                    </span>
                  </td>
                  <td class="py-2 px-3">
                    <span
                      [class.bg-blue-100]="e.type === 'business'"
                      [class.text-blue-700]="e.type === 'business'"
                      [class.bg-orange-100]="e.type === 'personal'"
                      [class.text-orange-700]="e.type === 'personal'"
                      class="px-2 py-0.5 rounded text-xs font-medium"
                    >
                      {{ e.type === 'business' ? 'Business' : 'Perso' }}
                    </span>
                  </td>
                  <td class="py-2 px-3 text-xs text-gray-600">{{ e.note || '-' }}</td>
                  <td class="py-2 px-3 text-right font-medium text-gray-900">
                    {{ e.amount | currency: currency() : 'symbol-narrow' : '1.0-0' }}
                  </td>
                  <td class="py-2 px-3 text-right">
                    <button
                      (click)="delete(e); $event.stopPropagation()"
                      class="px-2 py-1 text-danger-600 hover:bg-danger-50 rounded text-xs font-medium transition-colors"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredExpenses().length === 0">
                  <td colspan="6" class="py-6 text-center text-gray-500 text-xs">Aucune dépense trouvée</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Formulaire desktop -->
        <div *ngIf="editing()" class="hidden lg:block lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 class="text-sm font-semibold text-gray-900 mb-3">
            {{ editedId() ? 'Modifier la dépense' : 'Nouvelle dépense' }}
          </h2>
          <form (ngSubmit)="save()" #form="ngForm" class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Montant *</label>
              <input
                type="number"
                [(ngModel)]="draft.amount"
                name="amount"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                [(ngModel)]="draft.date"
                name="date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Catégorie *</label>
              <select
                [(ngModel)]="draft.category"
                name="category"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option *ngFor="let c of categories()" [value]="c">{{ c }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Type *</label>
              <select
                [(ngModel)]="draft.type"
                name="type"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="business">Business</option>
                <option value="personal">Personnel</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Note</label>
              <textarea
                [(ngModel)]="draft.note"
                name="note"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              ></textarea>
            </div>
            <div class="flex gap-2 pt-2">
              <button
                type="button"
                (click)="cancel()"
                class="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                [disabled]="form.invalid"
                class="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesComponent {
  private readonly data = inject(AppDataService);

  readonly expenses = computed(() => this.data.expenses());
  readonly currency = computed(() => this.data.settings().currency);
  readonly categories = computed(() => this.data.settings().expenseCategories);

  typeFilter: 'business' | 'personal' | '' = '';
  categoryFilter = '';

  editing = signal(false);
  editedId = signal<string | null>(null);

  draft: {
    id?: string;
    amount: number | null;
    date: string | null;
    category: string | null;
    type: 'business' | 'personal';
    note?: string;
  } = this.emptyDraft();

  filteredExpenses = computed(() => {
    return this.expenses().filter(e => {
      if (this.typeFilter && e.type !== this.typeFilter) return false;
      if (this.categoryFilter && e.category !== this.categoryFilter) return false;
      return true;
    });
  });

  startCreate() {
    this.editedId.set(null);
    this.draft = this.emptyDraft();
    this.editing.set(true);
  }

  edit(e: Expense) {
    this.editedId.set(e.id);
    this.draft = {
      id: e.id,
      amount: e.amount,
      date: e.date,
      category: e.category,
      type: e.type,
      note: e.note,
    };
    this.editing.set(true);
  }

  delete(e: Expense) {
    if (confirm('Supprimer cette dépense ?')) {
      this.data.deleteExpense(e.id);
      if (this.editedId() === e.id) {
        this.cancel();
      }
    }
  }

  save() {
    if (!this.draft.amount || !this.draft.date || !this.draft.category) return;
    this.data.upsertExpense({
      id: this.draft.id,
      amount: this.draft.amount,
      date: this.draft.date,
      category: this.draft.category,
      type: this.draft.type,
      note: this.draft.note,
    });
    this.editing.set(false);
  }

  cancel() {
    this.editing.set(false);
    this.editedId.set(null);
  }

  private emptyDraft() {
    const today = new Date().toISOString().slice(0, 10);
    return {
      amount: null,
      date: today,
      category: this.categories()[0] ?? 'Autre',
      type: 'business' as const,
      note: '',
    };
  }
}
