import { Component, type ReactNode } from 'react';

// Muestra el error en pantalla en vez de dejar la vista en blanco.
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: '' };

  static getDerivedStateFromError(e: unknown): { error: string } {
    return { error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }

  componentDidCatch(): void {}

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="glass rounded-3xl p-6 text-sm">
          <p className="font-extrabold text-red-500">La vista no pudo cargarse</p>
          <p className="mt-1 break-all font-mono text-xs">{this.state.error}</p>
          <p className="mt-2 text-xs opacity-70">Toma captura de este mensaje y compártelo para corregirlo.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
