import type { CardBrand, GeneratorDefinition, GeneratorOptions } from "../shared/types";

const firstNames = ["Ana", "Bruno", "Carolina", "Daniel", "Mariana", "Rafael", "Sofia", "Thiago"];
const lastNames = ["Almeida", "Barbosa", "Carvalho", "Ferreira", "Oliveira", "Ribeiro", "Santos", "Souza"];
const states = ["AC", "AL", "BA", "CE", "DF", "ES", "GO", "MG", "PA", "PE", "PR", "RJ", "RS", "SC", "SP"];
const cities = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Salvador", "Recife", "Porto Alegre", "Florianópolis"];
const companies = ["Almeida Tecnologia", "Oliveira Serviços", "Souza Comércio", "Ribeiro Consultoria", "Santos Logística"];
const streets = ["Avenida Brasil", "Rua das Flores", "Rua Augusta", "Avenida Paulista", "Rua XV de Novembro", "Rua do Comércio"];
const neighborhoods = ["Centro", "Jardins", "Vila Madalena", "Boa Vista", "Moema", "Santa Tereza"];
const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const digits = (length: number) => Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");

export function generateCpf(): string {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 9));
  const calculate = (length: number) => {
    const sum = base.slice(0, length).reduce((total, digit, index) => total + digit * (length + 1 - index), 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  base.push(calculate(9));
  base.push(calculate(10));
  return base.join("");
}

export function formatCpf(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function generateCnpj(): string {
  const base = Array.from({ length: 8 }, () => Math.floor(Math.random() * 9));
  base.push(0, 0, 0, 1);
  const calculate = (length: number) => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = base.slice(0, length).reduce((total, digit, index) => total + digit * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  base.push(calculate(12));
  base.push(calculate(13));
  return base.join("");
}

export function formatCnpj(cnpj: string): string {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function isValidCpf(value: string): boolean {
  const digitsValue = value.replace(/\D/g, "");
  if (digitsValue.length !== 11 || /^(\d)\1+$/.test(digitsValue)) return false;
  for (let length = 9; length <= 10; length += 1) {
    const sum = digitsValue.slice(0, length).split("").reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const expected = (sum * 10) % 11 % 10;
    if (expected !== Number(digitsValue[length])) return false;
  }
  return true;
}

export function isValidCnpj(value: string): boolean {
  const digitsValue = value.replace(/\D/g, "");
  if (digitsValue.length !== 14 || /^(\d)\1+$/.test(digitsValue)) return false;
  for (let length = 12; length <= 13; length += 1) {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = digitsValue.slice(0, length).split("").reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
    const expected = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (expected !== Number(digitsValue[length])) return false;
  }
  return true;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function isValidCep(value: string): boolean {
  return /^\d{5}-?\d{3}$/.test(value);
}

export function isValidPhone(value: string): boolean {
  const digitsValue = value.replace(/\D/g, "");
  return /^(\d{10}|\d{11})$/.test(digitsValue) && digitsValue.startsWith("1");
}

export function generateCep(): string {
  return `${digits(5)}${digits(3)}`;
}

export function formatCep(cep: string): string {
  return cep.replace(/(\d{5})(\d{3})/, "$1-$2");
}

export function generateState(): string {
  return pick(states);
}

export function generateCity(): string {
  return pick(cities);
}

export function formatPhone(phone: string): string {
  return phone.replace(/(\d{2})(\d)(\d{4})(\d{4})/, "($1) $2$3-$4");
}

export function formatDateTime(value: Date, masked: boolean): string {
  if (!masked) return value.toISOString();
  return value.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });
}

export function generateDate(masked = true): string {
  const value = new Date(Date.now() - Math.floor(Math.random() * 50 * 365.25 * 24 * 60 * 60 * 1000));
  const iso = value.toISOString().slice(0, 10);
  return masked ? iso.split("-").reverse().join("/") : iso;
}

export function generateName(): string {
  return `${pick(firstNames)} ${pick(lastNames)}`;
}

export function generateFirstName(): string {
  return pick(firstNames);
}

export function generateLastName(): string {
  return pick(lastNames);
}

export function generateEmail(name = generateName()): string {
  const normalizedName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return `${normalizedName.replace(" ", ".")}${Math.floor(Math.random() * 100)}@example.com`;
}

export function generatePhone(masked = false): string {
  const phone = `119${digits(8)}`;
  return masked ? formatPhone(phone) : phone;
}

export function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  return Array.from({ length: Math.max(4, Math.min(64, length)) }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const testCards: Record<CardBrand, string[]> = {
  visa: ["4111111111111111", "4012888888881881"],
  mastercard: ["5555555555554444", "2223003122003222"],
  amex: ["378282246310005", "371449635398431"],
  elo: ["6362970000457013", "6363680000000005"]
};

export function generateTestCard(brand: CardBrand = "visa", masked = true): string {
  const number = pick(testCards[brand]);
  if (!masked) return number;
  if (brand === "amex") return number.replace(/(\d{4})(\d{6})(\d{5})/, "$1 $2 $3");
  return number.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function generatePersonPreset(masked = true): string {
  const name = generateName();
  const cpf = generateCpf();
  const birthDate = new Date(Date.now() - (18 + Math.floor(Math.random() * 43)) * 365.25 * 24 * 60 * 60 * 1000);
  const date = birthDate.toISOString().slice(0, 10);
  return JSON.stringify({
    nome: name,
    cpf: masked ? formatCpf(cpf) : cpf,
    email: generateEmail(name),
    telefone: generatePhone(masked),
    dataNascimento: masked ? date.split("-").reverse().join("/") : date,
    senha: generatePassword()
  }, null, 2);
}

export function generateCompanyPreset(masked = true): string {
  const company = pick(companies);
  const cnpj = generateCnpj();
  return JSON.stringify({
    razaoSocial: `${company} Ltda.`,
    cnpj: masked ? formatCnpj(cnpj) : cnpj,
    email: `${company.toLowerCase().replace(" ", ".")}@example.com`,
    telefone: generatePhone(masked),
    cep: masked ? formatCep(generateCep()) : generateCep(),
    cidade: generateCity(),
    estado: generateState()
  }, null, 2);
}

export function generateAddressPreset(masked = true): string {
  const cep = generateCep();
  return JSON.stringify({
    cep: masked ? formatCep(cep) : cep,
    rua: pick(streets),
    numero: String(Math.floor(Math.random() * 9000) + 1),
    complemento: Math.random() > 0.5 ? `Apto ${Math.floor(Math.random() * 900) + 1}` : "",
    bairro: pick(neighborhoods),
    cidade: generateCity(),
    estado: generateState()
  }, null, 2);
}

export function generateEdgeCasesPreset(): string {
  return JSON.stringify({
    vazio: "",
    espacos: "   texto com espacos   ",
    nulo: null,
    zero: 0,
    negativo: -1,
    unicode: "ação — teste",
    emoji: "Teste 🚀",
    caracteresEspeciais: "<>&\"' / \\\\",
    textoLongo: "x".repeat(500)
  }, null, 2);
}

export function generateApiResponsePreset(): string {
  const items = Array.from({ length: 3 }, (_, index) => ({
    id: crypto.randomUUID(),
    nome: generateName(),
    email: generateEmail(),
    ativo: index % 2 === 0
  }));
  return JSON.stringify({
    data: items,
    meta: {
      page: 1,
      perPage: items.length,
      total: 27,
      totalPages: 9
    },
    links: {
      self: "/api/users?page=1",
      next: "/api/users?page=2"
    }
  }, null, 2);
}

export function generateApiErrorPreset(): string {
  const errors = [
    { status: 400, code: "BAD_REQUEST", message: "A requisição é inválida." },
    { status: 401, code: "UNAUTHORIZED", message: "Autenticação necessária." },
    { status: 404, code: "NOT_FOUND", message: "Recurso não encontrado." },
    { status: 422, code: "VALIDATION_ERROR", message: "Existem campos inválidos." },
    { status: 500, code: "INTERNAL_ERROR", message: "Erro interno do servidor." }
  ];
  const error = pick(errors);
  return JSON.stringify({
    error: {
      code: error.code,
      message: error.message,
      requestId: crypto.randomUUID(),
      details: error.status === 422 ? { email: ["E-mail inválido."], cpf: ["CPF obrigatório."] } : null
    },
    status: error.status,
    timestamp: new Date().toISOString()
  }, null, 2);
}

export function generateUrl(): string {
  return `https://www.example.com/${pick(["users", "products", "orders", "checkout"])}/${digits(4)}`;
}

export function generateIp(): string {
  return `192.0.2.${Math.floor(Math.random() * 254) + 1}`;
}

export function generateCurrency(masked = true): string {
  const value = (Math.floor(Math.random() * 1000000) + 1) / 100;
  return masked ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : value.toFixed(2);
}

export function generatePercentage(masked = true): string {
  const value = (Math.floor(Math.random() * 10001) / 100).toFixed(2);
  return masked ? `${value.replace(".", ",")}%` : value;
}

export function generateBoolean(): string {
  return Math.random() >= 0.5 ? "true" : "false";
}

export function generateInteger(): string {
  return String(Math.floor(Math.random() * 2001) - 1000);
}

export function generateHexColor(): string {
  return `#${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, "0")}`;
}

export function generateTimestamp(): string {
  return String(Date.now());
}

export const generators: GeneratorDefinition[] = [
  { id: "person", label: "Pessoa física", category: "Presets", description: "Conjunto coerente para cadastro", generate: (options = { masked: true }) => generatePersonPreset(options.masked) },
  { id: "company", label: "Pessoa jurídica", category: "Presets", description: "Conjunto coerente para empresa", generate: (options = { masked: true }) => generateCompanyPreset(options.masked) },
  { id: "address", label: "Endereço", category: "Presets", description: "Endereço brasileiro sintético", generate: (options = { masked: true }) => generateAddressPreset(options.masked) },
  { id: "edge-cases", label: "Casos de borda", category: "Presets", description: "Valores para testar validações", generate: generateEdgeCasesPreset },
  { id: "api-response", label: "Resposta de API", category: "Presets", description: "Payload paginado para APIs", generate: generateApiResponsePreset },
  { id: "api-error", label: "Erro de API", category: "Presets", description: "Respostas HTTP de erro", generate: generateApiErrorPreset },
  { id: "url", label: "URL", category: "Técnico", description: "URL de domínio reservado", generate: generateUrl },
  { id: "ip", label: "IP", category: "Técnico", description: "IPv4 reservado para documentação", generate: generateIp },
  { id: "currency", label: "Valor monetário", category: "Financeiro", description: "Valor em reais", generate: (options = { masked: true }) => generateCurrency(options.masked) },
  { id: "percentage", label: "Percentual", category: "Financeiro", description: "Percentual de 0 a 100", generate: (options = { masked: true }) => generatePercentage(options.masked) },
  { id: "boolean", label: "Booleano", category: "Técnico", description: "true ou false", generate: generateBoolean },
  { id: "integer", label: "Número inteiro", category: "Técnico", description: "Inteiro entre -1000 e 1000", generate: generateInteger },
  { id: "hex-color", label: "Cor hexadecimal", category: "Técnico", description: "Cor no formato #RRGGBB", generate: generateHexColor },
  { id: "timestamp", label: "Timestamp", category: "Técnico", description: "Timestamp Unix em milissegundos", generate: generateTimestamp },
  { id: "name", label: "Nome completo", category: "Pessoal", description: "Nome brasileiro sintético", generate: generateName },
  { id: "first-name", label: "Primeiro nome", category: "Pessoal", description: "Primeiro nome brasileiro sintético", generate: generateFirstName },
  { id: "last-name", label: "Sobrenome", category: "Pessoal", description: "Sobrenome brasileiro sintético", generate: generateLastName },
  { id: "cpf", label: "CPF", category: "Pessoal", description: "CPF válido", generate: (options = { masked: false }) => options.masked ? formatCpf(generateCpf()) : generateCpf() },
  { id: "cnpj", label: "CNPJ", category: "Pessoal", description: "CNPJ válido", generate: (options = { masked: false }) => options.masked ? formatCnpj(generateCnpj()) : generateCnpj() },
  { id: "cep", label: "CEP", category: "Contato", description: "CEP brasileiro sintético", generate: (options = { masked: false }) => options.masked ? formatCep(generateCep()) : generateCep() },
  { id: "state", label: "Estado", category: "Contato", description: "UF brasileira", generate: generateState },
  { id: "city", label: "Cidade", category: "Contato", description: "Cidade brasileira", generate: generateCity },
  { id: "email", label: "E-mail", category: "Contato", description: "E-mail com domínio reservado", generate: () => generateEmail() },
  { id: "phone", label: "Telefone", category: "Contato", description: "Celular brasileiro de teste", generate: (options = { masked: false }) => generatePhone(options.masked) },
  { id: "uuid", label: "UUID", category: "Técnico", description: "Identificador UUID v4", generate: () => crypto.randomUUID() },
  { id: "password", label: "Senha", category: "Técnico", description: "Senha aleatória configurável", generate: (options) => generatePassword(options?.passwordLength) },
  { id: "datetime", label: "Data e hora", category: "Técnico", description: "Data e hora atual", generate: (options = { masked: false }) => formatDateTime(new Date(), options.masked) },
  { id: "date", label: "Data", category: "Técnico", description: "Data para campos date", generate: (options = { masked: false }) => generateDate(options.masked) },
  { id: "text", label: "Texto aleatório", category: "Técnico", description: "Texto sintético configurável", generate: (options) => `Texto de teste ${digits(Math.max(1, Math.min(32, options?.textLength ?? 6)))}` },
  { id: "credit-card", label: "Cartão de teste", category: "Financeiro", description: "Número reservado para testes", generate: (options = { masked: true }) => generateTestCard(options.cardBrand, options.masked) }
];
