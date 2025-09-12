import toast from 'react-hot-toast';

export class NotificationService {
  /**
   * Exibe uma notificação de sucesso
   */
  static success(message: string): void {
    toast.success(message);
  }

  /**
   * Exibe uma notificação de erro
   */
  static error(message: string): void {
    toast.error(message);
  }

  /**
   * Exibe uma notificação de aviso
   */
  static warning(message: string): void {
    toast(message, {
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#ffffff',
      },
    });
  }

  /**
   * Exibe uma notificação de informação
   */
  static info(message: string): void {
    toast(message, {
      icon: 'ℹ️',
      style: {
        background: '#3b82f6',
        color: '#ffffff',
      },
    });
  }

  /**
   * Exibe uma notificação de carregamento
   */
  static loading(message: string): string {
    return toast.loading(message);
  }

  /**
   * Atualiza uma notificação de carregamento para sucesso
   */
  static updateSuccess(toastId: string, message: string): void {
    toast.success(message, { id: toastId });
  }

  /**
   * Atualiza uma notificação de carregamento para erro
   */
  static updateError(toastId: string, message: string): void {
    toast.error(message, { id: toastId });
  }

  /**
   * Remove uma notificação específica
   */
  static dismiss(toastId: string): void {
    toast.dismiss(toastId);
  }

  /**
   * Remove todas as notificações
   */
  static dismissAll(): void {
    toast.dismiss();
  }
}
