declare module "react-datepicker" {
  import type { ComponentType, ReactElement } from "react";

  export type ReactDatePickerProps = {
    customInput?: ReactElement;
    dateFormat?: string;
    locale?: string;
    selected?: Date | null;
    onChange?: (date: Date | null) => void;
  };

  const DatePicker: ComponentType<ReactDatePickerProps>;

  export function registerLocale(localeName: string, localeData: unknown): void;

  export default DatePicker;
}

declare module "react-datepicker/dist/react-datepicker.css";
