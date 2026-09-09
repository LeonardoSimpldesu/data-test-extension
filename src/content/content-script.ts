let contextTarget: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null = null;

document.addEventListener("contextmenu", (event) => {
  const target = event.target;
  contextTarget = target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
    ? target
    : null;
}, true);

chrome.runtime.onMessage.addListener((message: { type?: string; value?: string }, _sender, sendResponse) => {
  if (message.type !== "insert-generated-value" || typeof message.value !== "string") return;
  if (!contextTarget) {
    sendResponse({ ok: false, error: "Nenhum campo editável foi selecionado." });
    return;
  }
  const element = contextTarget;
  element.focus();
  const prototype = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  if (descriptor?.set) descriptor.set.call(element, message.value);
  else element.value = message.value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.blur();
  sendResponse({ ok: true });
  return true;
});
