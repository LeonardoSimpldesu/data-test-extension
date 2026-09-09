export interface ActiveFieldInfo {
  tagName: string;
  type: string;
  name: string;
  id: string;
  placeholder: string;
  suggestedGenerator: string | null;
}

export interface FormFieldInfo extends ActiveFieldInfo {
  key: string;
  label: string;
  selected: boolean;
}

export function listFormFields(): Promise<FormFieldInfo[]> {
  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(
      `(() => Array.from(document.querySelectorAll("input, textarea, select")).map((element, index) => {
        const input = element instanceof HTMLInputElement ? element : null;
        const text = [
          element.tagName,
          input?.type || "",
          input?.name || "",
          element.id || "",
          element.getAttribute("placeholder") || ""
        ].join(" ").toLowerCase();
        let suggestedGenerator = null;
        if (/(password|senha|passwd)/.test(text) || input?.type === "password") suggestedGenerator = "password";
        else if (/(cnpj|company|empresa|corporate)/.test(text)) suggestedGenerator = "cnpj";
        else if (/(cpf|documento|taxvat)/.test(text)) suggestedGenerator = "cpf";
        else if (/(cep|zip|postal)/.test(text)) suggestedGenerator = "cep";
        else if (/(estado|state|uf|province)/.test(text)) suggestedGenerator = "state";
        else if (/(cidade|city|town)/.test(text)) suggestedGenerator = "city";
        else if (/(e-?mail|correo)/.test(text)) suggestedGenerator = "email";
        else if (/(telefone|phone|celular|whatsapp|fax)/.test(text)) suggestedGenerator = "phone";
        else if (/(first[\\s_-]?name|firstname|primeiro[\\s_-]?nome|given[\\s_-]?name)/.test(text)) suggestedGenerator = "first-name";
        else if (/(last[\\s_-]?name|lastname|sobrenome|family[\\s_-]?name)/.test(text)) suggestedGenerator = "last-name";
        else if (/(nome|name)/.test(text)) suggestedGenerator = "name";
        else if (input?.type === "date" || /(nascimento|birth|birthdate|data[\\s_-]?nascimento)/.test(text)) suggestedGenerator = "date";
        else if (/(timestamp|unix|epoch)/.test(text)) suggestedGenerator = "timestamp";
        else if (/(url|site|website|link)/.test(text)) suggestedGenerator = "url";
        return {
          key: String(index),
          label: input?.name || element.id || input?.placeholder || \`Campo \${index + 1}\`,
          tagName: element.tagName.toLowerCase(),
          type: input?.type || element.tagName.toLowerCase(),
          name: input?.name || "",
          id: element.id || "",
          placeholder: element.getAttribute("placeholder") || "",
          suggestedGenerator,
          selected: Boolean(suggestedGenerator)
        };
      }))()`,
      (result, exceptionInfo) => {
        if (exceptionInfo) {
          reject(new Error(exceptionInfo.description ?? "Não foi possível listar os campos."));
          return;
        }
        if (!Array.isArray(result)) {
          reject(new Error("A página retornou uma lista inválida de campos."));
          return;
        }
        resolve(result.filter((field): field is FormFieldInfo =>
          typeof field === "object" && field !== null &&
          typeof field.key === "string" && typeof field.label === "string" &&
          typeof field.tagName === "string" && typeof field.type === "string" &&
          typeof field.name === "string" && typeof field.id === "string" &&
          typeof field.placeholder === "string" &&
          (typeof field.suggestedGenerator === "string" || field.suggestedGenerator === null) &&
          typeof field.selected === "boolean"
        ));
      }
    );
  });
}

export function fillFormFields(fields: Array<{ key: string; value: string }>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(
      `(() => {
        const fields = ${JSON.stringify(fields)};
        for (const field of fields) {
          const element = document.querySelectorAll("input, textarea, select")[Number(field.key)];
          if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) continue;
          element.focus();
          const prototype = Object.getPrototypeOf(element);
          const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
          if (descriptor?.set) descriptor.set.call(element, field.value);
          else element.value = field.value;
          element.dispatchEvent(new Event("input", { bubbles: true }));
          element.dispatchEvent(new Event("change", { bubbles: true }));
          element.blur();
        }
        return true;
      })()`,
      (_result, exceptionInfo) => {
        if (exceptionInfo) {
          reject(new Error(exceptionInfo.description ?? "Não foi possível preencher o formulário."));
          return;
        }
        resolve();
      }
    );
  });
}

