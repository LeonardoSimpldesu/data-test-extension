import { formatCpf, generateCpf, generateFirstName, generateLastName } from "../generators";
import type { FillStep } from "../shared/fill-form";

export type CustomerField =
  | "firstname"
  | "lastname"
  | "cpf"
  | "dob"
  | "gender"
  | "telephone"
  | "email"
  | "password"
  | "passwordConfirmation"
  | "postcode"
  | "street"
  | "number"
  | "neighborhood"
  | "complement"
  | "city"
  | "region";

export interface StorePreset {
  id: string;
  name: string;
  /** Endereço de produção, usado só para reconhecer a loja da aba; o preenchimento funciona em qualquer domínio (local, HML). */
  productionUrl: string;
  /** Sobrescreve seletores do formulário base do Magento quando a loja difere. */
  selectors?: Partial<Record<CustomerField, string>>;
}

export interface StoreCustomer {
  firstname: string;
  lastname: string;
  cpf: string;
  dob: string;
  gender: string;
  telephone: string;
  email: string;
  password: string;
  postcode: string;
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  city: string;
  region: string;
}

export const MAGENTO_FORM_SELECTOR = "form#form-validate";
export const MAGENTO_CREATE_PATH = "/customer/account/create/";

const magentoSelectors: Record<CustomerField, string> = {
  firstname: "#firstname",
  lastname: "#lastname",
  cpf: "#cpf",
  dob: "#dob",
  gender: "#gender",
  telephone: "#telephone",
  email: "#email_address",
  password: "#password",
  passwordConfirmation: "#password-confirmation",
  postcode: "#postcode",
  street: "#street_1",
  number: "#street_2",
  neighborhood: "#street_3",
  complement: "#street_4",
  city: "#city",
  region: "#region_id"
};

export const stores: StorePreset[] = [
  { id: "simonetti", name: "Simonetti", productionUrl: "https://simonetti.com.br/" },
  {
    id: "wtennis",
    name: "WTennis",
    productionUrl: "https://www.wtennis.com.br/",
    selectors: { complement: "#street_3", neighborhood: "#street_4" }
  },
  { id: "segredos-caseiros", name: "Segredos Caseiros", productionUrl: "https://segredoscaseiros.com.br/" },
  { id: "madog", name: "Madog", productionUrl: "https://madog.com.br/" }
];

/** CEPs reais (conferidos na ViaCEP) para que a busca automática de endereço das lojas funcione. */
export const realAddresses = [
  { postcode: "01310-100", street: "Avenida Paulista", number: "1000", neighborhood: "Bela Vista", city: "São Paulo", region: "São Paulo", ddd: "11" },
  { postcode: "20040-002", street: "Avenida Rio Branco", number: "130", neighborhood: "Centro", city: "Rio de Janeiro", region: "Rio de Janeiro", ddd: "21" },
  { postcode: "30130-010", street: "Praça Sete de Setembro", number: "100", neighborhood: "Centro", city: "Belo Horizonte", region: "Minas Gerais", ddd: "31" },
  { postcode: "80010-010", street: "Rua Marechal Deodoro", number: "500", neighborhood: "Centro", city: "Curitiba", region: "Paraná", ddd: "41" },
  { postcode: "90010-150", street: "Praça da Alfândega", number: "50", neighborhood: "Centro Histórico", city: "Porto Alegre", region: "Rio Grande do Sul", ddd: "51" },
  { postcode: "88010-400", street: "Praça Quinze de Novembro", number: "20", neighborhood: "Centro", city: "Florianópolis", region: "Santa Catarina", ddd: "48" }
];

const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const randomInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const randomDigits = (length: number) => Array.from({ length }, () => randomInt(0, 9)).join("");
const slug = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Senha aceita pela regra padrão do Magento: mínimo 8 caracteres e ao menos 3 classes. */
export function generateStorePassword(): string {
  const groups = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%"];
  const all = [...groups.join("")];
  const chars = [...groups.map((group) => pick([...group])), ...Array.from({ length: 8 }, () => pick(all))];
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomInt(0, index);
    [chars[index], chars[swap]] = [chars[swap], chars[index]];
  }
  return chars.join("");
}

/** Data de nascimento de um adulto (18 a 60 anos) em dd/MM/yyyy. */
export function generateAdultBirthDate(now = new Date()): string {
  const latest = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate() - 1).getTime();
  const earliest = new Date(now.getFullYear() - 60, now.getMonth(), now.getDate()).getTime();
  const date = new Date(randomInt(earliest, latest));
  return [date.getDate(), date.getMonth() + 1].map((part) => String(part).padStart(2, "0")).join("/") + `/${date.getFullYear()}`;
}

export function generateStoreCustomer(): StoreCustomer {
  const firstname = generateFirstName();
  const lastname = generateLastName();
  const address = pick(realAddresses);
  return {
    firstname,
    lastname,
    cpf: formatCpf(generateCpf()),
    dob: generateAdultBirthDate(),
    gender: pick(["1", "2"]),
    telephone: `(${address.ddd}) 9${randomDigits(4)}-${randomDigits(4)}`,
    // Sufixo baseado no horário evita "e-mail já cadastrado" ao repetir o teste.
    email: `${slug(firstname)}.${slug(lastname)}.${Date.now().toString(36)}@example.com`,
    password: generateStorePassword(),
    postcode: address.postcode,
    street: address.street,
    number: address.number,
    neighborhood: address.neighborhood,
    complement: `Apto ${randomInt(1, 20)}${randomInt(0, 9)}`,
    city: address.city,
    region: address.region
  };
}

export function buildStoreFillSteps(store: StorePreset, customer: StoreCustomer): FillStep[] {
  const selectors = { ...magentoSelectors, ...store.selectors };
  const step = (field: CustomerField, value: string, waitAfterMs?: number): FillStep =>
    ({ field, selector: selectors[field], value, ...(waitAfterMs ? { waitAfterMs } : {}) });
  return [
    // O CEP vem primeiro: a loja busca o endereço e os campos seguintes sobrescrevem com os mesmos dados.
    step("postcode", customer.postcode, 1500),
    step("firstname", customer.firstname),
    step("lastname", customer.lastname),
    step("cpf", customer.cpf),
    step("dob", customer.dob),
    step("gender", customer.gender),
    step("telephone", customer.telephone),
    step("email", customer.email),
    step("password", customer.password),
    step("passwordConfirmation", customer.password),
    step("street", customer.street),
    step("number", customer.number),
    step("neighborhood", customer.neighborhood),
    step("complement", customer.complement),
    step("city", customer.city),
    step("region", customer.region)
  ];
}

export function storeForUrl(tabUrl: string | undefined): StorePreset | undefined {
  if (!tabUrl) return undefined;
  try {
    const host = new URL(tabUrl).hostname.replace(/^www\./, "");
    return stores.find((store) => new URL(store.productionUrl).hostname.replace(/^www\./, "") === host);
  } catch {
    return undefined;
  }
}
