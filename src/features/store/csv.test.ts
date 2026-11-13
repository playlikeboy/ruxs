import { describe, expect, it } from "bun:test";
import { csvCell, paiseToRupeesText, parseCsv, parseCsvBool, parseProductImportCsv, parseStockCsv, PRODUCT_CSV_HEADERS, rupeesTextToPaise, toCsv } from "./csv";

describe("parseCsv", () => {
  it("reads quoted cells, doubled quotes, commas and newlines inside quotes", () => {
    expect(parseCsv('a,b,c\r\n1,"x, y","say ""hi"""\n2,"line1\nline2",\n')).toEqual([
      ["a", "b", "c"],
      ["1", "x, y", 'say "hi"'],
      ["2", "line1\nline2", ""],
    ]);
  });

  it("drops blank lines and a BOM", () => {
    expect(parseCsv("﻿sku,stock\n\n , \nA,1")).toEqual([
      ["sku", "stock"],
      ["A", "1"],
    ]);
  });
});

describe("csv cells", () => {
  it("quotes what needs quoting", () => {
    expect(csvCell('He said "hi", twice')).toBe('"He said ""hi"", twice"');
    expect(csvCell(null)).toBe("");
    expect(csvCell(12)).toBe("12");
    expect(csvCell(true)).toBe("yes");
  });

  it("defuses spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(\"http://evil\")")).toBe("\"'=HYPERLINK(\"\"http://evil\"\")\"");
    expect(csvCell("+919876543210")).toBe("'+919876543210");
    expect(csvCell("-5")).toBe("'-5");
    expect(csvCell("@cmd")).toBe("'@cmd");
    expect(csvCell(-5)).toBe("-5");
  });

  it("round-trips through parseCsv", () => {
    const rows = [["RS-1", 'Kit, "deluxe"', "two\nlines"]];
    expect(parseCsv(toCsv(["sku", "name", "notes"], rows))).toEqual([["sku", "name", "notes"], ...rows]);
  });
});

describe("rupee text", () => {
  it("converts without floats", () => {
    expect(rupeesTextToPaise("349")).toBe(34900);
    expect(rupeesTextToPaise("349.5")).toBe(34950);
    expect(rupeesTextToPaise("349.05")).toBe(34905);
    expect(rupeesTextToPaise("₹1,299.00")).toBe(129900);
    expect(rupeesTextToPaise("Rs. 19.99")).toBe(1999);
    expect(rupeesTextToPaise("0.29")).toBe(29);
    for (const bad of ["", "abc", "12.345", "-5", "1e3", "12."]) expect(rupeesTextToPaise(bad)).toBeNull();
  });

  it("formats paise as rupees", () => {
    expect(paiseToRupeesText(34950)).toBe("349.50");
    expect(paiseToRupeesText(5)).toBe("0.05");
    expect(paiseToRupeesText(0)).toBe("0.00");
    expect(rupeesTextToPaise(paiseToRupeesText(129905))).toBe(129905);
  });

  it("reads yes/no", () => {
    expect(parseCsvBool("Yes")).toBe(true);
    expect(parseCsvBool("0")).toBe(false);
    expect(parseCsvBool("maybe")).toBeNull();
  });
});

describe("parseProductImportCsv", () => {
  it("reads typed fields and leaves blank cells out", () => {
    const csv = [
      "sku,name,category,price,mrp,stock,skills,active,age_max",
      'rs-new-1,"Solar robot kit",Robotics-Electronics,899,999.50,12,STEM | Problem solving,yes,14',
      "RS-OLD-1,,,749,-,,,,none",
    ].join("\n");
    const r = parseProductImportCsv(csv);
    expect(r.fatal).toBeNull();
    expect(r.errors).toEqual([]);
    expect(r.rows[0]).toEqual({
      line: 2,
      sku: "RS-NEW-1",
      fields: { name: "Solar robot kit", categoryId: "robotics-electronics", pricePaise: 89900, mrpPaise: 99950, stock: 12, skills: ["STEM", "Problem solving"], isActive: true, ageMax: 14 },
    });
    expect(r.rows[1]).toEqual({ line: 3, sku: "RS-OLD-1", fields: { pricePaise: 74900, mrpPaise: null, ageMax: null } });
  });

  it("reports bad rows with their line and keeps the good ones", () => {
    const csv = ["sku,name,price,stock,active", "A-1,Kit,12.345,1,yes", ",Nameless,10,1,yes", "A-2,Kit,10,x,yes", "A-3,Kit,10,2,perhaps", "A-4,Kit,10,2,no", "A-4,Dup,10,2,no", "A-5,Kit,10,-2,no"].join("\n");
    const r = parseProductImportCsv(csv);
    expect(r.rows.map((x) => x.sku)).toEqual(["A-4"]);
    expect(r.errors.map((e) => [e.line, e.sku])).toEqual([
      [2, "A-1"],
      [3, null],
      [4, "A-2"],
      [5, "A-3"],
      [7, "A-4"],
      [8, "A-5"],
    ]);
  });

  it("refuses files it can't trust", () => {
    expect(parseProductImportCsv("").fatal).toBeTruthy();
    expect(parseProductImportCsv("name,price\nKit,10").fatal).toContain("sku");
    expect(parseProductImportCsv("sku,colour\nA,red").fatal).toContain("colour");
    expect(parseProductImportCsv("sku,name,name\nA,x,y").fatal).toBeTruthy();
    expect(parseProductImportCsv(["sku", ...Array.from({ length: 501 }, (_, i) => `S-${i}`)].join("\n")).fatal).toContain("500");
  });

  it("accepts every export header", () => {
    expect(parseProductImportCsv(`${PRODUCT_CSV_HEADERS.join(",")}\nA-1`).fatal).toBeNull();
  });
});

describe("parseStockCsv", () => {
  it("reads sku,stock", () => {
    const r = parseStockCsv("SKU,Stock\nrs-1,10\nRS-2,x\nRS-1,3\n,4");
    expect(r.rows).toEqual([{ line: 2, sku: "RS-1", qty: 10 }]);
    expect(r.errors.map((e) => e.line)).toEqual([3, 4, 5]);
    expect(parseStockCsv("a,b\n1,2").fatal).toBeTruthy();
  });
});
