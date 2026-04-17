import { createClientSchema } from "@/lib/validation-schemas";

describe("createClientSchema - numeric normalization and validation", () => {
  it("accepts numeric values provided as strings", () => {
    const parsed = createClientSchema.parse({
      nom: "Client Test",
      effectifs: "25",
      capitalSocial: "1000000.50",
      chiffreAffaires: "2500000",
      exposition: "45000",
    });

    expect(parsed.effectifs).toBe(25);
    expect(parsed.capitalSocial).toBe(1000000.5);
    expect(parsed.chiffreAffaires).toBe(2500000);
    expect(parsed.exposition).toBe(45000);
  });

  it("rejects negative values", () => {
    expect(() =>
      createClientSchema.parse({
        nom: "Client Test",
        effectifs: "-2",
      })
    ).toThrow();
  });

  it("converts empty numeric values to null", () => {
    const parsed = createClientSchema.parse({
      nom: "Client Test",
      effectifs: "",
      capitalSocial: "",
      chiffreAffaires: "",
      exposition: "",
    });

    expect(parsed.effectifs).toBeNull();
    expect(parsed.capitalSocial).toBeNull();
    expect(parsed.chiffreAffaires).toBeNull();
    expect(parsed.exposition).toBeNull();
  });
});
