import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppDataService } from '../../core/app-data.service';
import { Client, ClientType } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-clients-page',
  imports: [NgFor, NgIf, FormsModule, CurrencyPipe],
  template: `
    <div class="space-y-3 sm:space-y-4">
      <!-- Header compact -->
      <div class="flex items-center justify-between gap-2">
        <div class="min-w-0 flex-1">
          <h1 class="text-base sm:text-lg font-semibold text-gray-900">Clients</h1>
          <p class="text-xs text-gray-600 mt-0.5 hidden sm:block">Gère toutes tes pâtisseries, instituts, restos…</p>
        </div>
        <button
          (click)="startCreate()"
          class="px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="hidden sm:inline">Nouveau client</span>
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
              {{ editedId() ? 'Modifier le client' : 'Nouveau client' }}
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
              <label class="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                [(ngModel)]="draft.name"
                name="name"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                [(ngModel)]="draft.type"
                name="type"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="patisserie">Pâtisserie</option>
                <option value="institut">Institut</option>
                <option value="restaurant">Restaurant</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                [(ngModel)]="draft.phone"
                name="phone"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Tarif par séance</label>
              <input
                type="number"
                [(ngModel)]="draft.defaultFee"
                name="defaultFee"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                [(ngModel)]="draft.notes"
                name="notes"
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
        <!-- Liste des clients -->
        <div class="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          <div class="mb-3">
            <input
              type="text"
              [(ngModel)]="search"
              placeholder="Rechercher un client…"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <!-- Liste mobile (cards) -->
          <div class="lg:hidden space-y-2">
            <div
              *ngFor="let client of filteredClients()"
              (click)="edit(client)"
              [class.bg-primary-50]="client.id === editedId()"
              class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1 min-w-0">
                  <h3 class="font-medium text-gray-900 truncate">{{ client.name }}</h3>
                  <p class="text-xs text-gray-600 mt-0.5">{{ client.phone || 'Pas de téléphone' }}</p>
                </div>
                <span class="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium ml-2 flex-shrink-0">
                  {{ client.type }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-600">
                  {{ client.defaultFee ? (client.defaultFee | currency: currency() : 'symbol-narrow' : '1.0-0') : 'Pas de tarif' }}
                </span>
                <button
                  (click)="delete(client); $event.stopPropagation()"
                  class="px-2 py-1 text-danger-600 hover:bg-danger-50 rounded text-xs font-medium transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
            <div *ngIf="filteredClients().length === 0" class="py-6 text-center text-gray-500 text-xs">
              Aucun client trouvé
            </div>
          </div>
          <!-- Tableau desktop -->
          <div class="hidden lg:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-2 px-3 text-xs font-semibold text-gray-600">Nom</th>
                  <th class="text-left py-2 px-3 text-xs font-semibold text-gray-600">Type</th>
                  <th class="text-left py-2 px-3 text-xs font-semibold text-gray-600">Téléphone</th>
                  <th class="text-left py-2 px-3 text-xs font-semibold text-gray-600">Tarif</th>
                  <th class="text-right py-2 px-3 text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let client of filteredClients()"
                  (click)="edit(client)"
                  [class.bg-primary-50]="client.id === editedId()"
                  class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td class="py-2 px-3 font-medium text-gray-900">{{ client.name }}</td>
                  <td class="py-2 px-3">
                    <span class="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                      {{ client.type }}
                    </span>
                  </td>
                  <td class="py-2 px-3 text-xs text-gray-600">{{ client.phone || '-' }}</td>
                  <td class="py-2 px-3 text-xs text-gray-900 font-medium">
                    {{ client.defaultFee ? (client.defaultFee | currency: currency() : 'symbol-narrow' : '1.0-0') : '-' }}
                  </td>
                  <td class="py-2 px-3 text-right">
                    <button
                      (click)="delete(client); $event.stopPropagation()"
                      class="px-2 py-1 text-danger-600 hover:bg-danger-50 rounded text-xs font-medium transition-colors"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredClients().length === 0">
                  <td colspan="5" class="py-6 text-center text-gray-500 text-xs">
                    Aucun client trouvé
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Formulaire desktop -->
        <div *ngIf="editing()" class="hidden lg:block lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 class="text-sm font-semibold text-gray-900 mb-3">
            {{ editedId() ? 'Modifier le client' : 'Nouveau client' }}
          </h2>
          <form (ngSubmit)="save()" #form="ngForm" class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                [(ngModel)]="draft.name"
                name="name"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                [(ngModel)]="draft.type"
                name="type"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="patisserie">Pâtisserie</option>
                <option value="institut">Institut</option>
                <option value="restaurant">Restaurant</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                [(ngModel)]="draft.phone"
                name="phone"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Tarif par séance</label>
              <input
                type="number"
                [(ngModel)]="draft.defaultFee"
                name="defaultFee"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                [(ngModel)]="draft.notes"
                name="notes"
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
export class ClientsComponent {
  private readonly data = inject(AppDataService);

  readonly clients = computed(() => this.data.clients());
  readonly currency = computed(() => this.data.settings().currency);

  search = '';
  editing = signal(false);
  editedId = signal<string | null>(null);
  draft: {
    id?: string;
    name: string;
    type: ClientType;
    phone?: string;
    defaultFee?: number;
    notes?: string;
  } = this.emptyDraft();

  filteredClients = computed(() => {
    const term = this.search.toLowerCase().trim();
    if (!term) return this.clients();
    return this.clients().filter(c => c.name.toLowerCase().includes(term));
  });

  startCreate() {
    this.editedId.set(null);
    this.draft = this.emptyDraft();
    this.editing.set(true);
  }

  edit(client: Client) {
    this.editedId.set(client.id);
    this.draft = {
      id: client.id,
      name: client.name,
      type: client.type,
      phone: client.phone,
      defaultFee: client.defaultFee,
      notes: client.notes,
    };
    this.editing.set(true);
  }

  delete(client: Client) {
    if (confirm(`Supprimer ${client.name} ?`)) {
      this.data.deleteClient(client.id);
      if (this.editedId() === client.id) {
        this.cancel();
      }
    }
  }

  save() {
    this.data.upsertClient({
      id: this.draft.id,
      name: this.draft.name,
      type: this.draft.type,
      phone: this.draft.phone,
      defaultFee: this.draft.defaultFee,
      notes: this.draft.notes,
    });
    this.editing.set(false);
  }

  cancel() {
    this.editing.set(false);
    this.editedId.set(null);
  }

  private emptyDraft() {
    return {
      name: '',
      type: 'autre' as ClientType,
      phone: '',
      defaultFee: undefined,
      notes: '',
    };
  }
}
