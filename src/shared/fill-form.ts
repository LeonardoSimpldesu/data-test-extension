export interface FillStep {
  /** Nome legível do campo, usado no relatório. */
  field: string;
  selector: string;
  value: string;
  /** Tempo de espera após preencher (ex.: busca de endereço por CEP). */
  waitAfterMs?: number;
}

export interface FillReport {
  formFound: boolean;
  filled: string[];
  missing: string[];
}

export interface FillStoreMessage {
  type: "fill-store-form";
  tabId: number;
  formSelector: string;
  /** Caminho do cadastro, aberto no mesmo domínio da aba quando o formulário não está na página. */
  createPath: string;
  steps: FillStep[];
}

export interface PageProbe {
  hasForm: boolean;
  isMagento: boolean;
  origin: string;
}

/** Executada na página: informa se o formulário já está aberto e se o site é Magento. Precisa ser autocontida. */
export function probeStorePage(formSelector: string): PageProbe {
  return {
    hasForm: Boolean(document.querySelector(formSelector)),
    isMagento: Boolean(document.querySelector('script[type="text/x-magento-init"]')),
    origin: location.origin
  };
}

export type FillStoreResponse = { ok: true; report: FillReport } | { ok: false; error: string };

/**
 * Executada dentro da página via chrome.scripting.executeScript.
 * Precisa ser autocontida: não pode referenciar nada fora do próprio corpo.
 */
export async function fillFormInPage(steps: FillStep[], formSelector: string, settleMs: number): Promise<FillReport> {
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

  const deadline = Date.now() + 15000;
  while (!document.querySelector(formSelector) && Date.now() < deadline) await sleep(250);
  if (!document.querySelector(formSelector)) return { formFound: false, filled: [], missing: steps.map((step) => step.field) };
  if (settleMs > 0) await sleep(settleMs);

  const filled: string[] = [];
  const missing: string[] = [];

  for (const step of steps) {
    const element = document.querySelector(step.selector);
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) {
      missing.push(step.field);
      continue;
    }

    let value = step.value;
    if (element instanceof HTMLSelectElement) {
      const options = Array.from(element.options);
      const match = options.find((option) => option.value === step.value)
        ?? options.find((option) => normalize(option.text) === normalize(step.value));
      if (!match) {
        missing.push(step.field);
        continue;
      }
      value = match.value;
    }

    element.focus();
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value");
    if (descriptor?.set) descriptor.set.call(element, value);
    else element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("keyup", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.blur();
    element.dispatchEvent(new Event("blur"));
    filled.push(step.field);

    if (step.waitAfterMs) await sleep(step.waitAfterMs);
  }

  // Fecha popups abertos pelo foco (ex.: datepicker do campo de nascimento) simulando um clique fora.
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

  return { formFound: true, filled, missing };
}
