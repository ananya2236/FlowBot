import { resolveTemplate } from '@/lib/blocks';

export class VariableStore {
  private variables: Record<string, string>;

  constructor(initialVariables: Record<string, unknown> = {}) {
    this.variables = {};
    this.merge(initialVariables);
  }

  get(name: string) {
    return this.variables[name] ?? '';
  }

  set(name: string, value: unknown) {
    if (!name.trim()) return;
    this.variables[name] = stringifyVariable(value);
  }

  merge(values: Record<string, unknown>) {
    Object.entries(values).forEach(([key, value]) => this.set(key, value));
  }

  resolve(value: string) {
    return resolveTemplate(value, this.variables);
  }

  all() {
    return { ...this.variables };
  }
}

function stringifyVariable(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null || typeof value === 'undefined') return '';
  return JSON.stringify(value);
}
