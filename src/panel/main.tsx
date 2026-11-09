import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { generators, isValidCep, isValidCnpj, isValidCpf, isValidEmail, isValidPhone, isValidUuid } from "../generators";
import { loadHistory, saveHistory, clearHistory } from "../storage/history";
import { defaultPreferences, loadPreferences, savePreferences } from "../storage/preferences";
import type { CardBrand, GeneratedValue, GeneratorId, GeneratorOptions } from "../shared/types";
import { fillFormFields, inspectActiveField, insertIntoInspectedPage, listFormFields, type ActiveFieldInfo, type FormFieldInfo } from "../devtools/insert";
import { MAGENTO_CREATE_PATH, MAGENTO_FORM_SELECTOR, buildStoreFillSteps, generateStoreCustomer, storeForUrl, stores, type StorePreset } from "../stores";
import type { FillStoreMessage, FillStoreResponse } from "../shared/fill-form";
import "./styles.css";

export function App({ popup = false }: { popup?: boolean }) {
  const [selectedId, setSelectedId] = useState<GeneratorId>("name");
  const [result, setResult] = useState<GeneratedValue | null>(null);
  const [batchResult, setBatchResult] = useState<string | null>(null);
  const [batchSize, setBatchSize] = useState(defaultPreferences.batchSize);
  const [history, setHistory] = useState<GeneratedValue[]>([]);
  const [masked, setMasked] = useState(true);
  const [cardBrand, setCardBrand] = useState<CardBrand>("visa");
  const [message, setMessage] = useState<string | null>(null);
  const [fieldInfo, setFieldInfo] = useState<ActiveFieldInfo | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formFields, setFormFields] = useState<FormFieldInfo[]>([]);
  const [passwordLength, setPasswordLength] = useState(12);
  const [textLength, setTextLength] = useState(6);
  const [favorites, setFavorites] = useState<GeneratorId[]>([]);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [fillingStoreId, setFillingStoreId] = useState<string | null>(null);
  const selected = generators.find((generator) => generator.id === selectedId) ?? generators[0];
  const normalizedSearch = search.trim().toLowerCase();
  const matchesSearch = (generator: typeof generators[number]) =>
    !normalizedSearch || `${generator.label} ${generator.description} ${generator.category}`.toLowerCase().includes(normalizedSearch);
  const fieldGenerators = generators.filter((generator) => generator.category !== "Presets" && matchesSearch(generator));
  const presetGenerators = generators.filter((generator) => generator.category === "Presets" && matchesSearch(generator));
  const matchingStores = stores.filter((store) => !normalizedSearch || `${store.name} loja cadastro formulario formulário`.toLowerCase().includes(normalizedSearch));
  const favoriteGenerators = favorites
    .map((id) => generators.find((generator) => generator.id === id))
    .filter((generator): generator is typeof generators[number] => Boolean(generator) && matchesSearch(generator!));

  useEffect(() => {
    loadHistory().then(setHistory).catch(() => setHistory([]));
    loadPreferences().then((preferences) => {
      setMasked(preferences.masked);
      setCardBrand(preferences.cardBrand);
      setPasswordLength(preferences.passwordLength);
      setTextLength(preferences.textLength);
      setBatchSize(preferences.batchSize);
      setFavorites(preferences.favorites.filter((id) => generators.some((generator) => generator.id === id)));
    }).catch(() => setMessage("Não foi possível carregar as preferências."))
      .finally(() => setPreferencesLoaded(true));
  }, []);

  useEffect(() => {
    if (!popup) return;
    chrome.tabs.query({ active: true, currentWindow: true })
      .then(([tab]) => setActiveStoreId(storeForUrl(tab?.url)?.id ?? null))
      .catch(() => setActiveStoreId(null));
  }, [popup]);

  useEffect(() => {
    if (!preferencesLoaded) return;
    savePreferences({ masked, cardBrand, passwordLength, textLength, batchSize, favorites }).catch(() => setMessage("Não foi possível salvar as preferências."));
  }, [preferencesLoaded, masked, cardBrand, passwordLength, textLength, batchSize, favorites]);

  const fillStore = async (store: StorePreset) => {
    setFillingStoreId(store.id);
    setMessage(`Preenchendo cadastro em ${store.name}...`);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id === undefined) throw new Error("Nenhuma aba ativa encontrada.");
      const customer = generateStoreCustomer();
      setSelectedId("person");
      setBatchResult(null);
      setValidation(null);
      setResult({
        id: crypto.randomUUID(),
        generatorId: "person",
        label: `Cadastro ${store.name}`,
        value: JSON.stringify(customer, null, 2),
        createdAt: Date.now()
      });
      const request: FillStoreMessage = {
        type: "fill-store-form",
        tabId: tab.id,
        formSelector: MAGENTO_FORM_SELECTOR,
        createPath: MAGENTO_CREATE_PATH,
        steps: buildStoreFillSteps(store, customer)
      };
      const response = await chrome.runtime.sendMessage<FillStoreMessage, FillStoreResponse>(request);
      if (!response?.ok) throw new Error(response?.error ?? "Não foi possível preencher o formulário.");
      if (!response.report.formFound) {
        throw new Error("Formulário de cadastro não encontrado. Se você estiver logado na loja, saia da conta e tente novamente.");
      }
      setMessage(`${store.name}: ${response.report.filled.length} campo(s) preenchido(s). Revise e envie o formulário.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível preencher o formulário.");
    } finally {
      setFillingStoreId(null);
    }
  };

  const toggleFavorite = (id: GeneratorId) => {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const selectGenerator = (generator: typeof generators[number]) => {
    setSelectedId(generator.id);
    if (popup) void generate(generator);
  };

  const renderGeneratorCard = (generator: typeof generators[number], detail: string) => {
    const favorite = favorites.includes(generator.id);
    return (
      <div class={generator.id === selectedId ? "generator selected" : "generator"} key={generator.id}>
        <button class="generator-select" onClick={() => selectGenerator(generator)}>
          <strong>{generator.label}</strong>
          <small>{detail}</small>
        </button>
        {popup && (
          <button
            class={favorite ? "pin-button pinned" : "pin-button"}
            onClick={() => toggleFavorite(generator.id)}
            title={favorite ? "Desafixar" : "Fixar nos favoritos"}
            aria-label={favorite ? `Desafixar ${generator.label}` : `Fixar ${generator.label}`}
            aria-pressed={favorite}
          >{favorite ? "★" : "☆"}</button>
        )}
      </div>
    );
  };

  const generate = async (generator = selected) => {
    const value: GeneratedValue = {
      id: crypto.randomUUID(),
      generatorId: generator.id,
      label: generator.label,
      value: generator.generate({ masked, cardBrand, passwordLength, textLength } satisfies GeneratorOptions),
      createdAt: Date.now()
    };
    setResult(value);
    setBatchResult(null);
    setValidation(null);
    setHistory(await saveHistory(value));
  };

  const generateBatch = async () => {
    const values = Array.from({ length: batchSize }, () => selected.generate({ masked, cardBrand, passwordLength, textLength } satisfies GeneratorOptions));
    const parsedValues = selected.id === "person"
      ? values.map((value) => JSON.parse(value) as Record<string, string>)
      : values;
    setBatchResult(JSON.stringify(parsedValues, null, 2));
    setResult(null);
    setValidation(null);
    setMessage(`${batchSize} valores gerados.`);
  };

  const validateResult = () => {
    const value = result?.value;
    if (!value) {
      setValidation("Gere um valor individual antes de validar.");
      return;
    }
    const valid = selected.id === "cpf" ? isValidCpf(value)
      : selected.id === "cnpj" ? isValidCnpj(value)
      : selected.id === "cep" ? isValidCep(value)
      : selected.id === "phone" ? isValidPhone(value)
      : selected.id === "email" ? isValidEmail(value)
      : selected.id === "uuid" ? isValidUuid(value)
      : null;
    setValidation(valid === null ? "Este gerador ainda não possui um validador dedicado." : valid ? "Valor válido." : "Valor inválido.");
  };

  const copy = async () => {
    const value = batchResult ?? result?.value;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setMessage(batchResult ? "Lote copiado como JSON." : "Valor copiado.");
    } catch {
      setMessage("Não foi possível copiar o valor.");
    }
  };

  const downloadBatch = (format: "json" | "csv") => {
    if (!batchResult) return;
    const content = format === "json" ? batchResult : toCsv(batchResult);
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `test-data-${selected.id}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`Arquivo ${format.toUpperCase()} baixado.`);
  };

  const insert = async () => {
    if (!result || popup) return;
    try {
      await insertIntoInspectedPage(result.value);
      setMessage("Valor inserido no campo ativo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível inserir o valor.");
    }
  };

  const detectField = async () => {
    if (popup) return;
    try {
      const info = await inspectActiveField();
      setFieldInfo(info);
      const suggested = generators.find((generator) => generator.id === info.suggestedGenerator);
      if (suggested) {
        setSelectedId(suggested.id);
        await generate(suggested);
        setMessage(`Tipo detectado: ${suggested.label}. Um novo valor foi gerado.`);
      } else {
        setMessage("Campo detectado, mas não foi encontrada uma sugestão.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível detectar o campo.");
    }
  };

  const mapForm = async () => {
    if (popup) return;
    try {
      setFormFields(await listFormFields());
      setMessage("Campos do formulário mapeados.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível mapear o formulário.");
    }
  };

  const toggleFormField = (key: string) => {
    setFormFields((fields) => fields.map((field) => field.key === key ? { ...field, selected: !field.selected } : field));
  };

  const fillMappedForm = async () => {
    const values = formFields
      .filter((field) => field.selected && field.suggestedGenerator)
      .map((field) => {
        const generator = generators.find((item) => item.id === field.suggestedGenerator);
        return generator ? {
          key: field.key,
          value: generator.generate({ masked: field.type === "date" ? false : masked, cardBrand, passwordLength, textLength })
        } : null;
      })
      .filter((value): value is { key: string; value: string } => value !== null);
    if (values.length === 0) {
      setMessage("Selecione ao menos um campo com gerador detectado.");
      return;
    }
    try {
      await fillFormFields(values);
      setMessage(`${values.length} campo(s) preenchido(s).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível preencher o formulário.");
    }
  };

  const clear = async () => {
    await clearHistory();
    setHistory([]);
  };

  const searchBlock = (
    <label class="search">
      <span class="eyebrow">BUSCAR</span>
      <input value={search} onInput={(event) => setSearch((event.currentTarget as HTMLInputElement).value)} placeholder="Ex.: CPF, API, financeiro..." />
    </label>
  );

  const favoritesBlock = (
    <section class="generator-section favorites-section">
      <div class="section-heading section-title">
        <div><span class="eyebrow">FIXOS</span><h2>Favoritos</h2></div>
        <small>Clique na ☆ para fixar</small>
      </div>
      <div class="generator-grid">
        {favoriteGenerators.length > 0
          ? favoriteGenerators.map((generator) => renderGeneratorCard(generator, generator.category))
          : <p class="empty">{favorites.length > 0 ? "Nenhum favorito corresponde à busca." : "Nenhum campo fixado ainda."}</p>}
      </div>
    </section>
  );

  const storesBlock = (
    <section class="generator-section stores-section">
      <div class="section-heading section-title">
        <div><span class="eyebrow">LOJAS</span><h2>Cadastro de cliente</h2></div>
        <small>Preenche na aba atual (local, HML ou produção)</small>
      </div>
      <div class="store-grid">
        {matchingStores.length > 0 ? matchingStores.map((store) => (
          <button
            key={store.id}
            class={store.id === activeStoreId ? "store-button current" : "store-button"}
            onClick={() => fillStore(store)}
            disabled={fillingStoreId !== null}
            title={`Preencher o cadastro de cliente com o mapeamento da ${store.name}`}
          >
            <strong>{store.name}</strong>
            <small>{fillingStoreId === store.id ? "Preenchendo..." : store.id === activeStoreId ? "Loja da aba atual" : "Preencher cadastro"}</small>
          </button>
        )) : <p class="empty">Nenhuma loja encontrada.</p>}
      </div>
    </section>
  );

  const fieldsBlock = (
    <section class="generator-section">
      <div class="section-heading section-title">
        <div><span class="eyebrow">CAMPOS</span><h2>{popup ? "Todos os campos" : "Geradores de campo"}</h2></div>
        <small>Valores individuais</small>
      </div>
      <div class="generator-grid">
      {fieldGenerators.length > 0
        ? fieldGenerators.map((generator) => renderGeneratorCard(generator, generator.category))
        : <p class="empty">Nenhum gerador de campo encontrado.</p>}
      </div>
    </section>
  );

  const presetsBlock = (
    <details class="preset-section">
      <summary><span><span class="eyebrow">PRESETS</span><strong>Conjuntos de dados</strong></span><small>Opcional</small></summary>
      <div class="generator-grid">
        {presetGenerators.length > 0
          ? presetGenerators.map((generator) => renderGeneratorCard(generator, generator.description))
          : <p class="empty">Nenhum preset encontrado.</p>}
      </div>
    </details>
  );

  const formMapperBlock = (
      <section class="form-mapper">
        <div class="section-heading">
          <div><span class="eyebrow">FORMULÁRIO</span><h2>Preenchimento em lote</h2></div>
          <button onClick={mapForm}>Mapear campos</button>
        </div>
        {formFields.length > 0 && <div class="mapped-fields">
          {formFields.map((field) => (
            <label class="mapped-field">
              <input type="checkbox" checked={field.selected} disabled={!field.suggestedGenerator} onChange={() => toggleFormField(field.key)} />
              <span><strong>{field.label}</strong><small>{field.suggestedGenerator ? generators.find((item) => item.id === field.suggestedGenerator)?.label : "Sem sugestão"}</small></span>
            </label>
          ))}
          <button class="primary" onClick={fillMappedForm}>Preencher selecionados</button>
        </div>}
      </section>
  );

  const resultBlock = (
      <section class="result-card">
        <div class="section-heading">
          <div><span class="eyebrow">RESULTADO</span><h2>{result && !batchResult ? result.label : selected.label}</h2></div>
          <small>{selected.description}</small>
        </div>
        <output>{batchResult ?? result?.value ?? "Clique em gerar para criar um valor"}</output>
        {(["cpf", "cnpj", "cep", "phone", "datetime", "date", "currency", "percentage", "credit-card", "person", "company", "address"] as GeneratorId[]).includes(selected.id) && (
          <div class="options">
            <label><input type="checkbox" checked={masked} onChange={(event) => setMasked((event.currentTarget as HTMLInputElement).checked)} /> Usar máscara</label>
            {selected.id === "credit-card" && (
              <label>Bandeira
                <select value={cardBrand} onChange={(event) => setCardBrand((event.currentTarget as HTMLSelectElement).value as CardBrand)}>
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="amex">American Express</option>
                  <option value="elo">Elo</option>
                </select>
              </label>
            )}
            {selected.id === "password" && (
              <label>Tamanho
                <input type="number" min="4" max="64" value={passwordLength} onInput={(event) => setPasswordLength(Math.min(64, Math.max(4, Number((event.currentTarget as HTMLInputElement).value) || 4)))} />
              </label>
            )}
            {selected.id === "text" && (
              <label>Dígitos
                <input type="number" min="1" max="32" value={textLength} onInput={(event) => setTextLength(Math.min(32, Math.max(1, Number((event.currentTarget as HTMLInputElement).value) || 1)))} />
              </label>
            )}
          </div>
        )}
        <div class="actions">
          <button class="primary" onClick={() => generate()}>Gerar</button>
          <button onClick={copy} disabled={!result && !batchResult}>Copiar</button>
          {["cpf", "cnpj", "cep", "phone", "email", "uuid"].includes(selected.id) && <button onClick={validateResult}>Validar</button>}
          {!popup && <button onClick={insert} disabled={!result || Boolean(batchResult)}>Inserir no campo ativo</button>}
          {!popup && <button onClick={detectField}>Detectar campo</button>}
        </div>
        <div class="batch-actions">
          <label>Quantidade
            <input type="number" min="2" max="100" value={batchSize} onInput={(event) => setBatchSize(Math.min(100, Math.max(2, Number((event.currentTarget as HTMLInputElement).value) || 2)))} />
          </label>
          <button onClick={generateBatch}>Gerar lote JSON</button>
          {batchResult && <button onClick={() => downloadBatch("json")}>Baixar JSON</button>}
          {batchResult && <button onClick={() => downloadBatch("csv")}>Baixar CSV</button>}
        </div>
        {fieldInfo && <p class="field-info">Campo: <code>{fieldInfo.tagName}[{fieldInfo.name || fieldInfo.id || fieldInfo.type}]</code></p>}
        {message && <p class="feedback" role="status">{message}</p>}
        {validation && <p class={validation === "Valor válido." ? "feedback" : "validation"} role="status">{validation}</p>}
      </section>
  );

  const historyBlock = (
      <section class="history">
        <div class="section-heading"><div><span class="eyebrow">HISTÓRICO</span><h2>Últimos valores</h2></div><button class="link-button" onClick={clear}>Limpar</button></div>
        {history.length === 0 ? <p class="empty">Nenhum valor gerado ainda.</p> : <ul>{history.map((item) => (
          <li>
            <button class="history-item" onClick={() => {
              setSelectedId(item.generatorId);
              setResult(item);
              setBatchResult(null);
              setMessage(`${item.label} restaurado do histórico.`);
            }}>
              <span>{item.label}</span><code>{item.value}</code>
            </button>
          </li>
        ))}</ul>}
      </section>
  );

  return (
    <main>
      <header>
        <div>
          <p class="eyebrow">{popup ? "EXTENSÃO" : "DEVTOOLS"}</p>
          <h1>Test Data</h1>
        </div>
        <span class="offline">Offline</span>
      </header>
      {popup ? (
        <>
          {searchBlock}
          {favoritesBlock}
          {storesBlock}
          {resultBlock}
          {fieldsBlock}
          {presetsBlock}
        </>
      ) : (
        <>
          {searchBlock}
          {fieldsBlock}
          {formMapperBlock}
          {presetsBlock}
          {resultBlock}
          {historyBlock}
        </>
      )}
      <p class="notice">Os valores são sintéticos e destinados somente a ambientes de desenvolvimento e teste.</p>
    </main>
  );
}

render(<App />, document.getElementById("app")!);

function toCsv(json: string): string {
  const rows = JSON.parse(json) as unknown[];
  if (rows.length === 0) return "";
  if (typeof rows[0] !== "object" || rows[0] === null) {
    return `valor\n${rows.map((row) => escapeCsv(String(row))).join("\n")}`;
  }
  const records = rows as Record<string, unknown>[];
  const headers = [...new Set(records.flatMap((record) => Object.keys(record)))];
  return [
    headers.map(escapeCsv).join(","),
    ...records.map((record) => headers.map((header) => escapeCsv(String(record[header] ?? ""))).join(","))
  ].join("\n");
}

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, "\"\"")}"`;
}
