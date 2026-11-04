import { describe, expect, it } from "vitest";
import { getInstructionSteps, parseList, setInstructionSteps } from "./exerciseUtils";

describe("getInstructionSteps", () => {
  it("đọc mảng bước theo ngôn ngữ, rơi về en khi thiếu", () => {
    const data = { en: ["Lie down", "Press"], it: ["Sdraiati"] };
    expect(getInstructionSteps(data, "vi")).toEqual(["Lie down", "Press"]);
    expect(getInstructionSteps(data, "it")).toEqual(["Sdraiati"]);
  });

  it("tách chuỗi theo dòng / câu", () => {
    expect(getInstructionSteps("Step one.\nStep two.", "en")).toEqual(["Step one.", "Step two."]);
    expect(getInstructionSteps({ en: "Lie flat. Lift up." }, "en")).toEqual(["Lie flat.", "Lift up."]);
  });

  it("dữ liệu rỗng -> mảng rỗng", () => {
    expect(getInstructionSteps(null, "vi")).toEqual([]);
  });
});

describe("setInstructionSteps", () => {
  it("giữ bản dịch ngôn ngữ khác khi dữ liệu theo ngôn ngữ", () => {
    expect(setInstructionSteps({ en: ["a"] }, "vi", ["b", " "])).toEqual({ en: ["a"], vi: ["b"] });
  });

  it("dữ liệu thường -> mảng bước; rỗng -> null", () => {
    expect(setInstructionSteps(null, "vi", ["x"])).toEqual(["x"]);
    expect(setInstructionSteps(["x"], "vi", [])).toBeNull();
  });
});

describe("parseList", () => {
  it("tách theo dấu phẩy", () => {
    expect(parseList("triceps, delts ,")).toEqual(["triceps", "delts"]);
    expect(parseList(" ")).toBeNull();
  });
});
