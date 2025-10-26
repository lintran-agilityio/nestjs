import { Button, Checkbox, GUIFactory } from './interface';


class MacButton implements Button {
  render(): void {
    console.log("Rendering Mac Button");
  }
};

class WindowsButton implements Button {
  render(): void {
    console.log("Rendering Windows Button");
  }
};

class MacCheckbox implements Checkbox {
  render(): void {
    console.log("Rendering Mac Checkbox");
  }
}

class WindowsCheckbox implements Checkbox {
  render(): void {
    console.log("Rendering Windows Checkbox");
  }
}

export class MacFactory implements GUIFactory {
  createButton(): Button {
    return new MacButton();
  }
  createCheckbox(): Checkbox {
    return new MacCheckbox();
  }
}

export class WindowsFactory implements GUIFactory {
  createButton(): Button {
    return new WindowsButton();
  }
  createCheckbox(): Checkbox {
    return new WindowsCheckbox();
  }
};

export function abstractRender(factory: GUIFactory) {
  const button = factory.createButton();
  const checkbox = factory.createCheckbox();

  button.render();
  checkbox.render();
};
