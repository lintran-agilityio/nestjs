// Car
interface Car {
  drive(): void;
  color(): void;
};

export class Sedan implements Car {
  drive(): void {
    console.log("Driving a Sedan car");
  };

  color(): void {
    console.log("Sedan color is white");
  }
};

export class SUV implements Car {
  drive(): void {
    console.log("Driving an SUV car");
  }

  color(): void {
    console.log("SUV color is black");
  }
};

// Notification
export interface Notification {
  notify(): void;
};

export class EmailNotification implements Notification {
  notify() : void {
    console.log("Sending email notification");
  }
};

export class SMSNotification implements Notification {
  notify(): void {
    console.log("Sending SMS notification");
  }
};

export class PushNotification implements Notification {
  notify(): void {
    console.log("Sending push notification");
  }
};
