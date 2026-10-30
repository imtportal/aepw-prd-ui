import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from './toast.model';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  private nextId = 1;

  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  private readonly maxToasts = 3;

  show(message: string, type: ToastType = 'success', duration = 5000): void {
    const normalizedMessage = message.trim();

    if (!normalizedMessage) {
      return;
    }

    this.toasts.update((currentToasts) => {
      // Prevent duplicate active toasts
      const duplicate = currentToasts.some(
        (toast) => toast.message === normalizedMessage && toast.type === type,
      );

      if (duplicate) {
        return currentToasts;
      }

      const toast: Toast = {
        id: this.nextId++,
        message: normalizedMessage,
        type,
      };

      // New toast goes to the top
      const updatedToasts = [toast, ...currentToasts];

      // Keep only the latest N toasts
      if (updatedToasts.length > this.maxToasts) {
        const removedToasts = updatedToasts.slice(this.maxToasts);

        removedToasts.forEach((oldToast) => {
          this.clearTimer(oldToast.id);
        });

        return updatedToasts.slice(0, this.maxToasts);
      }

      return updatedToasts;
    });

    // Get the toast that was just created
    const createdToast = this.toasts().find(
      (toast) => toast.message === normalizedMessage && toast.type === type,
    );

    if (!createdToast) {
      return;
    }

    const timer = setTimeout(() => {
      this.remove(createdToast.id);
    }, duration);

    this.timers.set(createdToast.id, timer);
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  remove(id: number): void {
    this.clearTimer(id);

    this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);

    if (!timer) {
      return;
    }

    clearTimeout(timer);
    this.timers.delete(id);
  }
}
