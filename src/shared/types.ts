export type GeneratorId =
  | "name"
  | "first-name"
  | "last-name"
  | "cpf"
  | "cnpj"
  | "cep"
  | "state"
  | "city"
  | "email"
  | "phone"
  | "uuid"
  | "password"
  | "datetime"
  | "date"
  | "text"
  | "credit-card"
  | "person"
  | "company"
  | "address"
  | "edge-cases"
  | "api-response"
  | "api-error"
  | "url"
  | "ip"
  | "currency"
  | "percentage"
  | "boolean"
  | "integer"
  | "hex-color"
  | "timestamp";

export type GeneratorCategory = "Pessoal" | "Contato" | "Técnico" | "Financeiro" | "Presets";

export interface GeneratedValue {
  id: string;
  generatorId: GeneratorId;
  label: string;
  value: string;
  createdAt: number;
}

export interface GeneratorDefinition {
  id: GeneratorId;
  label: string;
  category: GeneratorCategory;
  description: string;
  /** Oculto das listas de seleção; continua disponível para presets JSON e preenchimento automático. */
  hidden?: boolean;
  generate: (options?: GeneratorOptions) => string;
}

export interface GeneratorOptions {
  masked: boolean;
  cardBrand?: CardBrand;
  passwordLength?: number;
  textLength?: number;
}

export type CardBrand = "visa" | "mastercard" | "amex" | "elo";
