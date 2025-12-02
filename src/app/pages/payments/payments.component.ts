import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppDataService } from '../../core/app-data.service';
import { PaymentTarget } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-payments-page',
  imports: [NgFor, NgIf, CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="space-y-3 sm:space-y-4">
      <!-- Header compact -->
      <div class="flex items-center justify-between gap-2">
        <div class="min-w-0 flex-1">
          <h1 class="text-base sm:text-lg font-semibold text-gray-900">Paiements & séances</h1>
          <p class="text-xs text-gray-600 mt-0.5 hidden sm:block">Suis tous les paiements prévus et les versements partiels.</p>
        </div>
        <button
          (click)="startCreateTarget()"
          class="px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="hidden sm:inline">Nouvelle séance</span>
          <span class="sm:hidden">Nouveau</span>
        </button>
      </div>

      <!-- Vue mobile: Liste ou Détails -->
      <div class="lg:hidden">
        <!-- Liste des séances (mobile) -->
        <div *ngIf="!selectedTarget()" class="space-y-2">
          <div
            *ngFor="let target of targetsWithComputed()"
            (click)="selectTarget(target.id)"
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer transition-all active:scale-[0.98]"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ target.title }}</p>
                <p class="text-xs text-gray-600 truncate mt-0.5">{{ target.clientName }}</p>
              </div>
              <p class="text-sm font-bold text-gray-900 ml-2 flex-shrink-0">
                {{ target.totalAmount | currency: currency() : 'symbol-narrow' : '1.0-0' }}
              </p>
            </div>
            <div class="mb-2">
              <span
                [class.bg-green-100]="target.status === 'paid'"
                [class.text-success-700]="target.status === 'paid'"
                [class.bg-yellow-100]="target.status === 'partial'"
                [class.text-yellow-700]="target.status === 'partial'"
                [class.bg-gray-100]="target.status === 'pending'"
                [class.text-gray-700]="target.status === 'pending'"
                class="px-2 py-0.5 rounded text-xs font-medium"
              >
                {{ labelForStatus(target.status) }}
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-1.5 mb-1">
              <div
                [class.bg-success-500]="target.status === 'paid'"
                [class.bg-yellow-500]="target.status === 'partial'"
                [class.bg-gray-400]="target.status === 'pending'"
                class="h-1.5 rounded-full transition-all"
                [style.width.%]="target.paidPercent"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-gray-600 mt-1">
              <span>Reçu: {{ target.paidAmount | currency: currency() : 'symbol-narrow' : '1.0-0' }}</span>
              <span>Reste: {{ target.remainingAmount | currency: currency() : 'symbol-narrow' : '1.0-0' }}</span>
            </div>
          </div>
          <div *ngIf="targetsWithComputed().length === 0" class="text-center py-8 text-gray-500 text-xs">
            Aucune séance
          </div>
        </div>

        <!-- Détails séance (mobile) -->
        <div *ngIf="selectedTarget() as t" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <!-- Bouton retour -->
          <button
            (click)="selectTarget(null)"
            class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm font-medium"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>

          <div class="mb-4">
            <h3 class="text-base font-semibold text-gray-900 mb-1">{{ t.title }}</h3>
            <p class="text-xs text-gray-600">{{ t.clientName }} • {{ t.totalAmount | currency: currency() : 'symbol-narrow' : '1.0-0' }}</p>
          </div>

          <!-- Stats compactes -->
          <div class="grid grid-cols-3 gap-2 mb-4">
            <div class="bg-gray-50 p-2 rounded-lg">
              <div class="text-xs font-medium text-gray-600 mb-0.5">Total</div>
              <div class="text-sm font-bold text-gray-900 truncate">
                {{ t.totalAmount | currency: currency() : 'symbol-narrow' : '1.0-0' }}
              </div>
            </div>
            <div class="bg-success-50 p-2 rounded-lg">
              <div class="text-xs font-medium text-success-700 mb-0.5">Reçu</div>
              <div class="text-sm font-bold text-success-900 truncate">
                {{ t.paidAmount | currency: currency() : 'symbol-narrow' : '1.0-0' }}
              </div>
            </div>
            <div class="bg-danger-50 p-2 rounded-lg">
              <div class="text-xs font-medium text-danger-700 mb-0.5">Reste</div>
              <div class="text-sm font-bold text-danger-900 truncate">
                {{ t.remainingAmount | currency: currency() : 'symbol-narrow' : '1.0-0' }}
              </div>
            </div>
          </div>

          <!-- Versements -->
          <section class="mb-4">
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-sm font-semibold text-gray-900">Versements</h4>
              <button
                *ngIf="!addingPart()"
                (click)="startAddPart()"
                class="px-2 py-1 text-primary-600 hover:bg-primary-50 rounded text-xs font-medium transition-colors"
              >
                + Ajouter
              </button>
            </div>
            <div class="space-y-2">
              <div *ngFor="let p of t.parts" class="p-2 bg-gray-50 rounded-lg">
                <div class="flex justify-between items-start mb-1">
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-gray-900">{{ p.date | date : 'shortDate' }}</p>
                    <p class="text-xs text-gray-600 mt-0.5">{{ p.note || 'Sans note' }}</p>
                  </div>
                  <p class="text-sm font-bold text-gray-900 ml-2 flex-shrink-0">
                    {{ p.amount | currency: currency() : 'symbol-narrow' : '1.0-0' }}
                  </p>
                </div>
                <p class="text-xs text-gray-600">
                  V {{ p.splitLive | currency: currency() : 'symbol-narrow' : '1.0-0' }} / B {{ p.splitBusiness | currency: currency() : 'symbol-narrow' : '1.0-0' }} / É {{ p.splitSave | currency: currency() : 'symbol-narrow' : '1.0-0' }}
                </p>
              </div>
              <div *ngIf="t.parts.length === 0" class="text-center py-4 text-gray-500 text-xs">
                Aucun versement
              </div>
            </div>
          </section>

          <!-- Formulaire ajout versement -->
          <section *ngIf="addingPart()" class="pt-4 border-t border-gray-200">
            <h4 class="text-sm font-semibold text-gray-900 mb-3">Nouveau versement</h4>
            <form (ngSubmit)="savePart()" #partForm="ngForm" class="space-y-3">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Montant *</label>
                  <input
                    type="number"
                    [(ngModel)]="partDraft.amount"
                    name="amount"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    [(ngModel)]="partDraft.date"
                    name="date"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  [(ngModel)]="partDraft.note"
                  name="note"
                  rows="2"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                ></textarea>
              </div>
              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  (click)="cancelPart()"
                  class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  [disabled]="partForm.invalid"
                  class="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      <!-- Vue desktop: Colonnes côte à côte -->
      <div class="hidden lg:grid lg:grid-cols-3 gap-4">
        <!-- Liste des séances -->
        <div class="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 class="text-sm font-semibold text-gray-900 mb-3">Séances</h3>
          <div class="space-y-2 max-h-[600px] overflow-y-auto">
            <div
              *ngFor="let target of targetsWithComputed()"
              (click)="selectTarget(target.id)"
              [class.bg-primary-50]="target.id === selectedTargetId()"
              [class.border-primary-500]="target.id === selectedTargetId()"
              class="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-all"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ target.title }}</p>
                  <p class="text-xs text-gray-600 truncate">{{ target.clientName }}</p>
                </div>
                <p class="text-sm font-bold text-gray-900 ml-2">
                  {{ target.totalAmount | currency: currency() : 'symbol-narrow' : '1.0-0' }}
                </p>
              </div>
              <div class="mb-2">
                <span
                  [class.bg-green-100]="target.status === 'paid'"
                  [class.text-success-700]="target.status === 'paid'"
                  [class.bg-yellow-100]="target.status === 'partial'"
                  [class.text-yellow-700]="target.status === 'partial'"
                  [class.bg-gray-100]="target.status === 'pending'"
                  [class.text-gray-700]="target.status === 'pending'"
                  class="px-2 py-0.5 rounded text-xs font-medium"
                >
                  {{ labelForStatus(target.status) }}
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                <div
                  [class.bg-success-500]="target.status === 'paid'"
                  [class.bg-yellow-500]="target.status === 'partial'"
                  [class.bg-gray-400]="target.status === 'pending'"
                  class="h-1.5 rounded-full transition-all"
                  [style.width.%]="target.paidPercent"
                ></div>
              </div>
              <div class="flex justify-between text-xs text-gray-600">
                <span>Reçu: {{ target.paidAmount | currency: currency() : 'symbol-narrow' : '1.0-0' }}</span>
                <span>Reste: {{ target.remainingAmount | currency: currency() : 'symbol-narrow' : '1.0-0' }}</span>
              </div>
            </div>
            <div *ngIf="targetsWithComputed().length === 0" class="text-center py-6 text-gray-500 text-xs">
              Aucune séance
            </div>
          </div>
        </div>

        <!-- Détails et versements -->
        <div *ngIf="selectedTarget() as t" class="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-semibold text-gray-900">Détail séance</h3>
              <p class="text-xs text-gray-600 mt-0.5">{{ t.clientName }} • {{ t.totalAmount | currency: currency() : 'symbol-narrow' : '1.0-0' }}</p>
            </div>
            <button
              (click)="startCreateTarget(t.clientId)"
              class="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-medium transition-colors"
            >
              Dupliquer
            </button>
          </div>

          <!-- Stats compactes -->
          <div class="grid grid-cols-3 gap-3 mb-4">
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-xs font-medium text-gray-600 mb-1">Total</div>
              <div class="text-sm font-bold text-gray-900">
                {{ t.totalAmount | currency: currency() : 'symbol-narrow' : '1.0-0' }}
              </div>
            </div>
            <div class="bg-success-50 p-3 rounded-lg">
              <div class="text-xs font-medium text-success-700 mb-1">Reçu</div>
              <div class="text-sm font-bold text-success-900">
                {{ t.paidAmount | currency: currency() : 'symbol-narrow' : '1.0-0' }}
              </div>
            </div>
            <div class="bg-danger-50 p-3 rounded-lg">
              <div class="text-xs font-medium text-danger-700 mb-1">Reste</div>
              <div class="text-sm font-bold text-danger-900">
                {{ t.remainingAmount | currency: currency() : 'symbol-narrow' : '1.0-0' }}
              </div>
            </div>
          </div>

          <!-- Versements -->
          <section class="mb-4">
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-sm font-semibold text-gray-900">Versements</h4>
              <button
                *ngIf="!addingPart()"
                (click)="startAddPart()"
                class="px-3 py-1.5 text-primary-600 hover:bg-primary-50 rounded-lg text-xs font-medium transition-colors"
              >
                + Ajouter
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200">
                    <th class="text-left py-2 px-3 text-xs font-semibold text-gray-600">Date</th>
                    <th class="text-left py-2 px-3 text-xs font-semibold text-gray-600">Note</th>
                    <th class="text-right py-2 px-3 text-xs font-semibold text-gray-600">Montant</th>
                    <th class="text-left py-2 px-3 text-xs font-semibold text-gray-600">40/40/20</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of t.parts" class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="py-2 px-3 text-gray-900">{{ p.date | date : 'shortDate' }}</td>
                    <td class="py-2 px-3 text-gray-600">{{ p.note || '-' }}</td>
                    <td class="py-2 px-3 text-right font-medium text-gray-900">
                      {{ p.amount | currency: currency() : 'symbol-narrow' : '1.0-0' }}
                    </td>
                    <td class="py-2 px-3 text-xs text-gray-600">
                      V {{ p.splitLive | currency: currency() : 'symbol-narrow' : '1.0-0' }} / B {{ p.splitBusiness | currency: currency() : 'symbol-narrow' : '1.0-0' }} / É {{ p.splitSave | currency: currency() : 'symbol-narrow' : '1.0-0' }}
                    </td>
                  </tr>
                  <tr *ngIf="t.parts.length === 0">
                    <td colspan="4" class="py-4 text-center text-gray-500 text-xs">Aucun versement</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Formulaire ajout versement -->
          <section *ngIf="addingPart()" class="pt-4 border-t border-gray-200">
            <h4 class="text-sm font-semibold text-gray-900 mb-3">Nouveau versement</h4>
            <form (ngSubmit)="savePart()" #partForm="ngForm" class="space-y-3">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Montant *</label>
                  <input
                    type="number"
                    [(ngModel)]="partDraft.amount"
                    name="amount"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    [(ngModel)]="partDraft.date"
                    name="date"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  [(ngModel)]="partDraft.note"
                  name="note"
                  rows="2"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                ></textarea>
              </div>
              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  (click)="cancelPart()"
                  class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  [disabled]="partForm.invalid"
                  class="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </section>
        </div>

        <!-- Message si aucune séance sélectionnée -->
        <div *ngIf="!selectedTarget()" class="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex items-center justify-center">
          <div class="text-center text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="text-sm font-semibold mb-1">Sélectionne une séance</h3>
            <p class="text-xs">Ou crée ta première séance avec le bouton "Nouvelle séance".</p>
          </div>
        </div>
      </div>

      <!-- Formulaire nouvelle séance -->
      <div *ngIf="creatingTarget()" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">Nouvelle séance</h3>
        <form (ngSubmit)="saveTarget()" #targetForm="ngForm" class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Client *</label>
              <select
                [(ngModel)]="targetDraft.clientId"
                name="clientId"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Sélectionner...</option>
                <option *ngFor="let c of clients()" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Titre séance *</label>
              <input
                type="text"
                [(ngModel)]="targetDraft.title"
                name="title"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Montant total *</label>
              <input
                type="number"
                [(ngModel)]="targetDraft.totalAmount"
                name="totalAmount"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Date prévue</label>
              <input
                type="date"
                [(ngModel)]="targetDraft.dueDate"
                name="dueDate"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              (click)="cancelTarget()"
              class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              [disabled]="targetForm.invalid"
              class="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsComponent {
  private readonly data = inject(AppDataService);

  readonly clients = computed(() => this.data.clients());
  readonly currency = computed(() => this.data.settings().currency);

  readonly targetsWithComputed = computed(() => {
    const targets = this.data.paymentTargets();
    const parts = this.data.paymentParts();
    const clients = this.clients();
    return targets.map(t => {
      const tParts = parts.filter(p => p.paymentTargetId === t.id);
      const paidAmount = tParts.reduce((acc, p) => acc + p.amount, 0);
      const remainingAmount = Math.max(0, t.totalAmount - paidAmount);
      const paidPercent = Math.min(100, (paidAmount / (t.totalAmount || 1)) * 100);
      const clientName = clients.find(c => c.id === t.clientId)?.name ?? 'Client';
      return { ...t, clientName, paidAmount, remainingAmount, paidPercent, parts: tParts };
    });
  });

  selectedTargetId = signal<string | null>(null);
  creatingTarget = signal(false);
  addingPart = signal(false);

  targetDraft: {
    clientId: string | null;
    title: string;
    totalAmount: number | null;
    dueDate: string | null;
  } = this.emptyTargetDraft();

  partDraft: {
    amount: number | null;
    date: string | null;
    note?: string;
  } = this.emptyPartDraft();

  selectedTarget = computed(() =>
    this.targetsWithComputed().find(t => t.id === this.selectedTargetId()) ?? null,
  );

  labelForStatus(status: PaymentTarget['status']): string {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'partial':
        return 'Partiel';
      case 'paid':
        return 'Payé';
      default:
        return status;
    }
  }

  selectTarget(id: string | null) {
    this.selectedTargetId.set(id);
    this.addingPart.set(false);
  }

  startCreateTarget(prefillClientId?: string) {
    this.creatingTarget.set(true);
    this.targetDraft = this.emptyTargetDraft();
    if (prefillClientId) {
      this.targetDraft.clientId = prefillClientId;
    }
  }

  cancelTarget() {
    this.creatingTarget.set(false);
  }

  saveTarget() {
    if (!this.targetDraft.clientId || !this.targetDraft.totalAmount) return;
    this.data.createPaymentTarget({
      clientId: this.targetDraft.clientId,
      title: this.targetDraft.title || 'Séance',
      totalAmount: this.targetDraft.totalAmount,
      dueDate: this.targetDraft.dueDate ?? undefined,
    });
    this.creatingTarget.set(false);
  }

  startAddPart() {
    if (!this.selectedTargetId()) return;
    this.partDraft = this.emptyPartDraft();
    this.addingPart.set(true);
  }

  cancelPart() {
    this.addingPart.set(false);
  }

  savePart() {
    const targetId = this.selectedTargetId();
    if (!targetId || !this.partDraft.amount || !this.partDraft.date) return;
    this.data.addPaymentPart(targetId, this.partDraft.amount, this.partDraft.date, this.partDraft.note);
    this.addingPart.set(false);
  }

  private emptyTargetDraft() {
    return {
      clientId: null,
      title: '',
      totalAmount: null,
      dueDate: null,
    };
  }

  private emptyPartDraft() {
    const today = new Date().toISOString().slice(0, 10);
    return {
      amount: null,
      date: today,
      note: '',
    };
  }
}
