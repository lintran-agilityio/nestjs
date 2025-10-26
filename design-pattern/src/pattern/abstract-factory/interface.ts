export interface Button {
  render(): void;
};

export interface Checkbox {
  render(): void;
};

export interface GUIFactory {
  createButton(): Button;
  createCheckbox(): Checkbox;
};
