import { describe, expect, it } from "vitest";
import { formatCep, formatCnpj, formatCpf, generateAddressPreset, generateApiErrorPreset, generateApiResponsePreset, generateBoolean, generateCep, generateCnpj, generateCompanyPreset, generateCpf, generateCurrency, generateDate, generateEdgeCasesPreset, generateEmail, generateFirstName, generateHexColor, generateInteger, generateIp, generateLastName, generatePassword, generatePercentage, generatePersonPreset, generatePhone, generateTestCard, generateTimestamp, generateUrl, isValidCep, isValidCnpj, isValidCpf, isValidEmail, isValidPhone, isValidUuid } from "./index";

describe("geradores", () => {
  it("gera CPF válido e permite formatá-lo", () => {
    const cpf = generateCpf();
    expect(isValidCpf(cpf)).toBe(true);
    expect(formatCpf(cpf)).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
  });

  it("gera e-mail em domínio reservado", () => {
    expect(generateEmail()).toMatch(/^[a-z]+\.[a-z]+\d+@example\.com$/);
  });

  it("gera senha com tamanho esperado", () => {
    expect(generatePassword()).toHaveLength(12);
  });

  it("permite alternar a máscara de CPF e telefone", () => {
    expect(formatCpf(generateCpf())).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    expect(generatePhone(true)).toMatch(/^\(\d{2}\) 9\d{4}-\d{4}$/);
    expect(generatePhone(false)).toMatch(/^119\d{8}$/);
  });

  it("gera cartões de teste variados por bandeira", () => {
    expect(generateTestCard("mastercard", false)).toMatch(/^\d{16}$/);
    expect(generateTestCard("amex", true)).toMatch(/^\d{4} \d{6} \d{5}$/);
    expect(generateTestCard("elo", false)).toMatch(/^\d{16}$/);
  });

  it("gera um preset de pessoa física coerente", () => {
    const person = JSON.parse(generatePersonPreset(false)) as Record<string, string>;
    expect(person.nome).toMatch(/^\S+ \S+$/);
    expect(person.cpf).toMatch(/^\d{11}$/);
    expect(person.email).toContain("@example.com");
    expect(person.telefone).toMatch(/^119\d{8}$/);
    expect(person.dataNascimento).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(person.senha).toHaveLength(12);
  });

  it("gera primeiro nome e sobrenome separadamente", () => {
    expect(generateFirstName()).toMatch(/^\S+$/);
    expect(generateLastName()).toMatch(/^\S+$/);
  });

  it("gera CNPJ válido e formatável", () => {
    const cnpj = generateCnpj();
    expect(cnpj).toMatch(/^\d{14}$/);
    expect(formatCnpj(cnpj)).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
    const validate = (value: string) => {
      const digits = value.split("").map(Number);
      return [12, 13].every((length) => {
        const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        const sum = digits.slice(0, length).reduce((total, digit, index) => total + digit * weights[index], 0);
        const expected = (sum % 11 < 2 ? 0 : 11 - sum % 11);
        return expected === digits[length];
      });
    };
    expect(validate(cnpj)).toBe(true);
  });

  it("gera CEP com e sem máscara", () => {
    expect(generateCep()).toMatch(/^\d{8}$/);
    expect(formatCep(generateCep())).toMatch(/^\d{5}-\d{3}$/);
  });

  it("gera data compatível com input date", () => {
    expect(generateDate(false)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(generateDate(true)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("gera um preset de pessoa jurídica coerente", () => {
    const company = JSON.parse(generateCompanyPreset(false)) as Record<string, string>;
    expect(company.razaoSocial).toMatch(/Ltda\.$/);
    expect(company.cnpj).toMatch(/^\d{14}$/);
    expect(company.email).toContain("@example.com");
    expect(company.telefone).toMatch(/^119\d{8}$/);
    expect(company.cep).toMatch(/^\d{8}$/);
    expect(company.estado).toMatch(/^[A-Z]{2}$/);
    expect(company.cidade.length).toBeGreaterThan(0);
  });

  it("gera um preset de endereço coerente", () => {
    const address = JSON.parse(generateAddressPreset(false)) as Record<string, string>;
    expect(address.cep).toMatch(/^\d{8}$/);
    expect(address.rua.length).toBeGreaterThan(0);
    expect(address.numero).toMatch(/^\d+$/);
    expect(address.bairro.length).toBeGreaterThan(0);
    expect(address.cidade.length).toBeGreaterThan(0);
    expect(address.estado).toMatch(/^[A-Z]{2}$/);
  });

  it("gera casos de borda para validações", () => {
    const edgeCases = JSON.parse(generateEdgeCasesPreset()) as Record<string, unknown>;
    expect(edgeCases.vazio).toBe("");
    expect(edgeCases.nulo).toBeNull();
    expect(edgeCases.unicode).toContain("ação");
    expect(String(edgeCases.textoLongo)).toHaveLength(500);
  });

  it("gera resposta de API paginada", () => {
    const response = JSON.parse(generateApiResponsePreset()) as {
      data: Array<Record<string, unknown>>;
      meta: { page: number; totalPages: number };
      links: { next: string };
    };
    expect(response.data).toHaveLength(3);
    expect(response.data[0].id).toEqual(expect.any(String));
    expect(response.meta.page).toBe(1);
    expect(response.meta.totalPages).toBe(9);
    expect(response.links.next).toBe("/api/users?page=2");
  });

  it("valida documentos e formatos técnicos", () => {
    expect(isValidCpf(generateCpf())).toBe(true);
    expect(isValidCnpj(generateCnpj())).toBe(true);
    expect(isValidEmail("qa@example.com")).toBe(true);
    expect(isValidEmail("invalid")).toBe(false);
    expect(isValidUuid(crypto.randomUUID())).toBe(true);
    expect(isValidCep("01310-100")).toBe(true);
    expect(isValidPhone("(11) 99876-5432")).toBe(true);
    expect(isValidPhone("123")).toBe(false);
  });

  it("gera respostas de erro HTTP", () => {
    const response = JSON.parse(generateApiErrorPreset()) as { error: { code: string; message: string }; status: number; timestamp: string };
    expect([400, 401, 404, 422, 500]).toContain(response.status);
    expect(response.error.code).toMatch(/^[A-Z_]+$/);
    expect(response.error.message.length).toBeGreaterThan(0);
    expect(Number.isNaN(Date.parse(response.timestamp))).toBe(false);
  });

  it("gera URL e IP reservados para teste", () => {
    expect(generateUrl()).toMatch(/^https:\/\/www\.example\.com\//);
    expect(generateIp()).toMatch(/^192\.0\.2\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-4])$/);
  });

  it("gera valores financeiros formatados e sem máscara", () => {
    expect(generateCurrency(true)).toMatch(/^R\$\s/);
    expect(generateCurrency(false)).toMatch(/^\d+\.\d{2}$/);
    expect(generatePercentage(true)).toMatch(/^\d+,\d{2}%$/);
    expect(generatePercentage(false)).toMatch(/^\d+\.\d{2}$/);
  });

  it("gera valores técnicos simples", () => {
    expect(generateBoolean()).toMatch(/^(true|false)$/);
    expect(generateInteger()).toMatch(/^-?\d+$/);
    expect(generateHexColor()).toMatch(/^#[0-9a-f]{6}$/);
    expect(generateTimestamp()).toMatch(/^\d{13}$/);
  });

  it("respeita tamanhos configuráveis de senha e texto", () => {
    expect(generatePassword(24)).toHaveLength(24);
    expect(generatePassword(100)).toHaveLength(64);
  });
});
