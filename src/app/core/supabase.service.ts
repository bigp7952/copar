import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  // Auth helpers
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  // Clients
  async getClients() {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      // Si la table n'existe pas encore, retourner un tableau vide
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Table clients n\'existe pas encore. Exécutez le script SQL dans Supabase.');
        return [];
      }
      throw error;
    }
    return data || [];
  }

  async upsertClient(client: any) {
    const { data, error } = await this.supabase
      .from('clients')
      .upsert(client, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        throw new Error('Table clients n\'existe pas. Exécutez le script SQL dans Supabase.');
      }
      throw error;
    }
    return data;
  }

  async deleteClient(id: string) {
    const { error } = await this.supabase
      .from('clients')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // PaymentTargets
  async getPaymentTargets() {
    const { data, error } = await this.supabase
      .from('payment_targets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Table payment_targets n\'existe pas encore.');
        return [];
      }
      throw error;
    }
    return data || [];
  }

  async createPaymentTarget(target: any) {
    const { data, error } = await this.supabase
      .from('payment_targets')
      .insert(target)
      .select()
      .single();
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        throw new Error('Table payment_targets n\'existe pas. Exécutez le script SQL dans Supabase.');
      }
      throw error;
    }
    return data;
  }

  async updatePaymentTarget(id: string, updates: any) {
    const { data, error } = await this.supabase
      .from('payment_targets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // PaymentParts
  async getPaymentParts() {
    const { data, error } = await this.supabase
      .from('payment_parts')
      .select('*')
      .order('date', { ascending: false });
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Table payment_parts n\'existe pas encore.');
        return [];
      }
      throw error;
    }
    return data || [];
  }

  async addPaymentPart(part: any) {
    const { data, error } = await this.supabase
      .from('payment_parts')
      .insert(part)
      .select()
      .single();
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        throw new Error('Table payment_parts n\'existe pas. Exécutez le script SQL dans Supabase.');
      }
      throw error;
    }
    return data;
  }

  // Expenses
  async getExpenses() {
    const { data, error } = await this.supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Table expenses n\'existe pas encore.');
        return [];
      }
      throw error;
    }
    return data || [];
  }

  async upsertExpense(expense: any) {
    const { data, error } = await this.supabase
      .from('expenses')
      .upsert(expense, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteExpense(id: string) {
    const { error } = await this.supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // Feedback
  async getFeedbacks() {
    const { data, error } = await this.supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Table feedbacks n\'existe pas encore.');
        return [];
      }
      throw error;
    }
    return data || [];
  }

  async createFeedback(feedback: any) {
    const { data, error } = await this.supabase
      .from('feedbacks')
      .insert(feedback)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateFeedback(token: string, updates: any) {
    const { data, error } = await this.supabase
      .from('feedbacks')
      .update(updates)
      .eq('token', token)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Settings
  async getSettings() {
    const { data, error } = await this.supabase
      .from('settings')
      .select('*')
      .eq('id', 'default')
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data || null;
  }

  async upsertSettings(settings: any) {
    const { data, error } = await this.supabase
      .from('settings')
      .upsert(settings, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Other Income (revenus non liés à des clients)
  async getOtherIncome() {
    const { data, error } = await this.supabase
      .from('other_income')
      .select('*')
      .order('date', { ascending: false });
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Table other_income n\'existe pas encore.');
        return [];
      }
      throw error;
    }
    return data || [];
  }

  async addOtherIncome(income: any) {
    const { data, error } = await this.supabase
      .from('other_income')
      .insert(income)
      .select()
      .single();
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        throw new Error('Table other_income n\'existe pas. Exécutez le script SQL dans Supabase.');
      }
      throw error;
    }
    return data;
  }

  async updateOtherIncome(id: string, updates: any) {
    const { data, error } = await this.supabase
      .from('other_income')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteOtherIncome(id: string) {
    const { error } = await this.supabase
      .from('other_income')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}

