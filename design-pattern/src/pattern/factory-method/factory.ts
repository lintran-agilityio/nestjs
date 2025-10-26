// Car
import { Sedan, SUV } from './interface';

// Notification
import { EmailNotification, SMSNotification, PushNotification, Notification } from './interface';

export abstract class CarFactory {
  abstract createCar(): Sedan | SUV;
};

export class SedanFactory extends CarFactory {
  createCar(): Sedan {
    return new Sedan();
  }
}

export class SUVFactory extends CarFactory {
  createCar(): SUV {
    return new SUV();
  }
};

// Notification
export abstract class NotificationFactory {
  abstract createNotification(): Notification;
};

export class EmailNotifyFactory extends NotificationFactory {
  createNotification(): Notification {
    return new EmailNotification();
  }
};

export class SMSNotifyFactory extends NotificationFactory {
  createNotification(): Notification {
    return new SMSNotification();
  }
};

export class PushNotifyFactory extends NotificationFactory {
  createNotification(): Notification {
    return new PushNotification();
  }
};
