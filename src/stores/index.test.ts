import { describe, expect, it } from "vitest";
import { isValidCpf } from "../generators";
import { buildStoreFillSteps, generateAdultBirthDate, generateStoreCustomer, generateStorePassword, storeForUrl, stores } from "./index";

const store = (id: string) => stores.find((item) => item.id === id)!;

describe("presets de lojas", () => {
  it("gera cliente coerente com os formatos do Magento", () => {
    const customer = generateStoreCustomer();
    expect(isValidCpf(customer.cpf)).toBe(true);
    expect(customer.cpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    expect(customer.dob).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(customer.telephone).toMatch(/^\(\d{2}\) 9\d{4}-\d{4}$/);
    expect(customer.postcode).toMatch(/^\d{5}-\d{3}$/);
    expect(customer.email).toMatch(/^[a-z]+\.[a-z]+\.[a-z0-9]+@example\.com$/);
    expect(["1", "2"]).toContain(customer.gender);
  });

  it("gera senha que atende a regra padrão do Magento", () => {
    for (let index = 0; index < 50; index += 1) {
      const password = generateStorePassword();
      expect(password.length).toBeGreaterThanOrEqual(8);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/\d/);
      expect(password).toMatch(/[!@#$%]/);
    }
  });

  it("gera nascimento de maior de idade", () => {
    const now = new Date(2026, 10, 4);
    for (let index = 0; index < 50; index += 1) {
      const [day, month, year] = generateAdultBirthDate(now).split("/").map(Number);
      const age = now.getFullYear() - year - (now < new Date(now.getFullYear(), month - 1, day) ? 1 : 0);
      expect(age).toBeGreaterThanOrEqual(18);
    }
  });

  it("preenche o CEP primeiro e confirma a senha", () => {
    const customer = generateStoreCustomer();
    const steps = buildStoreFillSteps(store("simonetti"), customer);
    expect(steps[0]).toMatchObject({ field: "postcode", selector: "#postcode", value: customer.postcode });
    expect(steps.find((step) => step.field === "passwordConfirmation")?.value).toBe(customer.password);
  });

  it("respeita a ordem diferente de bairro e complemento da WTennis", () => {
    const customer = generateStoreCustomer();
    const selectorOf = (id: string, field: string) => buildStoreFillSteps(store(id), customer).find((step) => step.field === field)?.selector;
    expect(selectorOf("simonetti", "neighborhood")).toBe("#street_3");
    expect(selectorOf("simonetti", "complement")).toBe("#street_4");
    expect(selectorOf("wtennis", "neighborhood")).toBe("#street_4");
    expect(selectorOf("wtennis", "complement")).toBe("#street_3");
  });

  it("reconhece a loja de produção da aba", () => {
    expect(storeForUrl("https://wtennis.com.br/customer/account/create/")?.id).toBe("wtennis");
    expect(storeForUrl("http://localhost:8080/customer/account/create/")).toBeUndefined();
    expect(storeForUrl("https://www.madog.com.br/produto/123")?.id).toBe("madog");
    expect(storeForUrl("chrome://extensions")).toBeUndefined();
  });
});