export function insertIntoInspectedPage(value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(
      `(() => {
        const element = document.activeElement;
        if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) {
          throw new Error("Selecione um campo de formulário na página antes de inserir.");
        }
        const prototype = Object.getPrototypeOf(element);
        const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
        if (descriptor?.set) descriptor.set.call(element, ${JSON.stringify(value)});
        else element.value = ${JSON.stringify(value)};
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      })()`,
      (_result, exceptionInfo) => {
        if (exceptionInfo) {
          reject(new Error(exceptionInfo.description ?? "Não foi possível inserir o valor no campo ativo."));
          return;
        }
        resolve();
      }
    );
  });
}

export function inspectActiveField(): Promise<ActiveFieldInfo> {
  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(
      `(() => {
        const element = document.activeElement;
        if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) {
          throw new Error("Selecione um campo de formulário na página antes de detectar.");
        }
        const text = [
          element.tagName,
          element instanceof HTMLInputElement ? element.type : "",
          element.name,
          element.id,
          element.getAttribute("placeholder") || ""
        ].join(" ").toLowerCase();
        let suggestedGenerator = null;
        if (/(password|senha|passwd)/.test(text) || (element instanceof HTMLInputElement && element.type === "password")) suggestedGenerator = "password";
        else if (/(cnpj|company|empresa|corporate)/.test(text)) suggestedGenerator = "cnpj";
        else if (/(cpf|documento|taxvat)/.test(text)) suggestedGenerator = "cpf";
        else if (/(cep|zip|postal)/.test(text)) suggestedGenerator = "cep";
        else if (/(estado|state|uf|province)/.test(text)) suggestedGenerator = "state";
        else if (/(cidade|city|town)/.test(text)) suggestedGenerator = "city";
        else if (/(url|site|website|link)/.test(text)) suggestedGenerator = "url";
        else if (/(^|[\s_-])(ip|ipv4)([\s_-]|$)/.test(text)) suggestedGenerator = "ip";
        else if (/(amount|price|valor|preco|preço|money|monetario|monetário)/.test(text)) suggestedGenerator = "currency";
        else if (/(percent|percentage|percentual|desconto|taxa)/.test(text)) suggestedGenerator = "percentage";
        else if (/(boolean|bool|ativo|active|enabled)/.test(text)) suggestedGenerator = "boolean";
        else if (/(integer|inteiro|quantity|quantidade|count)/.test(text)) suggestedGenerator = "integer";
        else if (/(color|colour|cor|hex)/.test(text)) suggestedGenerator = "hex-color";
        else if (/(timestamp|unix|epoch)/.test(text)) suggestedGenerator = "timestamp";
        else if (/(e-?mail|correo)/.test(text)) suggestedGenerator = "email";
        else if (/(telefone|phone|celular|whatsapp|fax)/.test(text)) suggestedGenerator = "phone";
        else if ((element instanceof HTMLInputElement && element.type === "date") || /(nascimento|birth|birthdate|data[\s_-]?nascimento)/.test(text)) suggestedGenerator = "date";
        else if (/(data|date|datetime)/.test(text)) suggestedGenerator = "datetime";
        else if (/(first[\s_-]?name|firstname|primeiro[\s_-]?nome|given[\s_-]?name)/.test(text)) suggestedGenerator = "first-name";
        else if (/(last[\s_-]?name|lastname|sobrenome|family[\s_-]?name)/.test(text)) suggestedGenerator = "last-name";
        else if (/(nome|name)/.test(text)) suggestedGenerator = "name";
        return {
          tagName: element.tagName.toLowerCase(),
          type: element instanceof HTMLInputElement ? element.type : element.tagName.toLowerCase(),
          name: element.name || "",
          id: element.id || "",
          placeholder: element.getAttribute("placeholder") || "",
          suggestedGenerator
        };
      })()`,
      (result, exceptionInfo) => {
        if (exceptionInfo) {
          reject(new Error(exceptionInfo.description ?? "Não foi possível detectar o campo ativo."));
          return;
        }
        if (
          typeof result !== "object" ||
          result === null ||
          typeof result.tagName !== "string" ||
          typeof result.type !== "string" ||
          typeof result.name !== "string" ||
          typeof result.id !== "string" ||
          typeof result.placeholder !== "string" ||
          (typeof result.suggestedGenerator !== "string" && result.suggestedGenerator !== null)
        ) {
          reject(new Error("A página retornou informações inválidas sobre o campo."));
          return;
        }
        resolve({
          tagName: result.tagName,
          type: result.type,
          name: result.name,
          id: result.id,
          placeholder: result.placeholder,
          suggestedGenerator: result.suggestedGenerator
        });
      }
    );
  });
}
