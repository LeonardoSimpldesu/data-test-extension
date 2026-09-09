const firstNames = ["Ana", "Bruno", "Carolina", "Daniel", "Mariana", "Rafael", "Sofia", "Thiago"];
const lastNames = ["Almeida", "Barbosa", "Carvalho", "Ferreira", "Oliveira", "Ribeiro", "Santos", "Souza"];
const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const digits = (length: number) => Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");

function generateCpf(): string {
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

function generateCnpj(): string {
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

const states = ["AC", "AL", "BA", "CE", "DF", "ES", "GO", "MG", "PA", "PE", "PR", "RJ", "RS", "SC", "SP"];
const cities = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Salvador", "Recife", "Porto Alegre", "Florianópolis"];

const contextGenerators = [
  { id: "name", label: "Nome completo", generate: () => `${pick(firstNames)} ${pick(lastNames)}` },
  { id: "first-name", label: "Primeiro nome", generate: () => pick(firstNames) },
  { id: "last-name", label: "Sobrenome", generate: () => pick(lastNames) },
  { id: "cpf", label: "CPF", generate: generateCpf },
  { id: "cnpj", label: "CNPJ", generate: generateCnpj },
  { id: "cep", label: "CEP", generate: () => `${digits(5)}${digits(3)}` },
  { id: "state", label: "Estado", generate: () => pick(states) },
  { id: "city", label: "Cidade", generate: () => pick(cities) },
  { id: "email", label: "E-mail", generate: () => `${pick(firstNames).toLowerCase()}.${pick(lastNames).toLowerCase()}${digits(2)}@example.com` },
  { id: "phone", label: "Telefone", generate: () => `119${digits(8)}` },
  { id: "date", label: "Data", generate: () => {
    const value = new Date(Date.now() - Math.floor(Math.random() * 50 * 365.25 * 24 * 60 * 60 * 1000));
    return value.toISOString().slice(0, 10);
  } },
  { id: "url", label: "URL", generate: () => `https://www.example.com/users/${digits(4)}` },
  { id: "ip", label: "IP", generate: () => `192.0.2.${Math.floor(Math.random() * 254) + 1}` },
  { id: "currency", label: "Valor monetário", generate: () => ((Math.floor(Math.random() * 1000000) + 1) / 100).toFixed(2) },
  { id: "percentage", label: "Percentual", generate: () => (Math.floor(Math.random() * 10001) / 100).toFixed(2) },
  { id: "boolean", label: "Booleano", generate: () => Math.random() >= 0.5 ? "true" : "false" },
  { id: "integer", label: "Número inteiro", generate: () => String(Math.floor(Math.random() * 2001) - 1000) },
  { id: "hex-color", label: "Cor hexadecimal", generate: () => `#${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, "0")}` },
  { id: "timestamp", label: "Timestamp", generate: () => String(Date.now()) },
  { id: "password", label: "Senha", generate: () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } }
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll().then(() => {
    chrome.contextMenus.create({
      id: "test-data",
      title: "Gerar dado de teste",
      contexts: ["editable"]
    });
    for (const generator of contextGenerators) {
      chrome.contextMenus.create({
        id: `generate:${generator.id}`,
        parentId: "test-data",
        title: generator.label,
        contexts: ["editable"]
      });
    }
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id || typeof info.menuItemId !== "string" || !info.menuItemId.startsWith("generate:")) return;
  const generatorId = info.menuItemId.slice("generate:".length);
  const generator = contextGenerators.find(({ id }) => id === generatorId);
  if (!generator) return;
  const value = generator.generate();
  chrome.tabs.sendMessage(tab.id, {
    type: "insert-generated-value",
    value
  }, (response) => {
    if (chrome.runtime.lastError || !response?.ok) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: (generatedValue: string) => {
          const element = document.activeElement;
          if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) {
            throw new Error("Selecione um campo editável antes de abrir o menu.");
          }
          element.focus();
          const prototype = Object.getPrototypeOf(element);
          const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
          if (descriptor?.set) descriptor.set.call(element, generatedValue);
          else element.value = generatedValue;
          element.dispatchEvent(new Event("input", { bubbles: true }));
          element.dispatchEvent(new Event("change", { bubbles: true }));
          element.blur();
        },
        args: [value]
      }).catch((error: unknown) => {
        console.error("Não foi possível inserir o dado no campo.", error);
      });
    }
  });
});
