import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppDataService } from '../../core/app-data.service';

@Component({
  standalone: true,
  selector: 'app-settings-page',
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p class="text-sm text-gray-600 mt-1">Ratios 40/40/20, devise et catégories de dépenses.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Devise -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Devise</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Devise principale</label>
              <input
                type="text"
                [(ngModel)]="currencyDraft"
                name="currency"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <button
              (click)="saveCurrency()"
              class="w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </div>

        <!-- Ratios -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Ratios 40 / 40 / 20</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Vivre (%)</label>
                <input
                  type="number"
                  [(ngModel)]="liveDraft"
                  name="live"
                  min="0"
                  max="100"
                  class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Business (%)</label>
                <input
                  type="number"
                  [(ngModel)]="businessDraft"
                  name="business"
                  min="0"
                  max="100"
                  class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Épargne (%)</label>
                <input
                  type="number"
                  [(ngModel)]="saveDraft"
                  name="save"
                  min="0"
                  max="100"
                  class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <p class="text-xs text-gray-600">
              La somme doit faire 100%. Actuel : <span [class.text-danger-600]="totalRatio !== 100" [class.text-success-600]="totalRatio === 100" class="font-semibold">{{ totalRatio }}%</span>
            </p>
            <button
              (click)="saveRatios()"
              [disabled]="totalRatio !== 100"
              class="w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enregistrer
            </button>
          </div>
        </div>

        <!-- Catégories -->
        <div class="md:col-span-2 bg-white rounded-2xl shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Catégories de dépenses</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Liste (séparée par des virgules)</label>
              <textarea
                [(ngModel)]="categoriesDraft"
                name="categories"
                rows="4"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              ></textarea>
            </div>
            <button
              (click)="saveCategories()"
              class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly data = inject(AppDataService);

  readonly settings = computed(() => this.data.settings());

  currencyDraft = this.settings().currency;
  liveDraft = this.settings().ratios.live * 100;
  businessDraft = this.settings().ratios.business * 100;
  saveDraft = this.settings().ratios.save * 100;
  categoriesDraft = this.settings().expenseCategories.join(', ');

  get totalRatio(): number {
    return Math.round((this.liveDraft + this.businessDraft + this.saveDraft) * 10) / 10;
  }

  saveCurrency() {
    if (!this.currencyDraft.trim()) return;
    this.data.updateCurrency(this.currencyDraft.trim());
  }

  saveRatios() {
    if (this.totalRatio !== 100) return;
    this.data.updateRatios({
      live: this.liveDraft / 100,
      business: this.businessDraft / 100,
      save: this.saveDraft / 100,
    });
  }

  saveCategories() {
    const parts = this.categoriesDraft
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);
    if (!parts.length) return;
    this.data.updateExpenseCategories(parts);
  }
}
